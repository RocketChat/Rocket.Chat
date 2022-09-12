module.export({Registerer:()=>Registerer});let C,Grammar,URI,equivalentURI;module.link("../core",{C(v){C=v},Grammar(v){Grammar=v},URI(v){URI=v},equivalentURI(v){equivalentURI=v}},0);let EmitterImpl;module.link("./emitter",{EmitterImpl(v){EmitterImpl=v}},1);let RequestPendingError;module.link("./exceptions",{RequestPendingError(v){RequestPendingError=v}},2);let RegistererState;module.link("./registerer-state",{RegistererState(v){RegistererState=v}},3);



/**
 * A registerer registers a contact for an address of record (outgoing REGISTER).
 * @public
 */
class Registerer {
    /**
     * Constructs a new instance of the `Registerer` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param options - Options bucket. See {@link RegistererOptions} for details.
     */
    constructor(userAgent, options = {}) {
        this.disposed = false;
        /** The contacts returned from the most recent accepted REGISTER request. */
        this._contacts = [];
        /** The number of seconds to wait before retrying to register. */
        this._retryAfter = undefined;
        /** The registration state. */
        this._state = RegistererState.Initial;
        /** True is waiting for final response to outstanding REGISTER request. */
        this._waiting = false;
        // state emitter
        this._stateEventEmitter = new EmitterImpl();
        // waiting emitter
        this._waitingEventEmitter = new EmitterImpl();
        // Set user agent
        this.userAgent = userAgent;
        // Default registrar is domain portion of user agent uri
        const defaultUserAgentRegistrar = userAgent.configuration.uri.clone();
        defaultUserAgentRegistrar.user = undefined;
        // Initialize configuration
        this.options = Object.assign(Object.assign(Object.assign({}, Registerer.defaultOptions()), { registrar: defaultUserAgentRegistrar }), Registerer.stripUndefinedProperties(options));
        // Make sure we are not using references to array options
        this.options.extraContactHeaderParams = (this.options.extraContactHeaderParams || []).slice();
        this.options.extraHeaders = (this.options.extraHeaders || []).slice();
        // Make sure we are not using references to registrar uri
        if (!this.options.registrar) {
            throw new Error("Registrar undefined.");
        }
        this.options.registrar = this.options.registrar.clone();
        // Set instanceId and regId conditional defaults and validate
        if (this.options.regId && !this.options.instanceId) {
            this.options.instanceId = Registerer.newUUID();
        }
        else if (!this.options.regId && this.options.instanceId) {
            this.options.regId = 1;
        }
        if (this.options.instanceId && Grammar.parse(this.options.instanceId, "uuid") === -1) {
            throw new Error("Invalid instanceId.");
        }
        if (this.options.regId && this.options.regId < 0) {
            throw new Error("Invalid regId.");
        }
        const registrar = this.options.registrar;
        const fromURI = (this.options.params && this.options.params.fromUri) || userAgent.userAgentCore.configuration.aor;
        const toURI = (this.options.params && this.options.params.toUri) || userAgent.configuration.uri;
        const params = this.options.params || {};
        const extraHeaders = (options.extraHeaders || []).slice();
        // Build the request
        this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(C.REGISTER, registrar, fromURI, toURI, params, extraHeaders, undefined);
        // Registration expires
        this.expires = this.options.expires || Registerer.defaultExpires;
        if (this.expires < 0) {
            throw new Error("Invalid expires.");
        }
        // Interval at which re-REGISTER requests are sent
        this.refreshFrequency = this.options.refreshFrequency || Registerer.defaultRefreshFrequency;
        if (this.refreshFrequency < 50 || this.refreshFrequency > 99) {
            throw new Error("Invalid refresh frequency. The value represents a percentage of the expiration time and should be between 50 and 99.");
        }
        // initialize logger
        this.logger = userAgent.getLogger("sip.Registerer");
        if (this.options.logConfiguration) {
            this.logger.log("Configuration:");
            Object.keys(this.options).forEach((key) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const value = this.options[key];
                switch (key) {
                    case "registrar":
                        this.logger.log("· " + key + ": " + value);
                        break;
                    default:
                        this.logger.log("· " + key + ": " + JSON.stringify(value));
                }
            });
        }
        // Identifier
        this.id = this.request.callId + this.request.from.parameters.tag;
        // Add to the user agent's session collection.
        this.userAgent._registerers[this.id] = this;
    }
    /** Default registerer options. */
    static defaultOptions() {
        return {
            expires: Registerer.defaultExpires,
            extraContactHeaderParams: [],
            extraHeaders: [],
            logConfiguration: true,
            instanceId: "",
            params: {},
            regId: 0,
            registrar: new URI("sip", "anonymous", "anonymous.invalid"),
            refreshFrequency: Registerer.defaultRefreshFrequency
        };
    }
    // http://stackoverflow.com/users/109538/broofa
    static newUUID() {
        const UUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = Math.floor(Math.random() * 16);
            const v = c === "x" ? r : (r % 4) + 8;
            return v.toString(16);
        });
        return UUID;
    }
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    static stripUndefinedProperties(options) {
        return Object.keys(options).reduce((object, key) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (options[key] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                object[key] = options[key];
            }
            return object;
        }, {});
    }
    /** The registered contacts. */
    get contacts() {
        return this._contacts.slice();
    }
    /**
     * The number of seconds to wait before retrying to register.
     * @defaultValue `undefined`
     * @remarks
     * When the server rejects a registration request, if it provides a suggested
     * duration to wait before retrying, that value is available here when and if
     * the state transitions to `Unsubscribed`. It is also available during the
     * callback to `onReject` after a call to `register`. (Note that if the state
     * if already `Unsubscribed`, a rejected request created by `register` will
     * not cause the state to transition to `Unsubscribed`. One way to avoid this
     * case is to dispose of `Registerer` when unregistered and create a new
     * `Registerer` for any attempts to retry registering.)
     * @example
     * ```ts
     * // Checking for retry after on state change
     * registerer.stateChange.addListener((newState) => {
     *   switch (newState) {
     *     case RegistererState.Unregistered:
     *       const retryAfter = registerer.retryAfter;
     *       break;
     *   }
     * });
     *
     * // Checking for retry after on request rejection
     * registerer.register({
     *   requestDelegate: {
     *     onReject: () => {
     *       const retryAfter = registerer.retryAfter;
     *     }
     *   }
     * });
     * ```
     */
    get retryAfter() {
        return this._retryAfter;
    }
    /** The registration state. */
    get state() {
        return this._state;
    }
    /** Emits when the registerer state changes. */
    get stateChange() {
        return this._stateEventEmitter;
    }
    /** Destructor. */
    dispose() {
        if (this.disposed) {
            return Promise.resolve();
        }
        this.disposed = true;
        this.logger.log(`Registerer ${this.id} in state ${this.state} is being disposed`);
        // Remove from the user agent's registerer collection
        delete this.userAgent._registerers[this.id];
        // If registered, unregisters and resolves after final response received.
        return new Promise((resolve) => {
            const doClose = () => {
                // If we are registered, unregister and resolve after our state changes
                if (!this.waiting && this._state === RegistererState.Registered) {
                    this.stateChange.addListener(() => {
                        this.terminated();
                        resolve();
                    }, { once: true });
                    this.unregister();
                    return;
                }
                // Otherwise just resolve
                this.terminated();
                resolve();
            };
            // If we are waiting for an outstanding request, wait for it to finish and then try closing.
            // Otherwise just try closing.
            if (this.waiting) {
                this.waitingChange.addListener(() => {
                    doClose();
                }, { once: true });
            }
            else {
                doClose();
            }
        });
    }
    /**
     * Sends the REGISTER request.
     * @remarks
     * If successful, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    register(options = {}) {
        if (this.state === RegistererState.Terminated) {
            this.stateError();
            throw new Error("Registerer terminated. Unable to register.");
        }
        if (this.disposed) {
            this.stateError();
            throw new Error("Registerer disposed. Unable to register.");
        }
        // UAs MUST NOT send a new registration (that is, containing new Contact
        // header field values, as opposed to a retransmission) until they have
        // received a final response from the registrar for the previous one or
        // the previous REGISTER request has timed out.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        if (this.waiting) {
            this.waitingWarning();
            const error = new RequestPendingError("REGISTER request already in progress, waiting for final response");
            return Promise.reject(error);
        }
        // Options
        if (options.requestOptions) {
            this.options = Object.assign(Object.assign({}, this.options), options.requestOptions);
        }
        // Extra headers
        const extraHeaders = (this.options.extraHeaders || []).slice();
        extraHeaders.push("Contact: " + this.generateContactHeader(this.expires));
        // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
        extraHeaders.push("Allow: " + ["ACK", "CANCEL", "INVITE", "MESSAGE", "BYE", "OPTIONS", "INFO", "NOTIFY", "REFER"].toString());
        // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
        // header field value for registrations sent to a particular
        // registrar.
        //
        // CSeq: The CSeq value guarantees proper ordering of REGISTER
        // requests.  A UA MUST increment the CSeq value by one for each
        // REGISTER request with the same Call-ID.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        this.request.cseq++;
        this.request.setHeader("cseq", this.request.cseq + " REGISTER");
        this.request.extraHeaders = extraHeaders;
        this.waitingToggle(true);
        const outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
            onAccept: (response) => {
                let expires;
                // FIXME: This does NOT appear to be to spec and should be removed.
                // I haven't found anywhere that an Expires header may be used in a response.
                if (response.message.hasHeader("expires")) {
                    expires = Number(response.message.getHeader("expires"));
                }
                // 8. The registrar returns a 200 (OK) response.  The response MUST
                // contain Contact header field values enumerating all current
                // bindings.  Each Contact value MUST feature an "expires"
                // parameter indicating its expiration interval chosen by the
                // registrar.  The response SHOULD include a Date header field.
                // https://tools.ietf.org/html/rfc3261#section-10.3
                this._contacts = response.message.getHeaders("contact");
                let contacts = this._contacts.length;
                if (!contacts) {
                    this.logger.error("No Contact header in response to REGISTER, dropping response.");
                    this.unregistered();
                    return;
                }
                // The 200 (OK) response from the registrar contains a list of Contact
                // fields enumerating all current bindings.  The UA compares each
                // contact address to see if it created the contact address, using
                // comparison rules in Section 19.1.4.  If so, it updates the expiration
                // time interval according to the expires parameter or, if absent, the
                // Expires field value.  The UA then issues a REGISTER request for each
                // of its bindings before the expiration interval has elapsed.
                // https://tools.ietf.org/html/rfc3261#section-10.2.4
                let contact;
                while (contacts--) {
                    contact = response.message.parseHeader("contact", contacts);
                    if (!contact) {
                        throw new Error("Contact undefined");
                    }
                    if (this.userAgent.contact.pubGruu && equivalentURI(contact.uri, this.userAgent.contact.pubGruu)) {
                        expires = Number(contact.getParam("expires"));
                        break;
                    }
                    // If we are using a randomly generated user name (which is the default behavior)
                    if (this.userAgent.configuration.contactName === "") {
                        // compare the user portion of the URI under the assumption that it will be unique
                        if (contact.uri.user === this.userAgent.contact.uri.user) {
                            expires = Number(contact.getParam("expires"));
                            break;
                        }
                    }
                    else {
                        // otherwise use comparision rules in Section 19.1.4
                        if (equivalentURI(contact.uri, this.userAgent.contact.uri)) {
                            expires = Number(contact.getParam("expires"));
                            break;
                        }
                    }
                    contact = undefined;
                }
                // There must be a matching contact.
                if (contact === undefined) {
                    this.logger.error("No Contact header pointing to us, dropping response");
                    this.unregistered();
                    this.waitingToggle(false);
                    return;
                }
                // The contact must have an expires.
                if (expires === undefined) {
                    this.logger.error("Contact pointing to us is missing expires parameter, dropping response");
                    this.unregistered();
                    this.waitingToggle(false);
                    return;
                }
                // Save gruu values
                if (contact.hasParam("temp-gruu")) {
                    const gruu = contact.getParam("temp-gruu");
                    if (gruu) {
                        this.userAgent.contact.tempGruu = Grammar.URIParse(gruu.replace(/"/g, ""));
                    }
                }
                if (contact.hasParam("pub-gruu")) {
                    const gruu = contact.getParam("pub-gruu");
                    if (gruu) {
                        this.userAgent.contact.pubGruu = Grammar.URIParse(gruu.replace(/"/g, ""));
                    }
                }
                this.registered(expires);
                if (options.requestDelegate && options.requestDelegate.onAccept) {
                    options.requestDelegate.onAccept(response);
                }
                this.waitingToggle(false);
            },
            onProgress: (response) => {
                if (options.requestDelegate && options.requestDelegate.onProgress) {
                    options.requestDelegate.onProgress(response);
                }
            },
            onRedirect: (response) => {
                this.logger.error("Redirect received. Not supported.");
                this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onRedirect) {
                    options.requestDelegate.onRedirect(response);
                }
                this.waitingToggle(false);
            },
            onReject: (response) => {
                if (response.message.statusCode === 423) {
                    // If a UA receives a 423 (Interval Too Brief) response, it MAY retry
                    // the registration after making the expiration interval of all contact
                    // addresses in the REGISTER request equal to or greater than the
                    // expiration interval within the Min-Expires header field of the 423
                    // (Interval Too Brief) response.
                    // https://tools.ietf.org/html/rfc3261#section-10.2.8
                    //
                    // The registrar MAY choose an expiration less than the requested
                    // expiration interval.  If and only if the requested expiration
                    // interval is greater than zero AND smaller than one hour AND
                    // less than a registrar-configured minimum, the registrar MAY
                    // reject the registration with a response of 423 (Interval Too
                    // Brief).  This response MUST contain a Min-Expires header field
                    // that states the minimum expiration interval the registrar is
                    // willing to honor.  It then skips the remaining steps.
                    // https://tools.ietf.org/html/rfc3261#section-10.3
                    if (!response.message.hasHeader("min-expires")) {
                        // This response MUST contain a Min-Expires header field
                        this.logger.error("423 response received for REGISTER without Min-Expires, dropping response");
                        this.unregistered();
                        this.waitingToggle(false);
                        return;
                    }
                    // Increase our registration interval to the suggested minimum
                    this.expires = Number(response.message.getHeader("min-expires"));
                    // Attempt the registration again immediately
                    this.waitingToggle(false);
                    this.register();
                    return;
                }
                this.logger.warn(`Failed to register, status code ${response.message.statusCode}`);
                // The Retry-After header field can be used with a 500 (Server Internal
                // Error) or 503 (Service Unavailable) response to indicate how long the
                // service is expected to be unavailable to the requesting client...
                // https://tools.ietf.org/html/rfc3261#section-20.33
                let retryAfterDuration = NaN;
                if (response.message.statusCode === 500 || response.message.statusCode === 503) {
                    const header = response.message.getHeader("retry-after");
                    if (header) {
                        retryAfterDuration = Number.parseInt(header, undefined);
                    }
                }
                // Set for the state change (if any) and the delegate callback (if any)
                this._retryAfter = isNaN(retryAfterDuration) ? undefined : retryAfterDuration;
                this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onReject) {
                    options.requestDelegate.onReject(response);
                }
                this._retryAfter = undefined;
                this.waitingToggle(false);
            },
            onTrying: (response) => {
                if (options.requestDelegate && options.requestDelegate.onTrying) {
                    options.requestDelegate.onTrying(response);
                }
            }
        });
        return Promise.resolve(outgoingRegisterRequest);
    }
    /**
     * Sends the REGISTER request with expires equal to zero.
     * @remarks
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    unregister(options = {}) {
        if (this.state === RegistererState.Terminated) {
            this.stateError();
            throw new Error("Registerer terminated. Unable to register.");
        }
        if (this.disposed) {
            if (this.state !== RegistererState.Registered) {
                // allows unregister while disposing and registered
                this.stateError();
                throw new Error("Registerer disposed. Unable to register.");
            }
        }
        // UAs MUST NOT send a new registration (that is, containing new Contact
        // header field values, as opposed to a retransmission) until they have
        // received a final response from the registrar for the previous one or
        // the previous REGISTER request has timed out.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        if (this.waiting) {
            this.waitingWarning();
            const error = new RequestPendingError("REGISTER request already in progress, waiting for final response");
            return Promise.reject(error);
        }
        if (this._state !== RegistererState.Registered && !options.all) {
            this.logger.warn("Not currently registered, but sending an unregister anyway.");
        }
        // Extra headers
        const extraHeaders = ((options.requestOptions && options.requestOptions.extraHeaders) || []).slice();
        this.request.extraHeaders = extraHeaders;
        // Registrations are soft state and expire unless refreshed, but can
        // also be explicitly removed.  A client can attempt to influence the
        // expiration interval selected by the registrar as described in Section
        // 10.2.1.  A UA requests the immediate removal of a binding by
        // specifying an expiration interval of "0" for that contact address in
        // a REGISTER request.  UAs SHOULD support this mechanism so that
        // bindings can be removed before their expiration interval has passed.
        //
        // The REGISTER-specific Contact header field value of "*" applies to
        // all registrations, but it MUST NOT be used unless the Expires header
        // field is present with a value of "0".
        // https://tools.ietf.org/html/rfc3261#section-10.2.2
        if (options.all) {
            extraHeaders.push("Contact: *");
            extraHeaders.push("Expires: 0");
        }
        else {
            extraHeaders.push("Contact: " + this.generateContactHeader(0));
        }
        // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
        // header field value for registrations sent to a particular
        // registrar.
        //
        // CSeq: The CSeq value guarantees proper ordering of REGISTER
        // requests.  A UA MUST increment the CSeq value by one for each
        // REGISTER request with the same Call-ID.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        this.request.cseq++;
        this.request.setHeader("cseq", this.request.cseq + " REGISTER");
        // Pre-emptive clear the registration timer to avoid a race condition where
        // this timer fires while waiting for a final response to the unsubscribe.
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        this.waitingToggle(true);
        const outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
            onAccept: (response) => {
                this._contacts = response.message.getHeaders("contact"); // Update contacts
                this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onAccept) {
                    options.requestDelegate.onAccept(response);
                }
                this.waitingToggle(false);
            },
            onProgress: (response) => {
                if (options.requestDelegate && options.requestDelegate.onProgress) {
                    options.requestDelegate.onProgress(response);
                }
            },
            onRedirect: (response) => {
                this.logger.error("Unregister redirected. Not currently supported.");
                this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onRedirect) {
                    options.requestDelegate.onRedirect(response);
                }
                this.waitingToggle(false);
            },
            onReject: (response) => {
                this.logger.error(`Unregister rejected with status code ${response.message.statusCode}`);
                this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onReject) {
                    options.requestDelegate.onReject(response);
                }
                this.waitingToggle(false);
            },
            onTrying: (response) => {
                if (options.requestDelegate && options.requestDelegate.onTrying) {
                    options.requestDelegate.onTrying(response);
                }
            }
        });
        return Promise.resolve(outgoingRegisterRequest);
    }
    /**
     * Clear registration timers.
     */
    clearTimers() {
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        if (this.registrationExpiredTimer !== undefined) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = undefined;
        }
    }
    /**
     * Generate Contact Header
     */
    generateContactHeader(expires) {
        let contact = this.userAgent.contact.toString();
        if (this.options.regId && this.options.instanceId) {
            contact += ";reg-id=" + this.options.regId;
            contact += ';+sip.instance="<urn:uuid:' + this.options.instanceId + '>"';
        }
        if (this.options.extraContactHeaderParams) {
            this.options.extraContactHeaderParams.forEach((header) => {
                contact += ";" + header;
            });
        }
        contact += ";expires=" + expires;
        return contact;
    }
    /**
     * Helper function, called when registered.
     */
    registered(expires) {
        this.clearTimers();
        // Re-Register before the expiration interval has elapsed.
        // For that, calculate the delay as a percentage of the expiration time
        this.registrationTimer = setTimeout(() => {
            this.registrationTimer = undefined;
            this.register();
        }, (this.refreshFrequency / 100) * expires * 1000);
        // We are unregistered if the registration expires.
        this.registrationExpiredTimer = setTimeout(() => {
            this.logger.warn("Registration expired");
            this.unregistered();
        }, expires * 1000);
        if (this._state !== RegistererState.Registered) {
            this.stateTransition(RegistererState.Registered);
        }
    }
    /**
     * Helper function, called when unregistered.
     */
    unregistered() {
        this.clearTimers();
        if (this._state !== RegistererState.Unregistered) {
            this.stateTransition(RegistererState.Unregistered);
        }
    }
    /**
     * Helper function, called when terminated.
     */
    terminated() {
        this.clearTimers();
        if (this._state !== RegistererState.Terminated) {
            this.stateTransition(RegistererState.Terminated);
        }
    }
    /**
     * Transition registration state.
     */
    stateTransition(newState) {
        const invalidTransition = () => {
            throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
        };
        // Validate transition
        switch (this._state) {
            case RegistererState.Initial:
                if (newState !== RegistererState.Registered &&
                    newState !== RegistererState.Unregistered &&
                    newState !== RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case RegistererState.Registered:
                if (newState !== RegistererState.Unregistered && newState !== RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case RegistererState.Unregistered:
                if (newState !== RegistererState.Registered && newState !== RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case RegistererState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Transition
        this._state = newState;
        this.logger.log(`Registration transitioned to state ${this._state}`);
        this._stateEventEmitter.emit(this._state);
        // Dispose
        if (newState === RegistererState.Terminated) {
            this.dispose();
        }
    }
    /** True if the registerer is currently waiting for final response to a REGISTER request. */
    get waiting() {
        return this._waiting;
    }
    /** Emits when the registerer waiting state changes. */
    get waitingChange() {
        return this._waitingEventEmitter;
    }
    /**
     * Toggle waiting.
     */
    waitingToggle(waiting) {
        if (this._waiting === waiting) {
            throw new Error(`Invalid waiting transition from ${this._waiting} to ${waiting}`);
        }
        this._waiting = waiting;
        this.logger.log(`Waiting toggled to ${this._waiting}`);
        this._waitingEventEmitter.emit(this._waiting);
    }
    /** Hopefully helpful as the standard behavior has been found to be unexpected. */
    waitingWarning() {
        let message = "An attempt was made to send a REGISTER request while a prior one was still in progress.";
        message += " RFC 3261 requires UAs MUST NOT send a new registration until they have received a final response";
        message += " from the registrar for the previous one or the previous REGISTER request has timed out.";
        message += " Note that if the transport disconnects, you still must wait for the prior request to time out before";
        message +=
            " sending a new REGISTER request or alternatively dispose of the current Registerer and create a new Registerer.";
        this.logger.warn(message);
    }
    /** Hopefully helpful as the standard behavior has been found to be unexpected. */
    stateError() {
        const reason = this.state === RegistererState.Terminated ? "is in 'Terminated' state" : "has been disposed";
        let message = `An attempt was made to send a REGISTER request when the Registerer ${reason}.`;
        message += " The Registerer transitions to 'Terminated' when Registerer.dispose() is called.";
        message += " Perhaps you called UserAgent.stop() which dipsoses of all Registerers?";
        this.logger.error(message);
    }
}
Registerer.defaultExpires = 600;
Registerer.defaultRefreshFrequency = 99;
