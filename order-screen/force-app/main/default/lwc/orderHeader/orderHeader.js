import { LightningElement, wire, api, track } from 'lwc';

import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getDefaultPricebook from '@salesforce/apex/OrderDataController.getDefaultPricebook';

export default class OrderHeader extends NavigationMixin(LightningElement) {
    @api accountId; 
    @track defaultPricebookId = null;
   
    @track orderHeaderData = {
        orderId: '',
        accountId: null,
        accountName: null,
        addressId: null,
        addressName: '',
        paymentConditionName: '',
        paymentConditionId: null,
        pricebookName: '',
        pricebookId: null,
        description: ''
    };

    @api
    receiveDataFromParent(data) {
        this.orderHeaderData = Object.assign(this.orderHeaderData, data);
    }

    get selectedAccountId() {
        return this.accountId ? this.accountId : this.orderHeaderData.accountId;
    }

    @wire(getDefaultPricebook)
    wiredPricebook({ error, data }) {
        if (data) {
            const pricebookId = data.map(pricebook => pricebook.Id);
            this.defaultPricebookId = pricebookId[0];
        }
        else if (error) {
            console.log('Erro ao recuperar o pricebookId');
        }
    }

    handleAccountValue(event) { 
        this.accountId = event.detail.record.Id
        this.orderHeaderData.accountId = event.detail.record.Id;
        this.orderHeaderData.accountName = event.detail.record.Name;
        clearPaymentCondititon();
    }

    handlePaymentCondition(event) {
        this.orderHeaderData.paymentConditionId = event.detail.record.Id;
        this.orderHeaderData.paymentConditionName = event.detail.record.Name;
    }

    handleAddress(event) {
        this.orderHeaderData.addressId = event.detail.record.Id;
        this.orderHeaderData.addressName = event.detail.record.Logradouro__c
    }

    handlePricebook(event) {
        this.orderHeaderData.pricebookId = event.detail.record.Id;
        this.orderHeaderData.pricebookName = event.detail.record.Name;

    }

    handleDescription(event) {
        this.orderHeaderData.description = event.target.value;
    }

	clearAccount() {    
        this.orderHeaderData.accountId = null;
        this.orderHeaderData.accountName = '';
        this.orderHeaderData.addressId = null;
        this.orderHeaderData.addressName = '';
        this.accountId = null;
        this.dispatchEvent(new CustomEvent('cleanaccount'));
	}

    clearPaymentCondititon() {
        this.orderHeaderData.paymentConditionId = null;
        this.orderHeaderData.paymentConditionName = '';
    }

    clearAccountAddress() {
        this.orderHeaderData.addressId = null;
        this.orderHeaderData.addressName = '';
    }

    handleOrder() {
        const nextStep = 'step2';
        const checkFields = this.checkHeaderFields();

        if (checkFields.length > 0) {
			this.handlerToast(
				'Informações obrigatórias ausentes!',
				'Verifique os seguintes campos ' + ': ' + checkFields.join(', '),
				'error'
			);
			return;
		}
        this.dispatchEvent(new CustomEvent('orderheader', {
            detail: {
                step: nextStep,
                orderHeaderData: this.orderHeaderData
            }
        }));
    }

    checkHeaderFields() {
        let nullFields = []

        const orderHead = {...this.orderHeaderData}

        for (let field in orderHead) {
            if (orderHead[field] === null) {
                nullFields.push(field);
            }
        }

        return nullFields.map(field => {
            if (field === "paymentConditionId") {
                return "Condição de pagamento";
            }
            else if (field === "addressId") {
                return "Endereço de entrega";
            }
            else if (field === "accountId") {
                return "Cliente";
            } 
            else {
                return field;
            }
        });
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Account',
                actionName: 'list'
            }
        });
        this.clearOrderData();
    }

    clearOrderData() {
        const cleanOrderData = {
            accountId: null,
            accountName: null,
            addressId: null,
            addressName: '',
            paymentConditionName: '',
            paymentConditionId: null,
            description: ''
        };
        this.accountId = null;
        this.orderHeaderData = cleanOrderData;

        this.dispatchEvent(new CustomEvent('cleardata', {
            detail: { cleanOrderData }
        }));
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

    accountFields = ['Name'];
    accountOptions = { title: 'Name' };
    
    addressFields = ['Logradouro__c'];
    addressOptions = { title: 'Logradouro__c'};
    addressOperator = ['='];
    addressWhereFieldList = ['Account__c'];
    get addressAccountId() { return [this.orderHeaderData.accountId] }
    
    paymentFields = ['Name'];
    paymentOptions = { title: 'Name'};

    pricebookFields = ['Name'];
    pricebookOptions = { title: 'Name'};
    pricebookOperator = ['='];
    pricebookWhereFieldList = ['IsStandard'];
    pricebookWhereFieldListValue = [true];
}