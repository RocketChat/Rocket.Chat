module.export({TransactionState:()=>TransactionState});/**
 * Transaction state.
 * @public
 */
var TransactionState;
(function (TransactionState) {
    TransactionState["Accepted"] = "Accepted";
    TransactionState["Calling"] = "Calling";
    TransactionState["Completed"] = "Completed";
    TransactionState["Confirmed"] = "Confirmed";
    TransactionState["Proceeding"] = "Proceeding";
    TransactionState["Terminated"] = "Terminated";
    TransactionState["Trying"] = "Trying";
})(module.runSetters(TransactionState = TransactionState || (module.runSetters(TransactionState = {},["TransactionState"])),["TransactionState"]));
