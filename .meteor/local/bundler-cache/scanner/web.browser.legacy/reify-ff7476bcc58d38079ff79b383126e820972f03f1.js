module.export({Info:function(){return Info}});/**
 * An exchange of information (incoming INFO).
 * @public
 */
class Info {
    /** @internal */
    constructor(incomingInfoRequest) {
        this.incomingInfoRequest = incomingInfoRequest;
    }
    /** Incoming MESSAGE request message. */
    get request() {
        return this.incomingInfoRequest.message;
    }
    /** Accept the request. */
    accept(options) {
        this.incomingInfoRequest.accept(options);
        return Promise.resolve();
    }
    /** Reject the request. */
    reject(options) {
        this.incomingInfoRequest.reject(options);
        return Promise.resolve();
    }
}
