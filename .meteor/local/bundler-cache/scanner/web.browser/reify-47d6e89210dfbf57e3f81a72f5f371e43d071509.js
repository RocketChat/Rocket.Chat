module.export({Transport:()=>Transport});let EmitterImpl;module.link("../../../api/emitter",{EmitterImpl(v){EmitterImpl=v}},0);let StateTransitionError;module.link("../../../api/exceptions",{StateTransitionError(v){StateTransitionError=v}},1);let TransportState;module.link("../../../api/transport-state",{TransportState(v){TransportState=v}},2);let Grammar;module.link("../../../core",{Grammar(v){Grammar=v}},3);



/**
 * Transport for SIP over secure WebSocket (WSS).
 * @public
 */
class Transport {
    constructor(logger, options) {
        this._state = TransportState.Disconnected;
        this.transitioningState = false;
        // state emitter
        this._stateEventEmitter = new EmitterImpl();
        // logger
        this.logger = logger;
        // guard deprecated options (remove this in version 16.x)
        if (options) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const optionsDeprecated = options;
            const wsServersDeprecated = optionsDeprecated === null || optionsDeprecated === void 0 ? void 0 : optionsDeprecated.wsServers;
            const maxReconnectionAttemptsDeprecated = optionsDeprecated === null || optionsDeprecated === void 0 ? void 0 : optionsDeprecated.maxReconnectionAttempts;
            if (wsServersDeprecated !== undefined) {
                const deprecatedMessage = `The transport option "wsServers" as has apparently been specified and has been deprecated. ` +
                    "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
                this.logger.warn(deprecatedMessage);
            }
            if (maxReconnectionAttemptsDeprecated !== undefined) {
                const deprecatedMessage = `The transport option "maxReconnectionAttempts" as has apparently been specified and has been deprecated. ` +
                    "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
                this.logger.warn(deprecatedMessage);
            }
            // hack
            if (wsServersDeprecated && !options.server) {
                if (typeof wsServersDeprecated === "string") {
                    options.server = wsServersDeprecated;
                }
                if (wsServersDeprecated instanceof Array) {
                    options.server = wsServersDeprecated[0];
                }
            }
        }
        // initialize configuration
        this.configuration = Object.assign(Object.assign({}, Transport.defaultOptions), options);
        // validate server URL
        const url = this.configuration.server;
        const parsed = Grammar.parse(url, "absoluteURI");
        if (parsed === -1) {
            this.logger.error(`Invalid WebSocket Server URL "${url}"`);
            throw new Error("Invalid WebSocket Server URL");
        }
        if (!["wss", "ws", "udp"].includes(parsed.scheme)) {
            this.logger.error(`Invalid scheme in WebSocket Server URL "${url}"`);
            throw new Error("Invalid scheme in WebSocket Server URL");
        }
        this._protocol = parsed.scheme.toUpperCase();
    }
    dispose() {
        return this.disconnect();
    }
    /**
     * The protocol.
     *
     * @remarks
     * Formatted as defined for the Via header sent-protocol transport.
     * https://tools.ietf.org/html/rfc3261#section-20.42
     */
    get protocol() {
        return this._protocol;
    }
    /**
     * The URL of the WebSocket Server.
     */
    get server() {
        return this.configuration.server;
    }
    /**
     * Transport state.
     */
    get state() {
        return this._state;
    }
    /**
     * Transport state change emitter.
     */
    get stateChange() {
        return this._stateEventEmitter;
    }
    /**
     * The WebSocket.
     */
    get ws() {
        return this._ws;
    }
    /**
     * Connect to network.
     * Resolves once connected. Otherwise rejects with an Error.
     */
    connect() {
        return this._connect();
    }
    /**
     * Disconnect from network.
     * Resolves once disconnected. Otherwise rejects with an Error.
     */
    disconnect() {
        return this._disconnect();
    }
    /**
     * Returns true if the `state` equals "Connected".
     * @remarks
     * This is equivalent to `state === TransportState.Connected`.
     */
    isConnected() {
        return this.state === TransportState.Connected;
    }
    /**
     * Sends a message.
     * Resolves once message is sent. Otherwise rejects with an Error.
     * @param message - Message to send.
     */
    send(message) {
        // Error handling is independent of whether the message was a request or
        // response.
        //
        // If the transport user asks for a message to be sent over an
        // unreliable transport, and the result is an ICMP error, the behavior
        // depends on the type of ICMP error.  Host, network, port or protocol
        // unreachable errors, or parameter problem errors SHOULD cause the
        // transport layer to inform the transport user of a failure in sending.
        // Source quench and TTL exceeded ICMP errors SHOULD be ignored.
        //
        // If the transport user asks for a request to be sent over a reliable
        // transport, and the result is a connection failure, the transport
        // layer SHOULD inform the transport user of a failure in sending.
        // https://tools.ietf.org/html/rfc3261#section-18.4
        return this._send(message);
    }
    _connect() {
        this.logger.log(`Connecting ${this.server}`);
        switch (this.state) {
            case TransportState.Connecting:
                // If `state` is "Connecting", `state` MUST NOT transition before returning.
                if (this.transitioningState) {
                    return Promise.reject(this.transitionLoopDetectedError(TransportState.Connecting));
                }
                if (!this.connectPromise) {
                    throw new Error("Connect promise must be defined.");
                }
                return this.connectPromise; // Already connecting
            case TransportState.Connected:
                // If `state` is "Connected", `state` MUST NOT transition before returning.
                if (this.transitioningState) {
                    return Promise.reject(this.transitionLoopDetectedError(TransportState.Connecting));
                }
                if (this.connectPromise) {
                    throw new Error("Connect promise must not be defined.");
                }
                return Promise.resolve(); // Already connected
            case TransportState.Disconnecting:
                // If `state` is "Disconnecting", `state` MUST transition to "Connecting" before returning
                if (this.connectPromise) {
                    throw new Error("Connect promise must not be defined.");
                }
                try {
                    this.transitionState(TransportState.Connecting);
                }
                catch (e) {
                    if (e instanceof StateTransitionError) {
                        return Promise.reject(e); // Loop detected
                    }
                    throw e;
                }
                break;
            case TransportState.Disconnected:
                // If `state` is "Disconnected" `state` MUST transition to "Connecting" before returning
                if (this.connectPromise) {
                    throw new Error("Connect promise must not be defined.");
                }
                try {
                    this.transitionState(TransportState.Connecting);
                }
                catch (e) {
                    if (e instanceof StateTransitionError) {
                        return Promise.reject(e); // Loop detected
                    }
                    throw e;
                }
                break;
            default:
                throw new Error("Unknown state");
        }
        let ws;
        try {
            // WebSocket()
            // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket
            ws = new WebSocket(this.server, "sip");
            ws.binaryType = "arraybuffer"; // set data type of received binary messages
            ws.addEventListener("close", (ev) => this.onWebSocketClose(ev, ws));
            ws.addEventListener("error", (ev) => this.onWebSocketError(ev, ws));
            ws.addEventListener("open", (ev) => this.onWebSocketOpen(ev, ws));
            ws.addEventListener("message", (ev) => this.onWebSocketMessage(ev, ws));
            this._ws = ws;
        }
        catch (error) {
            this._ws = undefined;
            this.logger.error("WebSocket construction failed.");
            this.logger.error(error);
            return new Promise((resolve, reject) => {
                this.connectResolve = resolve;
                this.connectReject = reject;
                // The `state` MUST transition to "Disconnecting" or "Disconnected" before rejecting
                this.transitionState(TransportState.Disconnected, error);
            });
        }
        this.connectPromise = new Promise((resolve, reject) => {
            this.connectResolve = resolve;
            this.connectReject = reject;
            this.connectTimeout = setTimeout(() => {
                this.logger.warn("Connect timed out. " +
                    "Exceeded time set in configuration.connectionTimeout: " +
                    this.configuration.connectionTimeout +
                    "s.");
                ws.close(1000); // careful here to use a local reference instead of this._ws
            }, this.configuration.connectionTimeout * 1000);
        });
        return this.connectPromise;
    }
    _disconnect() {
        this.logger.log(`Disconnecting ${this.server}`);
        switch (this.state) {
            case TransportState.Connecting:
                // If `state` is "Connecting", `state` MUST transition to "Disconnecting" before returning.
                if (this.disconnectPromise) {
                    throw new Error("Disconnect promise must not be defined.");
                }
                try {
                    this.transitionState(TransportState.Disconnecting);
                }
                catch (e) {
                    if (e instanceof StateTransitionError) {
                        return Promise.reject(e); // Loop detected
                    }
                    throw e;
                }
                break;
            case TransportState.Connected:
                // If `state` is "Connected", `state` MUST transition to "Disconnecting" before returning.
                if (this.disconnectPromise) {
                    throw new Error("Disconnect promise must not be defined.");
                }
                try {
                    this.transitionState(TransportState.Disconnecting);
                }
                catch (e) {
                    if (e instanceof StateTransitionError) {
                        return Promise.reject(e); // Loop detected
                    }
                    throw e;
                }
                break;
            case TransportState.Disconnecting:
                // If `state` is "Disconnecting", `state` MUST NOT transition before returning.
                if (this.transitioningState) {
                    return Promise.reject(this.transitionLoopDetectedError(TransportState.Disconnecting));
                }
                if (!this.disconnectPromise) {
                    throw new Error("Disconnect promise must be defined.");
                }
                return this.disconnectPromise; // Already disconnecting
            case TransportState.Disconnected:
                // If `state` is "Disconnected", `state` MUST NOT transition before returning.
                if (this.transitioningState) {
                    return Promise.reject(this.transitionLoopDetectedError(TransportState.Disconnecting));
                }
                if (this.disconnectPromise) {
                    throw new Error("Disconnect promise must not be defined.");
                }
                return Promise.resolve(); // Already disconnected
            default:
                throw new Error("Unknown state");
        }
        if (!this._ws) {
            throw new Error("WebSocket must be defined.");
        }
        const ws = this._ws;
        this.disconnectPromise = new Promise((resolve, reject) => {
            this.disconnectResolve = resolve;
            this.disconnectReject = reject;
            try {
                // WebSocket.close()
                // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close
                ws.close(1000); // careful here to use a local reference instead of this._ws
            }
            catch (error) {
                // Treating this as a coding error as it apparently can only happen
                // if you pass close() invalid parameters (so it should never happen)
                this.logger.error("WebSocket close failed.");
                this.logger.error(error);
                throw error;
            }
        });
        return this.disconnectPromise;
    }
    _send(message) {
        if (this.configuration.traceSip === true) {
            this.logger.log("Sending WebSocket message:\n\n" + message + "\n");
        }
        if (this._state !== TransportState.Connected) {
            return Promise.reject(new Error("Not connected."));
        }
        if (!this._ws) {
            throw new Error("WebSocket undefined.");
        }
        try {
            // WebSocket.send()
            // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
            this._ws.send(message);
        }
        catch (error) {
            if (error instanceof Error) {
                return Promise.reject(error);
            }
            return Promise.reject(new Error("WebSocket send failed."));
        }
        return Promise.resolve();
    }
    /**
     * WebSocket "onclose" event handler.
     * @param ev - Event.
     */
    onWebSocketClose(ev, ws) {
        if (ws !== this._ws) {
            return;
        }
        const message = `WebSocket closed ${this.server} (code: ${ev.code})`;
        const error = !this.disconnectPromise ? new Error(message) : undefined;
        if (error) {
            this.logger.warn("WebSocket closed unexpectedly");
        }
        this.logger.log(message);
        // We are about to transition to disconnected, so clear our web socket
        this._ws = undefined;
        // The `state` MUST transition to "Disconnected" before resolving (assuming `state` is not already "Disconnected").
        this.transitionState(TransportState.Disconnected, error);
    }
    /**
     * WebSocket "onerror" event handler.
     * @param ev - Event.
     */
    onWebSocketError(ev, ws) {
        if (ws !== this._ws) {
            return;
        }
        this.logger.error("WebSocket error occurred.");
    }
    /**
     * WebSocket "onmessage" event handler.
     * @param ev - Event.
     */
    onWebSocketMessage(ev, ws) {
        if (ws !== this._ws) {
            return;
        }
        const data = ev.data;
        let finishedData;
        // CRLF Keep Alive response from server. Clear our keep alive timeout.
        if (/^(\r\n)+$/.test(data)) {
            this.clearKeepAliveTimeout();
            if (this.configuration.traceSip === true) {
                this.logger.log("Received WebSocket message with CRLF Keep Alive response");
            }
            return;
        }
        if (!data) {
            this.logger.warn("Received empty message, discarding...");
            return;
        }
        if (typeof data !== "string") {
            // WebSocket binary message.
            try {
                finishedData = new TextDecoder().decode(new Uint8Array(data));
                // TextDecoder (above) is not supported by old browsers, but it correctly decodes UTF-8.
                // The line below is an ISO 8859-1 (Latin 1) decoder, so just UTF-8 code points that are 1 byte.
                // It's old code and works in old browsers (IE), so leaving it here in a comment in case someone needs it.
                // finishedData = String.fromCharCode.apply(null, (new Uint8Array(data) as unknown as Array<number>));
            }
            catch (err) {
                this.logger.error(err);
                this.logger.error("Received WebSocket binary message failed to be converted into string, message discarded");
                return;
            }
            if (this.configuration.traceSip === true) {
                this.logger.log("Received WebSocket binary message:\n\n" + finishedData + "\n");
            }
        }
        else {
            // WebSocket text message.
            finishedData = data;
            if (this.configuration.traceSip === true) {
                this.logger.log("Received WebSocket text message:\n\n" + finishedData + "\n");
            }
        }
        if (this.state !== TransportState.Connected) {
            this.logger.warn("Received message while not connected, discarding...");
            return;
        }
        if (this.onMessage) {
            try {
                this.onMessage(finishedData);
            }
            catch (e) {
                this.logger.error(e);
                this.logger.error("Exception thrown by onMessage callback");
                throw e; // rethrow unhandled exception
            }
        }
    }
    /**
     * WebSocket "onopen" event handler.
     * @param ev - Event.
     */
    onWebSocketOpen(ev, ws) {
        if (ws !== this._ws) {
            return;
        }
        if (this._state === TransportState.Connecting) {
            this.logger.log(`WebSocket opened ${this.server}`);
            this.transitionState(TransportState.Connected);
        }
    }
    /**
     * Helper function to generate an Error.
     * @param state - State transitioning to.
     */
    transitionLoopDetectedError(state) {
        let message = `A state transition loop has been detected.`;
        message += ` An attempt to transition from ${this._state} to ${state} before the prior transition completed.`;
        message += ` Perhaps you are synchronously calling connect() or disconnect() from a callback or state change handler?`;
        this.logger.error(message);
        return new StateTransitionError("Loop detected.");
    }
    /**
     * Transition transport state.
     * @internal
     */
    transitionState(newState, error) {
        const invalidTransition = () => {
            throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
        };
        if (this.transitioningState) {
            throw this.transitionLoopDetectedError(newState);
        }
        this.transitioningState = true;
        // Validate state transition
        switch (this._state) {
            case TransportState.Connecting:
                if (newState !== TransportState.Connected &&
                    newState !== TransportState.Disconnecting &&
                    newState !== TransportState.Disconnected) {
                    invalidTransition();
                }
                break;
            case TransportState.Connected:
                if (newState !== TransportState.Disconnecting && newState !== TransportState.Disconnected) {
                    invalidTransition();
                }
                break;
            case TransportState.Disconnecting:
                if (newState !== TransportState.Connecting && newState !== TransportState.Disconnected) {
                    invalidTransition();
                }
                break;
            case TransportState.Disconnected:
                if (newState !== TransportState.Connecting) {
                    invalidTransition();
                }
                break;
            default:
                throw new Error("Unknown state.");
        }
        // Update state
        const oldState = this._state;
        this._state = newState;
        // Local copies of connect promises (guarding against callbacks changing them indirectly)
        // const connectPromise = this.connectPromise;
        const connectResolve = this.connectResolve;
        const connectReject = this.connectReject;
        // Reset connect promises if no longer connecting
        if (oldState === TransportState.Connecting) {
            this.connectPromise = undefined;
            this.connectResolve = undefined;
            this.connectReject = undefined;
        }
        // Local copies of disconnect promises (guarding against callbacks changing them indirectly)
        // const disconnectPromise = this.disconnectPromise;
        const disconnectResolve = this.disconnectResolve;
        const disconnectReject = this.disconnectReject;
        // Reset disconnect promises if no longer disconnecting
        if (oldState === TransportState.Disconnecting) {
            this.disconnectPromise = undefined;
            this.disconnectResolve = undefined;
            this.disconnectReject = undefined;
        }
        // Clear any outstanding connect timeout
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = undefined;
        }
        this.logger.log(`Transitioned from ${oldState} to ${this._state}`);
        this._stateEventEmitter.emit(this._state);
        //  Transition to Connected
        if (newState === TransportState.Connected) {
            this.startSendingKeepAlives();
            if (this.onConnect) {
                try {
                    this.onConnect();
                }
                catch (e) {
                    this.logger.error(e);
                    this.logger.error("Exception thrown by onConnect callback");
                    throw e; // rethrow unhandled exception
                }
            }
        }
        //  Transition from Connected
        if (oldState === TransportState.Connected) {
            this.stopSendingKeepAlives();
            if (this.onDisconnect) {
                try {
                    if (error) {
                        this.onDisconnect(error);
                    }
                    else {
                        this.onDisconnect();
                    }
                }
                catch (e) {
                    this.logger.error(e);
                    this.logger.error("Exception thrown by onDisconnect callback");
                    throw e; // rethrow unhandled exception
                }
            }
        }
        // Complete connect promise
        if (oldState === TransportState.Connecting) {
            if (!connectResolve) {
                throw new Error("Connect resolve undefined.");
            }
            if (!connectReject) {
                throw new Error("Connect reject undefined.");
            }
            newState === TransportState.Connected ? connectResolve() : connectReject(error || new Error("Connect aborted."));
        }
        // Complete disconnect promise
        if (oldState === TransportState.Disconnecting) {
            if (!disconnectResolve) {
                throw new Error("Disconnect resolve undefined.");
            }
            if (!disconnectReject) {
                throw new Error("Disconnect reject undefined.");
            }
            newState === TransportState.Disconnected
                ? disconnectResolve()
                : disconnectReject(error || new Error("Disconnect aborted."));
        }
        this.transitioningState = false;
    }
    // TODO: Review "KeepAlive Stuff".
    // It is not clear if it works and there are no tests for it.
    // It was blindly lifted the keep alive code unchanged from earlier transport code.
    //
    // From the RFC...
    //
    // SIP WebSocket Clients and Servers may keep their WebSocket
    // connections open by sending periodic WebSocket "Ping" frames as
    // described in [RFC6455], Section 5.5.2.
    // ...
    // The indication and use of the CRLF NAT keep-alive mechanism defined
    // for SIP connection-oriented transports in [RFC5626], Section 3.5.1 or
    // [RFC6223] are, of course, usable over the transport defined in this
    // specification.
    // https://tools.ietf.org/html/rfc7118#section-6
    //
    // and...
    //
    // The Ping frame contains an opcode of 0x9.
    // https://tools.ietf.org/html/rfc6455#section-5.5.2
    //
    // ==============================
    // KeepAlive Stuff
    // ==============================
    clearKeepAliveTimeout() {
        if (this.keepAliveDebounceTimeout) {
            clearTimeout(this.keepAliveDebounceTimeout);
        }
        this.keepAliveDebounceTimeout = undefined;
    }
    /**
     * Send a keep-alive (a double-CRLF sequence).
     */
    sendKeepAlive() {
        if (this.keepAliveDebounceTimeout) {
            // We already have an outstanding keep alive, do not send another.
            return Promise.resolve();
        }
        this.keepAliveDebounceTimeout = setTimeout(() => {
            this.clearKeepAliveTimeout();
        }, this.configuration.keepAliveDebounce * 1000);
        return this.send("\r\n\r\n");
    }
    /**
     * Start sending keep-alives.
     */
    startSendingKeepAlives() {
        // Compute an amount of time in seconds to wait before sending another keep-alive.
        const computeKeepAliveTimeout = (upperBound) => {
            const lowerBound = upperBound * 0.8;
            return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
        };
        if (this.configuration.keepAliveInterval && !this.keepAliveInterval) {
            this.keepAliveInterval = setInterval(() => {
                this.sendKeepAlive();
                this.startSendingKeepAlives();
            }, computeKeepAliveTimeout(this.configuration.keepAliveInterval));
        }
    }
    /**
     * Stop sending keep-alives.
     */
    stopSendingKeepAlives() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        if (this.keepAliveDebounceTimeout) {
            clearTimeout(this.keepAliveDebounceTimeout);
        }
        this.keepAliveInterval = undefined;
        this.keepAliveDebounceTimeout = undefined;
    }
}
Transport.defaultOptions = {
    server: "",
    connectionTimeout: 5,
    keepAliveInterval: 0,
    keepAliveDebounce: 10,
    traceSip: true
};
