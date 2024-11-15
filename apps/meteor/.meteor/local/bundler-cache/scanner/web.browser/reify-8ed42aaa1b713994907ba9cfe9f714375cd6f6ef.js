module.export({Referral:()=>Referral});let NameAddrHeader;module.link("../core",{NameAddrHeader(v){NameAddrHeader=v}},0);
/**
 * A request to establish a {@link Session} elsewhere (incoming REFER).
 * @public
 */
class Referral {
    /** @internal */
    constructor(incomingReferRequest, session) {
        this.incomingReferRequest = incomingReferRequest;
        this.session = session;
    }
    get referTo() {
        const referTo = this.incomingReferRequest.message.parseHeader("refer-to");
        if (!(referTo instanceof NameAddrHeader)) {
            throw new Error("Failed to parse Refer-To header.");
        }
        return referTo;
    }
    get referredBy() {
        return this.incomingReferRequest.message.getHeader("referred-by");
    }
    get replaces() {
        const value = this.referTo.uri.getHeader("replaces");
        if (value instanceof Array) {
            return value[0];
        }
        return value;
    }
    /** Incoming REFER request message. */
    get request() {
        return this.incomingReferRequest.message;
    }
    /** Accept the request. */
    accept(options = { statusCode: 202 }) {
        this.incomingReferRequest.accept(options);
        return Promise.resolve();
    }
    /** Reject the request. */
    reject(options) {
        this.incomingReferRequest.reject(options);
        return Promise.resolve();
    }
    /**
     * Creates an inviter which may be used to send an out of dialog INVITE request.
     *
     * @remarks
     * This a helper method to create an Inviter which will execute the referral
     * of the `Session` which was referred. The appropriate headers are set and
     * the referred `Session` is linked to the new `Session`. Note that only a
     * single instance of the `Inviter` will be created and returned (if called
     * more than once a reference to the same `Inviter` will be returned every time).
     *
     * @param options - Options bucket.
     * @param modifiers - Session description handler modifiers.
     */
    makeInviter(options) {
        if (this.inviter) {
            return this.inviter;
        }
        const targetURI = this.referTo.uri.clone();
        targetURI.clearHeaders();
        options = options || {};
        const extraHeaders = (options.extraHeaders || []).slice();
        const replaces = this.replaces;
        if (replaces) {
            // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
            extraHeaders.push("Replaces: " + decodeURIComponent(replaces));
        }
        const referredBy = this.referredBy;
        if (referredBy) {
            extraHeaders.push("Referred-By: " + referredBy);
        }
        options.extraHeaders = extraHeaders;
        this.inviter = this.session.userAgent._makeInviter(targetURI, options);
        this.inviter._referred = this.session;
        this.session._referral = this.inviter;
        return this.inviter;
    }
}
