({
    rerender : function(component) {
        this.superRerender();
        var recordId = component.get("v.recordId");
        var accountId = null;
        if(recordId && recordId.startsWith('001')) {
            accountId = recordId;
        }
        var evt = $A.get("e.force:navigateToComponent");
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