module.export({Cancel:()=>Cancel});/**
 * A request to reject an {@link Invitation} (incoming CANCEL).
 * @public
 */
class Cancel {
    /** @internal */
    constructor(incomingCancelRequest) {
        this.incomingCancelRequest = incomingCancelRequest;
    }
    /** Incoming CANCEL request message. */
    get request() {
        return this.incomingCancelRequest;
    }
}
