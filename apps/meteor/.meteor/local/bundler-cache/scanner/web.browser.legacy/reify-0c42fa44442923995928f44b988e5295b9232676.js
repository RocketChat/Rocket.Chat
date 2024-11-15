'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');

/**
 * This hook behaves like a regular useEffect except that it provides a timeout function via it's arguments
 * that can be used to spawn timeouts via `window.setTimeout()` from inside the effect. The timeouts will be cleared on unmount.
 * @param effect The effect callback, it receives a timeout function as its first argument and a timeout clearer as its second
 * @param deps The dependency array from useEffect.
 */
const useTimeoutEffect = (effect, deps) => {
    const timeoutIds = react.useRef([]);
    const timeoutFunc = react.useCallback((handler, timeout) => {
        const id = setTimeout(handler, timeout);
        timeoutIds.current.push(id);
        return id;
    }, [timeoutIds]);
    react.useEffect(() => {
        return effect(timeoutFunc, () => {
            if (timeoutIds.current.length > 0) {
                timeoutIds.current.forEach((id) => {
                    clearTimeout(id);
                });
            }
        });
    }, deps);
    react.useEffect(() => {
        return function onUnmount() {
            if (timeoutIds.current.length > 0) {
                timeoutIds.current.forEach((id) => {
                    clearTimeout(id);
                });
            }
        };
    }, [timeoutIds]);
};

/**
 * This hook will return a function that executes the provided callback after the specified amount of time.
 *
 * This **will not debounce or throttle** the callbacks, i.e. consecutive calls of this function will all spawn
 * new timeouts even if some are still pending. If you want a debouncing version, take a look at `useDebounce()`.
 * If you want a throttling version, see `useThrottle()`.
 *
 * Pending callbacks will only(!) be cleared in case the component unmounts.
 *
 * @param callback The callback that is invoked after the timeout expired
 * @param waitMs The timeout in milliseconds
 *
 * @returns a function that executes the provided callback after the specified amount of time
 */
