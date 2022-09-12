module.export({EmitterImpl:()=>EmitterImpl});/**
 * An {@link Emitter} implementation.
 * @internal
 */
class EmitterImpl {
    constructor() {
        this.listeners = new Array();
    }
    /**
     * Sets up a function that will be called whenever the target changes.
     * @param listener - Callback function.
     * @param options - An options object that specifies characteristics about the listener.
     *                  If once true, indicates that the listener should be invoked at most once after being added.
     *                  If once true, the listener would be automatically removed when invoked.
     */
    addListener(listener, options) {
        const onceWrapper = (data) => {
            this.removeListener(onceWrapper);
            listener(data);
        };
        (options === null || options === void 0 ? void 0 : options.once) === true ? this.listeners.push(onceWrapper) : this.listeners.push(listener);
    }
    /**
     * Emit change.
     * @param data - Data to emit.
     */
    emit(data) {
        this.listeners.slice().forEach((listener) => listener(data));
    }
    /**
     * Removes all listeners previously registered with addListener.
     */
    removeAllListeners() {
        this.listeners = [];
    }
    /**
     * Removes a listener previously registered with addListener.
     * @param listener - Callback function.
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }
    /**
     * Registers a listener.
     * @param listener - Callback function.
     * @deprecated Use addListener.
     */
    on(listener) {
        return this.addListener(listener);
    }
    /**
     * Unregisters a listener.
     * @param listener - Callback function.
     * @deprecated Use removeListener.
     */
    off(listener) {
        return this.removeListener(listener);
    }
    /**
     * Registers a listener then unregisters the listener after one event emission.
     * @param listener - Callback function.
     * @deprecated Use addListener.
     */
    once(listener) {
        return this.addListener(listener, { once: true });
    }
}
