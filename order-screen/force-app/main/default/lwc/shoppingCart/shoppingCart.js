import { LightningElement, track, api } from 'lwc';

const columns = [
    { label: 'Produto', fieldName: 'productName', type: 'text' },
    { label: 'Quantidade', fieldName: 'quantity', type: 'number' },
    { label: 'Preço Unitário', fieldName: 'unitPrice', type: 'currency' },
    { label: 'Preço Total', fieldName: 'totalPrice', type: 'currency' },
    {
        label: 'Ações',
        type: 'button-icon',
        initialWidth: 75,
        typeAttributes: { 
            iconName: 'utility:delete', 
            alternativeText: 'Remover Produto',
            title: 'Remover Produto',
            variant: 'border-filled',
            disabled: false,
            value: 'delete'
        }
    }
];

export default class ShoppingCart extends LightningElement {
    @track showModal = false;
    @api productsInCart = [];
    columns = columns;

    get isCartEmpty() {
        return this.productsInCart.length === 0;
    }

    get totalPriceSum() {
        let sum = 0;
        this.productsInCart.forEach(item => {
            sum += item.totalPrice;
        });
        return sum;
    }

    openModal(){
        this.showModal = true;
    }

    closeModal(){
        this.showModal = false;
    }

    handleItemDelete(event) {
        try {
            const action = event.detail.action;
            const row = event.detail.row;

            if (action.value === 'delete') {
                const productId = row.productId;
                this.productsInCart = this.productsInCart.filter(item => item.productId !== productId);

                const productDeletedEvent = new CustomEvent('productdeleted', {
                    detail: { productId }
                });
                this.dispatchEvent(productDeletedEvent);                
            }
        } catch {
            console.error('Error in handleRowAction:', error);
        }
    }
}