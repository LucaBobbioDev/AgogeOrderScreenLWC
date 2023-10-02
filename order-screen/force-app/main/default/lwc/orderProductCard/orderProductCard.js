import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OrderProductCard extends LightningElement {
    @api product;

    @track totalListPrice;
    @track iconVariant = '';
    @track orderItem = {
        orderItemId: null,
        pricebookEntryId: null,
        productId: null,
        productName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        discount: 0,
        wasSelected: false,
        wasDeleted: false
    };

    get orderItemContainerClass() {
        return this.orderItem.wasSelected ? 'container selected' : 'container';
    }
    get buttonClass() {
        return this.orderItem.wasSelected ? 'slds-button slds-box slds-box_x-small slds-text-align_center slds-button_success' : 'slds-button slds-box slds-box_x-small slds-text-align_center slds-button_neutral';
    }
    get buttonText() {
        return this.orderItem.wasSelected ? 'Adicionado ' : 'Adicionar ao';
    }
    get iconType(){
        return this.orderItem.wasSelected ? 'standard:webcart' : 'utility:cart';
    }
    get iconSize(){
        return this.orderItem.wasSelected ? 'medium' : 'small';
    }
    connectedCallback() {
        this.initializeOrderItem();
    }

    initializeOrderItem() {
        const isExistingItem = !!this.product.orderItemId;
    
        this.orderItem.pricebookEntryId = this.product.pricebookEntryId;
        this.orderItem.productId = this.product.productId;
        this.orderItem.productName = this.product.productName;
        this.orderItem.unitPrice = this.product.unitPrice;
    
        if (isExistingItem || this.product.quantity != 0) {
            this.orderItem.orderItemId = this.product.orderItemId;
            this.orderItem.quantity = this.product.quantity;
            this.orderItem.listPrice = this.product.listPrice;
            this.orderItem.unitPrice = this.product.unitPrice;
            this.orderItem.totalPrice = this.product.totalPrice;
            this.orderItem.discount = this.product.discount;
            this.handleSelected();
        } else {
            this.orderItem.listPrice = this.product.unitPrice;
        }
    }

    @api deletedProductsData(deletedProductData) {
        deletedProductData.forEach(item => {
            if (this.orderItem.productId === item.productId) {
                this.orderItem.wasDeleted = true;
                this.orderItem.wasSelected = false;
                this.iconVariant = '';
            }
        });
    }
    
    onClickCart() {
        if (!this.handleSelected()) return;
        const event = new CustomEvent('productselected', {
            bubbles: true,
            composed: true,
            detail: {
                orderItem: this.orderItem
            }
        });
        
        this.dispatchEvent(event);
    }

    notifyParent() {
        const validFields = this.checkItemFields();
            if (this.orderItem.orderItemId) {
                if (validFields) {
                this.dispatchEvent(new CustomEvent('orderitemchange', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        orderItem: this.orderItem
                    }
                }));
            } else {
                return;
            }
        }
    }

    updateTotalPrice() {
        this.orderItem.totalPrice = this.orderItem.unitPrice * this.orderItem.quantity;
        this.totalListPrice = this.orderItem.listPrice * this.orderItem.quantity;
        this.notifyParent();
    }

    onClickQuantityPlus() {
        this.orderItem.quantity = parseInt(this.orderItem.quantity, 10) + 1;
        this.updateTotalPrice();
    }

    onClickQuantityDash() {
        if (this.orderItem.quantity <= 0) return;
        this.orderItem.quantity = parseInt(this.orderItem.quantity, 10) - 1;
        this.updateTotalPrice();
    }

    changeQuantity(event) {
        const value = event.target.value;
        this.orderItem.quantity = Number(value);
        this.updateTotalPrice();
    }

    changeDiscount(event) {
        const value = event.target.value;
        if (value < 0 || value === "" || value === null) {
            this.orderItem.discount = 0;
        }
        const discountPrice = this.orderItem.listPrice - (this.orderItem.listPrice * (value / 100)).toFixed(2);
        this.orderItem.unitPrice = discountPrice; 
        this.updateTotalPrice();       
    }

    changeUnitPrice(event) {
        const value = event.target.value;
        let price = Number(value);
        const discount = (100 - (price / this.orderItem.listPrice) * 100).toFixed(2);
        this.orderItem.unitPrice = value;
        this.orderItem.discount = discount;
        this.updateTotalPrice();
    }

    handleSelected() {
        const validFields = this.checkItemFields();

        if (validFields) {
            this.orderItem.wasSelected = true;
        } else {
            this.iconVariant = 'error';
        }

        return validFields;
    }

    checkItemFields() {
        const validPrice = this.orderItem.unitPrice >= 0 && this.orderItem.unitPrice <= this.orderItem.listPrice && this.orderItem.unitPrice !== "";
        const validQuantity = this.orderItem.quantity > 0 && this.orderItem.quantity !== "";
        const validDiscount = this.orderItem.discount >= 0 && this.orderItem.discount !== "";

        if (!validPrice) {
            this.handlerToast("Preço inválido", "O valor do não pode ser superior ao preço de lista.", "error");
        }
        if (!validQuantity) {
            this.handlerToast("Quantidade inválida", "Verifique a quantidade de produtos desejada", "error");
        }
        if (!validDiscount) {
            this.handlerToast("Valor do desconto Inválido", "Verifique o valor do desconto desejado", "error");
        }

        return validPrice && validQuantity && validDiscount;
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