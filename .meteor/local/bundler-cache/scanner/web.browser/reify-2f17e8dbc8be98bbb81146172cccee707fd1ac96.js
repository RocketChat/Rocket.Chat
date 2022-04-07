module.export({Subscription:()=>Subscription});let EmitterImpl;module.link("./emitter",{EmitterImpl(v){EmitterImpl=v}},0);let SubscriptionState;module.link("./subscription-state",{SubscriptionState(v){SubscriptionState=v}},1);

/**
 * A subscription provides {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
class Subscription {
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    constructor(userAgent, options = {}) {
        this._disposed = false;
        this._state = SubscriptionState.Initial;
        this._logger = userAgent.getLogger("sip.Subscription");
        this._stateEventEmitter = new EmitterImpl();
        this._userAgent = userAgent;
        this.delegate = options.delegate;
    }
    /**
     * Destructor.
     */
    dispose() {
        if (this._disposed) {
            return Promise.resolve();
        }
        this._disposed = true;
        this._stateEventEmitter.removeAllListeners();
        return Promise.resolve();
    }
    /**
     * The subscribed subscription dialog.
     */
    get dialog() {
        return this._dialog;
    }
    /**
     * True if disposed.
     * @internal
     */
    get disposed() {
        return this._disposed;
    }
    /**
     * Subscription state. See {@link SubscriptionState} for details.
     */
    get state() {
        return this._state;
    }
    /**
     * Emits when the subscription `state` property changes.
     */
    get stateChange() {
        return this._stateEventEmitter;
    }
    /** @internal */
    stateTransition(newState) {
        const invalidTransition = () => {
            throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
        };
        // Validate transition
        switch (this._state) {
            case SubscriptionState.Initial:
                if (newState !== SubscriptionState.NotifyWait && newState !== SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case SubscriptionState.NotifyWait:
                if (newState !== SubscriptionState.Subscribed && newState !== SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case SubscriptionState.Subscribed:
                if (newState !== SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case SubscriptionState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Guard against duplicate transition
        if (this._state === newState) {
            return;
        }
        // Transition
        this._state = newState;
        this._logger.log(`Subscription ${this._dialog ? this._dialog.id : undefined} transitioned to ${this._state}`);
        this._stateEventEmitter.emit(this._state);
        // Dispose
        if (newState === SubscriptionState.Terminated) {
            this.dispose();
        }
    }
}
