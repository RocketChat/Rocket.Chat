module.export({TransactionStateError:function(){return TransactionStateError}});var Exception;module.link("./exception",{Exception:function(v){Exception=v}},0);
/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
class TransactionStateError extends Exception {
    constructor(message) {
        super(message ? message : "Transaction state error.");
    }
}
