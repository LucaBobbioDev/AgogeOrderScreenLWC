import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class OrderButton extends NavigationMixin(LightningElement)  {
    @api recordId;
    
    @api
    async invoke() {
        if (this.recordId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'Order_Page'
                },
                state: {
                    'c__accountId': this.recordId
                }
            });
        }
    }
}