import { LightningElement, api, wire, track } from 'lwc';

import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getMinOrderPrice from '@salesforce/apex/OrderDataController.getMinOrderPrice';
import processOrderDataRecord from '@salesforce/apex/OrderDataController.processOrderDataRecord';

export default class OrderSummary extends NavigationMixin(LightningElement) {
    @api orderHeader;
    @api currentOrder = ''; 
    @api orderItemData = [{}];
    @api deletedOrderItems = [];

    @track totalOrderValue = 0;
    @track minValue = 0;
    @track orderId;

    columns = [
        { label: 'Produto', fieldName: 'productName', type: 'text' },
        { label: 'Quantidade', fieldName: 'quantity', type: 'number' },
        { label: 'Preço Unitário', fieldName: 'unitPrice', type: 'currency' },
        { label: 'Preço Total', fieldName: 'totalPrice', type: 'currency' }
    ];
    

    get orderItemDataSummary() {
        if (Array.isArray(this.orderItemData) && this.orderItemData.length > 0) {
            return this.orderItemData.filter(obj => Object.keys(obj).length > 0);
        }
        return [];
    }

    @wire(getMinOrderPrice)
    wiredOrderPrice({error, data}) {
        if (data) {
            let value = data;
            this.minValue = value;
            console.log('Valor mínimo do pedido: ' + this.minValue);
        } else if (error) {
            console.error('Erro ao recuperar valor mínimo: ' + error);
            this.handlerToast(
                "Erro ao Recuperar o valor mínimo do pedido",
                "Contatar o administrador do sistema",
                "error"
            );
        }
    }
    
    connectedCallback() {
        this.calcTotalPrice();
    }

    handleFinish(event) {
        if(!this.checkOrderTotalValue())
            return;

        if (this.currentOrder === '') {

            this.sendOrderData();
            this.resetOrderScreen();
            this.navigateToOrderList();
        }
        else {
            this.handlerToast('Produto já cadastrado na base de dados', '', 'warning');
        }
    
    }

    navigateToOrderList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                recordId: this.orderId,
                objectApiName: 'Order',
                actionName: 'list'
            }
        });

        this.handlerToast('Sucesso!', 'Seu pedido foi criado com sucesso!', 'success');
    }

    sendOrderData() {
        processOrderDataRecord({ 
            orderData: JSON.stringify(this.orderHeader),
            orderItemsData: JSON.stringify(this.orderItemDataSummary),
            deletedOrderItemsData: JSON.stringify(this.deletedOrderItems)
        })
        .then(result => {
            this.orderId = result;
        })
        .catch(error => {
            console.log('Error send data: ' + JSON.stringify(error));
        })
    }

    handleBackTo(event) {
        const nextStep = 'step2'
        this.dispatchEvent(new CustomEvent('ordersummary',{
            detail:{
                step: nextStep
            }
        }));
    }

    resetOrderScreen() {
        const nextStep = 'step1'
        this.dispatchEvent(new CustomEvent('resetorderscreen',{
            detail:{
                step: nextStep,
                orderId: this.orderId
            }
        }));
    }

    calcTotalPrice() {
        const items = this.orderItemData;
        const totalPrice = items
            .filter(item => item.totalPrice !== undefined)
            .reduce((total, item) => total + item.totalPrice, 0);

        this.totalOrderValue = totalPrice;
    }

    checkOrderTotalValue() {
        const fullPrice = true;
        if (this.totalOrderValue < this.minValue) {
            this.handlerToast(
                'Pedido abaixo do valor mínimo',
                'O valor mínimo para o trimestre é de' + ' R$ ' + this.minValue,
                'warning'
            );
            fullPrice = false;
        }

        return fullPrice;
    }

    handlerToast(title, message, variant) {
		this.dispatchEvent(
            new ShowToastEvent(
                {
                    title: title,
                    message: message,
                    variant: variant
			    }
            )
		);
	}
}