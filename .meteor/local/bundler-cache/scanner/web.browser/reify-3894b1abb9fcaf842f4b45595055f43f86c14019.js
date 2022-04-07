module.export({ServerTransaction:()=>ServerTransaction});let Transaction;module.link("./transaction",{Transaction(v){Transaction=v}},0);
/**
 * Server Transaction.
 * @remarks
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 * @public
 */
class ServerTransaction extends Transaction {
    constructor(_request, transport, user, state, loggerCategory) {
        super(transport, user, _request.viaBranch, state, loggerCategory);
        this._request = _request;
        this.user = user;
    }
    /** The incoming request the transaction handling. */
    get request() {
        return this._request;
    }
}
