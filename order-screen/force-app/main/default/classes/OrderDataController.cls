public with sharing class OrderDataController {

    @AuraEnabled(cacheable=true)
    public static List<Pricebook2> getDefaultPricebook() {
        return [ SELECT Id, Name FROM Pricebook2 WHERE IsStandard = true AND IsActive = true ];
    }

    @AuraEnabled(cacheable=true)
    public static LoadProductVO getProducts(String searchTerm, Integer pageNumber, Integer pageSize) {
        searchTerm = String.isBlank(searchTerm) ? '%' : '%' + searchTerm + '%';
        Integer offset = (pageNumber - 1) * pageSize;

        return new LoadProductVO(searchTerm, pageSize, offset);
    }

    @AuraEnabled(cacheable=true)
    public static Decimal getMinOrderPrice(){
        return OrderConfiguration__mdt.getInstance('MinOrderValue').Value__c;
    }

    @AuraEnabled
    public static String processOrderDataRecord(String orderData, String orderItemsData, String deletedOrderItemsData) {
        try {
            OrderData orderDataSave = (OrderData)JSON.deserialize(orderData, OrderData.class);
            List<OrderItemsData> orderItemsDataSave = (List<OrderItemsData>)JSON.deserialize(orderItemsData, List<OrderItemsData>.class);
            List<OrderItemsData> deletedOrderItems = (List<OrderItemsData>)JSON.deserialize(deletedOrderItemsData, List<OrderItemsData>.class);
            
            Order order = prepareOrder(orderDataSave);
            upsert order;
            System.debug('Pedido criado: ' + order);

            try {
                processOrderItemsAndDeletedItems(orderItemsDataSave, deletedOrderItems, order);
            } catch (Exception e) {
                String error = 'Erro ao processar os itens do pedido: ' + e.getMessage();
                System.debug(error);
            }
            return order.Id;
        } catch (Exception e) {
            String error = 'Erro ao processar pedido: ' + e.getMessage();
            System.debug(error);
            return error;
        }
    }

    private static Order prepareOrder(OrderData orderDataSave) {
        Order order;
        if (String.isNotBlank(orderDataSave.orderId)) {
            order = [
                SELECT Id, AccountAddress__c, PaymentTerms__c, Observations__c 
                FROM Order 
                WHERE Id = :orderDataSave.orderId 
                LIMIT 1
            ];
            order.Observations__c = orderDataSave.description;
            order.AccountAddress__c = orderDataSave.addressId;
            order.PaymentTerms__c = orderDataSave.paymentConditionId;
        } else {
            order = new Order(
                AccountId = orderDataSave.accountId,
                Pricebook2Id = orderDataSave.pricebookId,
                Observations__c = orderDataSave.description,
                AccountAddress__c = orderDataSave.addressId,
                PaymentTerms__c = orderDataSave.paymentConditionId,
                EffectiveDate = System.today(),
                Status = 'Draft'
            );
        }
        return order;
    }

    private static void processOrderItemsAndDeletedItems(List<OrderItemsData> orderItemsDataSave, List<OrderItemsData> deletedOrderItems, Order order) {
        List<OrderItem> orderItemsToUpdate = new List<OrderItem>();
        List<OrderItem> orderItemsToInsert = new List<OrderItem>();
        List<OrderItem> orderItemsToUpdateNew = new List<OrderItem>();
        List<Id> orderItemIdsToUpdate = new List<Id>();
    
        processOrderItemsToUpdateAndInsert(orderItemsDataSave, order, orderItemsToUpdate, orderItemsToInsert, orderItemIdsToUpdate);
        if (!orderItemsToUpdate.isEmpty()) {
            processOrderItemsToUpdateNew(orderItemsDataSave, orderItemsToUpdate, orderItemsToUpdateNew);
        }
        processDeletedOrderItems(deletedOrderItems, order.Id);
        
        if (!orderItemsToUpdateNew.isEmpty()) {
            update orderItemsToUpdateNew;
        }
    
        if (!orderItemsToInsert.isEmpty()) {
            insert orderItemsToInsert;
        }
    }

    private static void processOrderItemsToUpdateAndInsert(List<OrderItemsData> orderItemsDataSave, Order order, List<OrderItem> orderItemsToUpdate, List<OrderItem> orderItemsToInsert, List<Id> orderItemIdsToUpdate) {
        for (OrderItemsData item : orderItemsDataSave) {
            if (String.isNotBlank(item.orderItemId)) {
                orderItemIdsToUpdate.add(item.orderItemId);
            } else {
                OrderItem newOrderItem = createNewOrderItem(order.Id, item);
                orderItemsToInsert.add(newOrderItem);
            }
        }
    
        if (!orderItemIdsToUpdate.isEmpty()) {
            orderItemsToUpdate.addAll([
                SELECT Id, Product2Id, Quantity, UnitPrice, ListPrice, TotalPrice, Discount__c
                FROM OrderItem WHERE Id IN :orderItemIdsToUpdate 
                AND OrderId = :order.Id
            ]);
        }
    }
    
    private static OrderItem createNewOrderItem(Id orderId, OrderItemsData item) {
        return new OrderItem(
            OrderId = orderId,
            Product2Id = item.pricebookEntryId,
            Quantity = item.quantity,
            UnitPrice = Decimal.valueOf(item.unitPrice),
            ListPrice = Decimal.valueOf(item.listPrice),
            Discount__c = Decimal.valueOf(item.discount)
        );
    }
    
    private static void processOrderItemsToUpdateNew(List<OrderItemsData> orderItemsDataSave, List<OrderItem> orderItemsToUpdate, List<OrderItem> orderItemsToUpdateNew) {
        Map<Id, OrderItemsData> orderItemIdToDataMap = new Map<Id, OrderItemsData>();
        for (OrderItemsData item : orderItemsDataSave) {
            orderItemIdToDataMap.put(item.orderItemId, item);
        }

        for (OrderItem orderItemToUpdate : orderItemsToUpdate) {
            OrderItemsData item = orderItemIdToDataMap.get(orderItemToUpdate.Id);
            if (item != null && orderItemToUpdate.Product2Id == item.productId) {
                orderItemToUpdate.Quantity = item.quantity;
                orderItemToUpdate.UnitPrice = Decimal.valueOf(item.unitPrice);
                orderItemToUpdate.Discount__c = Decimal.valueOf(item.discount);
                orderItemsToUpdateNew.add(orderItemToUpdate);
            } else {
                orderItemsToUpdateNew.add(orderItemToUpdate);
            }
        }
    }

    private static void processDeletedOrderItems(List<OrderItemsData> deletedOrderItems, Id orderId) {
        if (!deletedOrderItems.isEmpty()) {
            List<Id> itemIdsToDelete = new List<Id>();
            for (OrderItemsData deletedItem : deletedOrderItems) {
                itemIdsToDelete.add(deletedItem.orderItemId);
            }
            
            List<OrderItem> itemsToDelete = [
                SELECT Id FROM OrderItem
                WHERE Id IN :itemIdsToDelete
                AND OrderId = :orderId
            ];
            delete itemsToDelete;
        }
    }

    @AuraEnabled(cacheable=true)
    public static OrderDataWrapper getOrderById(Id orderId) {
        try {
            OrderDataWrapper result = new OrderDataWrapper();
            result.orderData = [
                SELECT Id, AccountId, Account.Name, Pricebook2Id, PaymentTerms__c, AccountAddress__c,
                PaymentTerms__r.Name, AccountAddress__r.Name,Observations__c
                FROM Order 
                WHERE Id = :orderId 
                LIMIT 1
            ];
            result.orderItemsDataList = [
                SELECT Id, OrderId, Product2Id, Product2.Name, Quantity, UnitPrice, ListPrice, TotalPrice, Discount__c 
                FROM OrderItem 
                WHERE OrderId = :orderId
            ];
            return result;
        } catch (Exception e) {
            System.debug('Error fetching order and order items: ' + e.getMessage());
            return null;
        }
    }

    public class OrderDataWrapper {
        @AuraEnabled public Order orderData;
        @AuraEnabled public List<OrderItem> orderItemsDataList;
    }

    public class OrderData {
        public String orderId {get; set;}
        public String accountId {get; set;}
        public String accountName {get; set;}
        public String addressId {get; set;}
        public String addressName {get; set;}       
        public String paymentConditionName {get; set;}       
        public String paymentConditionId {get; set;}
        public String pricebookName {get; set;}       
        public String pricebookId {get; set;}
        public String description {get; set;}
        
        public List<OrderItemsData> orderItems {get; set;}
    }
    
    public class OrderItemsData {
        public String orderItemId {get; set;}
        public String orderId {get; set;}
        public String pricebookEntryId {get; set;}
        public String productId {get; set;}
        public String productName {get; set;}
        public Integer quantity {get; set;}
        public String unitPrice {get; set;}
        public String listPrice {get; set;}
        public String totalPrice {get; set;}
        public String discount {get; set;}
    }

    public class LoadProductVO {
        @AuraEnabled
        public list<PricebookEntry> products;
        @AuraEnabled
        public Integer totalProducts;

        LoadproductVO(String searchTerm, Integer limitRecords, Integer offset) {
            this.products = [
                SELECT Id, Name, UnitPrice, Product2Id  
                FROM PricebookEntry 
                WHERE Pricebook2.IsStandard = true 
                AND (Name LIKE :searchTerm
                OR Product2.ProductCode LIKE :searchTerm) 
                LIMIT :limitRecords 
                OFFSET :offset 
            ];
            this.totalProducts = [
                SELECT COUNT() 
                FROM Product2 
                WHERE Name LIKE :searchTerm
                OR Product2.ProductCode LIKE :searchTerm
            ];
        }
    }
}