import { LightningElement, wire, track, api} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

import getOrderById from '@salesforce/apex/OrderDataController.getOrderById';

export default class OrderPage extends LightningElement {
    @track current = 'step1';
    @track accountRecordId = null;
    @track orderId = null;
    @track showOrderHeader = true;
    @track showOrderItem = false;
    @track showOrderSummary = false;
    @track currentOrder = '';

    @track orderHeaderData = {};
    @track orderItemData = [{}];
    @track deletedOrderItems = [];

    @api accountId;
    @api recordId;

    get getAccountId() { 
        return this.isFilled(this.accountId)? this.accountRecordId = this.accountId: null;
    }
   
    connectedCallback() {
        this.loadVariable();
        if (this.isFilled(this.recordId)) {
            this.getOrder(this.recordId);
        }
    }

    getOrder(orderId){
        getOrderById({ orderId: orderId })
            .then(result => {
                if (this.isFilled(result)) {
                    const { mappedHeaderData, mappedItemData } = this.mapOrderData(result);
                    this.orderHeaderData = mappedHeaderData;
                    this.orderItemData = mappedItemData;
                    this.handleBackToOrderHeader();
                    this.handleBackToOrderItem();
                }
            })
            .catch(error => {
                console.error('Erro ao buscar informações do pedido:', error);
            });
    }

    async loadVariable() {
        await this.recordId;
    }
    
    mapOrderData(data) {
        const { orderData, orderItemsDataList } = data;
    
        const mappedHeaderData = {
            orderId: orderData.Id,
            accountId: orderData.Account.Id,
            accountName: orderData.Account.Name,
            addressId: this.isFilled(orderData.AccountAddress__c) ? orderData.AccountAddress__c : null,
            addressName: this.isFilled(orderData.AccountAddress__r) ? orderData.AccountAddress__r.Name : null,
            paymentConditionId: this.isFilled(orderData.PaymentTerms__c) ? orderData.PaymentTerms__c : null,
            paymentConditionName: this.isFilled(orderData.PaymentTerms__r) ? orderData.PaymentTerms__r.Name : null,
            pricebookId: orderData.Pricebook2Id,
            description: orderData.Observations__c
        };

        const mappedItemData = orderItemsDataList.map(item => ({
            orderItemId: item.Id,
            orderId: item.OrderId,
            productId: item.Product2Id,
            productName: item.Product2.Name,
            quantity: item.Quantity,
            listPrice: item.ListPrice,
            unitPrice: item.UnitPrice,
            totalPrice: item.TotalPrice,
            discount: item.Discount__c
        }));
        return { mappedHeaderData, mappedItemData };
    }

    clearOrderPageData() {
        this.orderHeaderData = {};
        this.orderItemData = [{}];
        this.deletedOrderItems = [];
        this.selectedAccountId = null;
        this.selectedOrderId = null;
    }

    handleNextStep(nextStep) {
        const currentStepValue = this.current;
        if (currentStepValue === 'step1' && nextStep === 'step2') {
            this.showOrderComponent(false, true, false);
        } else if (currentStepValue === 'step2') {
            if (nextStep === 'step1') {
                this.showOrderComponent(true, false, false);
            } else if (nextStep === 'step3') {
                this.showOrderComponent(false, false, true);
            }
        } else if (currentStepValue === 'step3' && nextStep === 'step2') {
            this.showOrderComponent(false, true, false);

        }  else if (currentStepValue === 'step3' && nextStep === 'step1') {
            this.showOrderComponent(true, false, false);
        }
    }

    handleResetScreen(event) {
        const orderId = event.detail.orderId;
        this.currentOrder = orderId;
        const nextStep = event.detail.step;
        this.handleNextStep(nextStep);

        this.orderHeaderData = {};
        this.orderItemData = [{}];
        this.selectedAccountId = null;
        this.currentOrder = '';

        this.dispatchEvent(new CustomEvent('cleardata'));
    }
    
    handleOrderHeader(event) {
        this.orderHeaderData = event.detail.orderHeaderData;
        const nextStep = event.detail.step;
        this.handleNextStep(nextStep);
    }

    handleClearOrderHeader(event) {
        this.clearOrderPageData();
        this.orderHeaderData = event.detail.cleanOrderData;
    }

    handleCleanAccount(event){
        this.accountId = null;
    }

    handleOrderItem(event){
        this.orderItemData = event.detail.orderItemData;
        this.deletedOrderItems = event.detail.deletedOrderItems;
        const nextStep = event.detail.step;
        this.handleNextStep(nextStep);
    }

    handleOrderSummary(event){
        const nextStep = event.detail.step;
        this.handleNextStep(nextStep)
    }

    handleBackToOrderHeader() {
        const orderHeaderComponent = this.template.querySelector('c-order-header');
        if (orderHeaderComponent) {
            orderHeaderComponent.receiveDataFromParent(this.orderHeaderData);
        } else {
            console.log('Não foi encontrado o componente orderHeader -' + orderHeaderComponent);
        }
    }

    handleBackToOrderItem(){
        const orderItemComponent = this.template.querySelector('c-order-item');
        if (orderItemComponent) {
            orderItemComponent.receiveDataFromParent(this.orderItemData);
        } else {
            console.log('Não foi encontrado o componente orderItem -' + orderItemComponent);
        }
    }

    showOrderComponent(showHeaderComponent, showItemsComponent, showSummaryComponent) {
        this.current = showItemsComponent ? 'step2' : (showSummaryComponent ? 'step3' : 'step1');
        this.showOrderHeader = showHeaderComponent;
        this.showOrderItem = showItemsComponent;
        this.showOrderSummary = showSummaryComponent;

        if (showHeaderComponent === true) {
            setTimeout(() => {
                this.handleBackToOrderHeader();
            }, 10);
        } else if(showItemsComponent === true){
            setTimeout(() => {
                this.handleBackToOrderItem();
            }, 10);
        }
    }

    isFilled(field) {
        return ((field !== undefined && field != null && field != '') || field == 0);
    }
}