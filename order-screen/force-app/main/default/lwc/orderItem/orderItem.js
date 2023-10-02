import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OrderItem extends LightningElement {
    @track searchTerm = '';
    @track searchTimeout;
    @track orderItemData = [];
    @track deletedOrderItems = [];

    connectedCallback(){
        this.orderItemData;
    }
    @api receiveDataFromParent(data){
        if (Array.isArray(data) && data.length > 0) {
            const validData = data.filter(obj => Object.keys(obj).length > 0);
            if (validData.length > 0) {
                this.orderItemData = [...this.orderItemData, ...validData];     
                validData.forEach(item => { this.addToCart(item);});
            }
        }
    }

    addToCart(productData) {
        const shoppingCartComponent = this.template.querySelector('c-shopping-cart');
        shoppingCartComponent.productsInCart.push({
            productId: productData.productId,
            productName: productData.productName,
            quantity: productData.quantity,
            unitPrice: productData.unitPrice,
            totalPrice: productData.totalPrice,
        });
    }

    handleSearch(event) {
        clearTimeout(this.searchTimeout);
        const searchValue = event.target.value;

        this.searchTimeout = setTimeout(() => { 
            this.searchTerm = searchValue;}, 
            1000
        );
    }
    
    handleNavigation(event){
        const direction = event.target.name;
        let step;

        if (direction === 'previous') {
            step = 'step1';
        } else {
            if (this.orderItemData.length === 0) {
                this.handlerToast('Aviso!', 'Não é possível avançar com o pedido se o carrinho está vazio!', 'warning');
                return;
            }
            step = 'step3';
        }
        this.dispatchEvent(new CustomEvent('orderitem', {
            detail: {
                step: step,
                orderItemData: this.orderItemData,
                deletedOrderItems: this.deletedOrderItems
            }
        }));
    }

    handleProductSelected(event) {
        const shoppingCartComponent = this.template.querySelector('c-shopping-cart');
        const productData = event.detail.orderItem;
        
        const isProductInCart = shoppingCartComponent.productsInCart.some(item => { return item.productId === productData.productId; });

        if (isProductInCart) {
            this.handlerToast('Erro!', 'O produto já foi adicionado ao carrinho.', 'error');
        } else {
            if (productData.quantity > 0) {
                this.orderItemData.push(productData);
                this.addToCart(productData);
                this.handlerToast('Sucesso!', 'O produto foi adicionado ao carrinho!', 'success');
            }
        }
    }

    handleOrderItemChange(event) {
        const updatedOrderItem = event.detail.orderItem;
        const index = this.orderItemData.findIndex(item => item.orderItemId === updatedOrderItem.orderItemId);
        if (index !== -1) {
            this.orderItemData[index] = updatedOrderItem;
        }
    }

    handleProductDeleted(event) {
        const deletedProductId = event.detail.productId;
        const orderItemDataCopy = [...this.orderItemData];
        this.handleDeletedOrderItems(deletedProductId);
        this.orderItemData = orderItemDataCopy.filter(item => item.productId !== deletedProductId);
    }

    handleDeletedOrderItems(deletedProductsId) {
        const deletedItems = this.orderItemData.filter(item => item.productId === deletedProductsId);
        this.deletedOrderItems.push(...deletedItems);
        const productListComponent = this.template.querySelector('c-order-product-list');
        if (productListComponent) {
            productListComponent.deletedOrderItemsData(this.deletedOrderItems);
        }
    }
    

    handlerToast(title, message, variant) {
		this.dispatchEvent( new ShowToastEvent(
            {
                title: title, 
                message: message, 
                variant: variant
            }
        ));
	}
}