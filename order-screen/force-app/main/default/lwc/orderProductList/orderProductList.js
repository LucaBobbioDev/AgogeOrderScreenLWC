import { LightningElement, track, api } from 'lwc';

import getProducts from '@salesforce/apex/OrderDataController.getProducts';

export default class OrderProductList extends LightningElement {

    pageSize = 6;
    _searchTerm = '';

    @track currentPage = 1;
    @track totalPages = 0;
    @track isFirstPage = true;
    @track isLastPage = false;
    @track hasError;
    @track data; 
    @track orderProducts = [];
    @track selectedProducts;

    @api orderItemSummary;
    @api context;
    @api get searchTerm() { return this._searchTerm; }

    @api deletedOrderItemsData(deletedProductData) {
        const productCardComponent = this.template.querySelector('c-order-product-card');
        if (productCardComponent) {
            productCardComponent.deletedProductsData(deletedProductData);
        }
    }

    set searchTerm(value) {
        this._searchTerm = value;
        this.loadProducts();
    }
    connectedCallback(){
        this.loadProducts();
    }

    loadProducts() {
        getProducts({ searchTerm: this.searchTerm, pageNumber: this.currentPage, pageSize: this.pageSize })
            .then(result => {
                const mappedProducts = result.products.map(product => ({
                    pricebookEntryId: product.Id,
                    productId: product.Product2Id,
                    productName: product.Name,
                    unitPrice: product.UnitPrice,
                    quantity: 0
                }));
                this.orderProducts = mappedProducts;
                this.totalPages = Math.ceil(result.totalProducts / this.pageSize);
                this.isFirstPage = this.currentPage === 1;
                this.isLastPage = this.currentPage === this.totalPages;

                const selectedProductIds = this.orderItemSummary.map(item => item.productId);
                this.orderProducts.forEach(product => {
                    if (selectedProductIds.includes(product.productId)) {
                        const matchingOrderItem = this.orderItemSummary.find(item => item.productId === product.productId);
                        if (matchingOrderItem) {
                            product.orderItemId = matchingOrderItem.orderItemId;
                            product.quantity = matchingOrderItem.quantity;
                            product.listPrice = matchingOrderItem.listPrice;
                            product.unitPrice = matchingOrderItem.unitPrice;
                            product.totalPrice = matchingOrderItem.totalPrice;
                            product.discount = matchingOrderItem.discount
                        }
                    }
                });
            })
            .catch(error => {
                this.hasError = true;
                console.error('Error fetching Products', error);
            });
    }

    handlePreviousPage() {
        this.currentPage = !this.isFirstPage ? this.currentPage - 1 : this.currentPage;
        this.loadProducts();
    }

    handleNextPage() {
        this.currentPage = !this.isLastPage ? this.currentPage + 1 : this.currentPage;
        this.loadProducts();
    }
}