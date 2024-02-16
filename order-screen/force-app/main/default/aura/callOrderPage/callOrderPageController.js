({
    navigateToeDiscoverySearchCmp : function(component) {
        let recordId = component.get("v.recordId");
        let accountId = null;
        if(recordId && recordId.startsWith('001')) {
            accountId = recordId;
        }

        let evt = $A.get("e.force:navigateToComponent");
        evt.setParams({
            componentDef: "c:orderPage",
            componentAttributes: {
                recordId: recordId,
                accountId: accountId
            }
        });
        evt.fire();
    }
})