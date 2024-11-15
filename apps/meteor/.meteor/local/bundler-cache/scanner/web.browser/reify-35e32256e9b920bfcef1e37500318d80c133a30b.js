module.export({Transaction:()=>Transaction});let TransportError;module.link("../exceptions",{TransportError(v){TransportError=v}},0);
/**
 * Transaction.
 * @remarks
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 * @public
 */
class Transaction {
    constructor(_transport, _user, _id, _state, loggerCategory) {
        this._transport = _transport;
        this._user = _user;
        this._id = _id;
        this._state = _state;
        this.listeners = new Array();
        this.logger = _user.loggerFactory.getLogger(loggerCategory, _id);
        this.logger.debug(`Constructing ${this.typeToString()} with id ${this.id}.`);
    }
    /**
     * Destructor.
     * Once the transaction is in the "terminated" state, it is destroyed
     * immediately and there is no need to call `dispose`. However, if a
     * transaction needs to be ended prematurely, the transaction user may
     * do so by calling this method (for example, perhaps the UA is shutting down).
     * No state transition will occur upon calling this method, all outstanding
     * transmission timers will be cancelled, and use of the transaction after
     * calling `dispose` is undefined.
     */
    dispose() {
        this.logger.debug(`Destroyed ${this.typeToString()} with id ${this.id}.`);
    }
    /** Transaction id. */
    get id() {
        return this._id;
    }
    /** Transaction kind. Deprecated. */
    get kind() {
        throw new Error("Invalid kind.");
    }
    /** Transaction state. */
    get state() {
        return this._state;
    }
    /** Transaction transport. */
    get transport() {
        return this._transport;
    }
    /**
     * Sets up a function that will be called whenever the transaction state changes.
     * @param listener - Callback function.
     * @param options - An options object that specifies characteristics about the listener.
     *                  If once true, indicates that the listener should be invoked at most once after being added.
     *                  If once true, the listener would be automatically removed when invoked.
     */
    addStateChangeListener(listener, options) {
        const onceWrapper = () => {
            this.removeStateChangeListener(onceWrapper);
            listener();
        };
        (options === null || options === void 0 ? void 0 : options.once) === true ? this.listeners.push(onceWrapper) : this.listeners.push(listener);
    }
    /**
     * This is currently public so tests may spy on it.
     * @internal
     */
    notifyStateChangeListeners() {
        this.listeners.slice().forEach((listener) => listener());
    }
    /**
     * Removes a listener previously registered with addStateListener.
     * @param listener - Callback function.
     */
    removeStateChangeListener(listener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }
    logTransportError(error, message) {
        this.logger.error(error.message);
        this.logger.error(`Transport error occurred in ${this.typeToString()} with id ${this.id}.`);
        this.logger.error(message);
    }
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    send(message) {
        return this.transport.send(message).catch((error) => {
            // If the transport rejects, it SHOULD reject with a TransportError.
            // But the transport may be external code, so we are careful
            // make sure we convert it to a TransportError if need be.
            if (error instanceof TransportError) {
                this.onTransportError(error);
                throw error;
            }
            let transportError;
            if (error && typeof error.message === "string") {
                transportError = new TransportError(error.message);
            }
            else {
                transportError = new TransportError();
            }
            this.onTransportError(transportError);
            throw transportError;
        });
    }
    setState(state) {
        this.logger.debug(`State change to "${state}" on ${this.typeToString()} with id ${this.id}.`);
        this._state = state;
        if (this._user.onStateChange) {
            this._user.onStateChange(state);
        }
        this.notifyStateChangeListeners();
    }
    typeToString() {
        return "UnknownType";
    }
}