function useTimeout(callback, waitMs) {
    const timeoutCallback = react.useRef(callback);
    const timeoutIds = react.useRef([]);
    react.useEffect(() => {
        timeoutCallback.current = callback;
    }, [callback]);
    react.useEffect(() => {
        return () => {
            timeoutIds.current.forEach((id) => clearTimeout(id));
        };
    }, [timeoutIds]);
    return react.useCallback((...args) => {
        const id = setTimeout(() => timeoutCallback.current(...args), waitMs);
        timeoutIds.current.push(id);
        return id;
    }, [waitMs]);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

/**
 * This private API hook adds controls like play, pause, start, stop to a hook.
 * @param isPausedInitially
 * @param isStoppedInitially
 */
const useControls = (isPausedInitially = false, isStoppedInitially = false) => {
    const [isPaused, setIsPaused] = react.useState(isPausedInitially);
    const [isStopped, setIsStopped] = react.useState(isStoppedInitially);
    const isPausedRef = react.useRef(isPausedInitially);
    const pause = react.useCallback(() => {
        isPausedRef.current = true;
        setIsPaused(true); // notify interval owner
    }, [setIsPaused]);
    const resume = react.useCallback(() => {
        isPausedRef.current = false;
        setIsPaused(false); // notify interval owner
    }, [setIsPaused]);
    const stop = react.useCallback(() => {
        setIsStopped(true);
    }, [setIsStopped]);
    const start = react.useCallback(() => {
        isPausedRef.current = false;
        setIsPaused(false);
        setIsStopped(false);
    }, [setIsStopped]);
    return {
        isPaused,
        isPausedRef,
        isStopped,
        pause,
        resume,
        stop,
        start,
    };
};

/**
 * Calls the given function at a regular interval.
 *
 * The interval can be paused, resumed, stopped etc. via the returned callbacks.
 *
 * Active intervals will be cleared in case the component unmounts.
 *
 * @param callback A function that will be called at the specified interval
 * @param delay time in milliseconds between each invocation of callback. If set to `null` the interval will come to a halt.
 * @param options A set of options to control the interval behaviour.
 * @param [options.startOnMount = false] (optional) Defaults to false. If true, the interval will immediately start on mount. If false, it has to be started manually via `start()`.
 * @returns An object of properties to control the interval or see it's status
 */
const useInterval = (callback, delay, options = {}) => {
    const { startOnMount = false } = options;
    const _a = useControls(false, !startOnMount), { isPausedRef } = _a, controls = __rest(_a, ["isPausedRef"]);
    const { isStopped } = controls;
    const intervalCallback = react.useRef(callback);
    const intervalId = react.useRef(null);
    react.useEffect(() => {
        intervalCallback.current = callback;
    }, [callback]);
    const onIntervalStep = react.useCallback(() => {
        if (isPausedRef.current === false) {
            intervalCallback.current();
        }
    }, [intervalCallback, isPausedRef]);
    react.useEffect(() => {
        if (delay !== null && !isStopped) {
            intervalId.current = setInterval(onIntervalStep, delay);
            return () => clearInterval(intervalId.current);
        }
    }, [delay, isStopped]);
    return Object.assign({}, controls);
};

/**
 * A hook that updates a number on a regular interval based on the provided settings.
 *
 * Active intervals will be cleared on unmount.
 *
 * @param settings Counter settings and interval options
 * @param settings.start the initial value
 * @param settings.interval duration in ms between steps
 * @param settings.stepSize amount that is added to the current counter value on every step
 * @param [settings.startOnMount = false] If true, the interval will immediately start on mount. If false, it has to be started manually via `start()`.
 */
const useCounter = (settings) => {
    const { start = 0, interval = 1000, stepSize = 1 } = settings, intervalOptions = __rest(settings, ["start", "interval", "stepSize"]);
    const [val, setVal] = react.useState(start);
    const intervalControls = useInterval(() => setVal(val + stepSize), interval, intervalOptions);
    return [val, intervalControls];
};

/**
 * A hook that starts a timer, i.e. a reactive number that is increased every second.
 * @param start Starting value of the timer
 * @param options A set of interval options, see useInterval().
 * @param [options.startOnMount = false] If true, the interval will immediately start on mount. If false, it has to be started manually via `start()`.
 * @returns the current timer value.
 */
const useTimer = (start = 0, options = {}) => useCounter(Object.assign({ start, interval: 1000, stepSize: 1 }, options));

const LIB_NAME = 'React Timing Hooks';
const buildMessage = (message) => {
    return `${LIB_NAME}: ${message}`;
};
const log = (logFunction, message) => {
    console[logFunction](buildMessage(message));
};
const logError = (message) => log('error', message);
const logWarning = (message) => log('warn', message);

/**
 * Behaves like a regular use effect except that its callback receives a function-argument that allows
 * to run callbacks via `window.requestIdleCallback` inside the effect. Pending idle callbacks will be cleared on unmount.
 * @param effect
 * @param deps
 */
const useIdleCallbackEffect = (effect, deps) => {
    if (!window.requestIdleCallback) {
        logWarning('This browser does not support "requestIdleCallback"');
        return;
    }
    const idleCallbackHandle = react.useRef(null);
    const idleCallbackFunc = react.useCallback((callback, options) => {
        idleCallbackHandle.current = window.requestIdleCallback(callback, options);
        return idleCallbackHandle.current;
    }, [idleCallbackHandle]);
    react.useEffect(() => {
        return effect(idleCallbackFunc);
    }, deps);
    react.useEffect(() => {
        return function onUnmount() {
            if (idleCallbackHandle.current !== null) {
                window.cancelIdleCallback(idleCallbackHandle.current);
            }
        };
    }, [idleCallbackHandle]);
};

/**
 * Returns a function that can be used to invoke the given callback via `window.requestIdleCallback()`.
 *
 * Pending callbacks will be cleared in case the component unmounts.
 *
 * @param callback The callback that is invoked as soons as the browser invokes the idle callback
 * @param options Options for requestIdleCallback
 */
const useIdleCallback = (callback, options) => {
    if (!window.requestIdleCallback) {
        logWarning('This browser does not support "requestIdleCallback"');
        return callback;
    }
    const ricCallback = react.useRef(callback);
    const [handle, setHandle] = react.useState(null);
    react.useEffect(() => {
        ricCallback.current = callback;
    }, [callback]);
    react.useEffect(() => {
        return () => {
            if (handle) {
                window.cancelIdleCallback(handle);
            }
        };
    }, [handle]);
    return react.useCallback((...args) => {
        const h = window.requestIdleCallback(() => ricCallback.current(...args), options);
        setHandle(h);
    }, [options]);
};

/**
 * Returns a function that can be used to run the given callback via `window.requestAnimationFrame()`.
 *
 * Pending callbacks will be cleared in case the component unmounts.
 *
 * @param callback The callback that is invoked in the next animation frame
 */
const useAnimationFrame = (callback) => {
    const rafCallback = react.useRef(callback);
    const handleRef = react.useRef(null);
    react.useEffect(() => {
        rafCallback.current = callback;
    }, [callback]);
    react.useEffect(() => {
        return () => {
            if (handleRef.current) {
                cancelAnimationFrame(handleRef.current);
            }
        };
    }, []);
    return react.useCallback((...args) => {
        handleRef.current = requestAnimationFrame(() => rafCallback.current(...args));
        return handleRef.current;
    }, []);
};

const useAnimationFrameLoop = (callback, options = {}) => {
    const { startOnMount = false } = options;
    const rafCallback = react.useRef(callback);
    const _a = useControls(false, !startOnMount), { isPausedRef } = _a, controls = __rest(_a, ["isPausedRef"]);
    const { isStopped } = controls;
    react.useEffect(() => {
        rafCallback.current = callback;
    }, [callback]);
    const nextCallback = react.useCallback(() => {
        if (!isStopped) {
            if (!isPausedRef.current) {
                rafCallback.current();
            }
            runInLoop();
        }
    }, [isStopped]);
    const runInLoop = useAnimationFrame(nextCallback);
    react.useEffect(() => {
        if (!isStopped) {
            const h = runInLoop();
            return () => {
                cancelAnimationFrame(h);
            };
        }
    }, [runInLoop, isStopped]);
    return controls;
};

/**
 * Creates a sort of clock, i.e. a reactive time-based value that updates every second.
 * useClock is generic (by default useClock<string> is used). The generic type defines the return type which can be
 * changed by using a custom formatter (see options.customFormatter).
 *
 * @template [T=string]
 * @param options options.locales and options.dateTimeFormatOptions will be directly forwarded to date.toLocaleTimeString(). You can also use options.customFormatter to override the output of the hook. The output must match the generic type of the hook.
 * @returns The current (formatted) time
 */
const useClock = (options) => {
    const startTimeMs = (options === null || options === void 0 ? void 0 : options.startTimeInMilliseconds) || Date.now();
    const startTimeInSeconds = startTimeMs / 1000;
    const [currentTimeInSeconds, controls] = useTimer(startTimeInSeconds, {
        startOnMount: true,
    });
    const date = new Date(currentTimeInSeconds * 1000);
    const formattedTime = (options === null || options === void 0 ? void 0 : options.customFormatter)
        ? options === null || options === void 0 ? void 0 : options.customFormatter(date)
        : date.toLocaleTimeString(options === null || options === void 0 ? void 0 : options.locales, options === null || options === void 0 ? void 0 : options.dateTimeFormatOptions);
    return [formattedTime, controls];
};

/**
 * This hook creates a countdown that starts and ends at the specified numbers.
 * By default, the value will be changed every second and count downwards. Both properties can be changed, though.
 *
 * The user will be notified when the countdown ends via the event callback `options.onEnd()`.
 *
 * Use the returned `start()` callback or set `options.startOnMount` to start the countdown.
 *
 * @param from Start value
 * @param to End value. Will trigger the `options.onEnd()` callback.
 * @param options A set of countdown options.
 * @param options.onEnd If set, this callback will be called when the 2nd param "`to`" is reached.
 * @param [options.startOnMount = false] If true, the interval will immediately start on mount. If false, it has to be started manually via `start()`.
 * @returns an array: the first element is the countdown value, the second is an object of interval controls, see useInterval()
 */
const useCountdown = (from, to, options = {}) => {
    const onEndCallback = react.useRef(options.onEnd);
    const [value, counterControls] = useCounter(Object.assign({ start: from, interval: 1000, stepSize: -1 }, options));
    react.useEffect(() => {
        onEndCallback.current = options.onEnd;
    }, [options.onEnd]);
    react.useEffect(() => {
        if (to > from &&
            (typeof options.stepSize === 'undefined' || options.stepSize < 0)) {
            logError(`Stopped countdown because a countdown from ${from} to ${to} will never end`);
            counterControls.stop();
        }
    }, [from, to]);
    react.useEffect(() => {
        var _a;
        if (value === to) {
            counterControls.stop();
            (_a = onEndCallback.current) === null || _a === void 0 ? void 0 : _a.call(onEndCallback);
        }
    }, [value]);
    return [value, counterControls];
};

/**
 * Debounces a callback.
 *
 * By default, `options.trailing = true`, meaning that the callback will only be invoked as soon as a certain time
 * has passed since the last call (defined by `waitMs`).
 *
 * Alternatively, the function can also be called immediately and then be blocked on consecutive calls until the timeout
 * is over (when `options.leading` is true). You can also set both `options.leading` and `options.trailing` to `true`.
 *
 * @param callback
 * @param waitMs The minimum time until an invocation can happen.
 * @param options
 * @param [options.leading = false] If true, invoke before the timeout
 * @param [options.trailing = true] If true, invoke after the timeout
 */
function useDebounce(callback, waitMs, options = {}) {
    const { leading = false, trailing = true } = options;
    const debouncedCallback = react.useRef(callback);
    const timeoutId = react.useRef(null);
    react.useEffect(() => {
        debouncedCallback.current = callback;
    }, [callback]);
    react.useEffect(() => {
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);
    return react.useCallback((...args) => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        else if (leading) {
            debouncedCallback.current(...args);
        }
        timeoutId.current = setTimeout(() => {
            if (trailing) {
                debouncedCallback.current(...args);
            }
            timeoutId.current = null;
        }, waitMs);
        return timeoutId.current;
    }, [waitMs]);
}

/**
 * Throttles a callback.
 *
 * Can be used for **rate-limiting** – the callback will only be invoked every X milliseconds (X being the set timeout),
 * even if it was called more frequently.
 *
 * Similar, but different(!), is the `useDebounce()` hook, which blocks the invocation entirely until the function was
 * stopped being called for X milliseconds.
 *
 * By default, the throttled function will always be called immediately (`options.leading` is true by default) and then
 * (`options.trailing` is true by default) also after every X milliseconds for consecutive calls.
 *
 * @param callback
 * @param waitMs Minimum waiting time between consecutive calls
 * @param options
 * @param [options.leading = true] If true, invoke the callback immediately/before the timeout
 * @param [options.trailing = true] If true, queue invocations for after the timeout
 */
function useThrottle(callback, waitMs, options = {}) {
    const { leading = true, trailing = true } = options;
    const hadUnsuccessfulAttempt = react.useRef(false);
    const trailingArgs = react.useRef(null);
    const throttledCallback = react.useRef(callback);
    const timeoutId = react.useRef(null);
    react.useEffect(() => {
        throttledCallback.current = callback;
    }, [callback]);
    react.useEffect(() => {
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);
    const execThrottled = react.useCallback((...args) => {
        if (timeoutId.current) {
            if (trailing) {
                hadUnsuccessfulAttempt.current = true;
                trailingArgs.current = args;
            }
            return timeoutId.current;
        }
        if (!hadUnsuccessfulAttempt.current) {
            if (leading) {
                throttledCallback.current(...args);
            }
            else if (trailing) {
                hadUnsuccessfulAttempt.current = true;
                trailingArgs.current = args;
            }
        }
        timeoutId.current = setTimeout(() => {
            timeoutId.current = null;
            if (hadUnsuccessfulAttempt.current) {
                if (trailing) {
                    throttledCallback.current(...trailingArgs.current);
                }
                execThrottled(...trailingArgs.current);
                hadUnsuccessfulAttempt.current = false;
            }
        }, waitMs);
        return timeoutId.current;
    }, [waitMs]);
    return execThrottled;
}

exports.useAnimationFrame = useAnimationFrame;
exports.useAnimationFrameLoop = useAnimationFrameLoop;
exports.useClock = useClock;
exports.useCountdown = useCountdown;
exports.useCounter = useCounter;
exports.useDebounce = useDebounce;
exports.useIdleCallback = useIdleCallback;
exports.useIdleCallbackEffect = useIdleCallbackEffect;
exports.useInterval = useInterval;
exports.useThrottle = useThrottle;
exports.useTimeout = useTimeout;
exports.useTimeoutEffect = useTimeoutEffect;
exports.useTimer = useTimer;
