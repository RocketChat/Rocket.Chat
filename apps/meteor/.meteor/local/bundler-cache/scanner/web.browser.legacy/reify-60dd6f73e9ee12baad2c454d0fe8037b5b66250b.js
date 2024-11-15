var $32tCg$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "SSRProvider", () => $97d95f6660b1bb14$export$9f8ac96af4b1b2ae);
$parcel$export(module.exports, "useSSRSafeId", () => $97d95f6660b1bb14$export$619500959fc48b26);
$parcel$export(module.exports, "useIsSSR", () => $97d95f6660b1bb14$export$535bd6ca7f90a273);
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ /*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ // We must avoid a circular dependency with @react-aria/utils, and this useLayoutEffect is
// guarded by a check that it only runs on the client side.
// eslint-disable-next-line rulesdir/useLayoutEffectRule

// Default context value to use in case there is no SSRProvider. This is fine for
// client-only apps. In order to support multiple copies of React Aria potentially
// being on the page at once, the prefix is set to a random number. SSRProvider
// will reset this to zero for consistency between server and client, so in the
// SSR case multiple copies of React Aria is not supported.
const $97d95f6660b1bb14$var$defaultContext = {
    prefix: String(Math.round(Math.random() * 10000000000)),
    current: 0
};
const $97d95f6660b1bb14$var$SSRContext = /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createContext($97d95f6660b1bb14$var$defaultContext);
const $97d95f6660b1bb14$var$IsSSRContext = /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createContext(false);
// This is only used in React < 18.
function $97d95f6660b1bb14$var$LegacySSRProvider(props) {
    let cur = (0, $32tCg$react.useContext)($97d95f6660b1bb14$var$SSRContext);
    let counter = $97d95f6660b1bb14$var$useCounter(cur === $97d95f6660b1bb14$var$defaultContext);
    let [isSSR, setIsSSR] = (0, $32tCg$react.useState)(true);
    let value = (0, $32tCg$react.useMemo)(()=>({
            // If this is the first SSRProvider, start with an empty string prefix, otherwise
            // append and increment the counter.
            prefix: cur === $97d95f6660b1bb14$var$defaultContext ? "" : `${cur.prefix}-${counter}`,
            current: 0
        }), [
        cur,
        counter
    ]);
    // If on the client, and the component was initially server rendered,
    // then schedule a layout effect to update the component after hydration.
    if (typeof document !== "undefined") // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, $32tCg$react.useLayoutEffect)(()=>{
        setIsSSR(false);
    }, []);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createElement($97d95f6660b1bb14$var$SSRContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createElement($97d95f6660b1bb14$var$IsSSRContext.Provider, {
        value: isSSR
    }, props.children));
}
let $97d95f6660b1bb14$var$warnedAboutSSRProvider = false;
function $97d95f6660b1bb14$export$9f8ac96af4b1b2ae(props) {
    if (typeof (0, ($parcel$interopDefault($32tCg$react)))["useId"] === "function") {
        if (process.env.NODE_ENV !== "test" && !$97d95f6660b1bb14$var$warnedAboutSSRProvider) {
            console.warn("In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.");
            $97d95f6660b1bb14$var$warnedAboutSSRProvider = true;
        }
        return /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createElement((0, ($parcel$interopDefault($32tCg$react))).Fragment, null, props.children);
    }
    return /*#__PURE__*/ (0, ($parcel$interopDefault($32tCg$react))).createElement($97d95f6660b1bb14$var$LegacySSRProvider, props);
}
let $97d95f6660b1bb14$var$canUseDOM = Boolean(typeof window !== "undefined" && window.document && window.document.createElement);
let $97d95f6660b1bb14$var$componentIds = new WeakMap();
function $97d95f6660b1bb14$var$useCounter(isDisabled = false) {
    let ctx = (0, $32tCg$react.useContext)($97d95f6660b1bb14$var$SSRContext);
    let ref = (0, $32tCg$react.useRef)(null);
    // eslint-disable-next-line rulesdir/pure-render
    if (ref.current === null && !isDisabled) {
        var _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner, _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        // In strict mode, React renders components twice, and the ref will be reset to null on the second render.
        // This means our id counter will be incremented twice instead of once. This is a problem because on the
        // server, components are only rendered once and so ids generated on the server won't match the client.
        // In React 18, useId was introduced to solve this, but it is not available in older versions. So to solve this
        // we need to use some React internals to access the underlying Fiber instance, which is stable between renders.
        // This is exposed as ReactCurrentOwner in development, which is all we need since StrictMode only runs in development.
        // To ensure that we only increment the global counter once, we store the starting id for this component in
        // a weak map associated with the Fiber. On the second render, we reset the global counter to this value.
        // Since React runs the second render immediately after the first, this is safe.
        // @ts-ignore
        let currentOwner = (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = (0, ($parcel$interopDefault($32tCg$react))).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === void 0 ? void 0 : (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner = _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner === void 0 ? void 0 : _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner.current;
        if (currentOwner) {
            let prevComponentValue = $97d95f6660b1bb14$var$componentIds.get(currentOwner);
            if (prevComponentValue == null) // On the first render, and first call to useId, store the id and state in our weak map.
            $97d95f6660b1bb14$var$componentIds.set(currentOwner, {
                id: ctx.current,
                state: currentOwner.memoizedState
            });
            else if (currentOwner.memoizedState !== prevComponentValue.state) {
                // On the second render, the memoizedState gets reset by React.
                // Reset the counter, and remove from the weak map so we don't
                // do this for subsequent useId calls.
                ctx.current = prevComponentValue.id;
                $97d95f6660b1bb14$var$componentIds.delete(currentOwner);
            }
        }
        // eslint-disable-next-line rulesdir/pure-render
        ref.current = ++ctx.current;
    }
    // eslint-disable-next-line rulesdir/pure-render
    return ref.current;
}
function $97d95f6660b1bb14$var$useLegacySSRSafeId(defaultId) {
    let ctx = (0, $32tCg$react.useContext)($97d95f6660b1bb14$var$SSRContext);
    // If we are rendering in a non-DOM environment, and there's no SSRProvider,
    // provide a warning to hint to the developer to add one.
    if (ctx === $97d95f6660b1bb14$var$defaultContext && !$97d95f6660b1bb14$var$canUseDOM) console.warn("When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.");
    let counter = $97d95f6660b1bb14$var$useCounter(!!defaultId);
    let prefix = ctx === $97d95f6660b1bb14$var$defaultContext && process.env.NODE_ENV === "test" ? "react-aria" : `react-aria${ctx.prefix}`;
    return defaultId || `${prefix}-${counter}`;
}
function $97d95f6660b1bb14$var$useModernSSRSafeId(defaultId) {
    // @ts-ignore
    let id = (0, ($parcel$interopDefault($32tCg$react))).useId();
    let [didSSR] = (0, $32tCg$react.useState)($97d95f6660b1bb14$export$535bd6ca7f90a273());
    let prefix = didSSR || process.env.NODE_ENV === "test" ? "react-aria" : `react-aria${$97d95f6660b1bb14$var$defaultContext.prefix}`;
    return defaultId || `${prefix}-${id}`;
}
const $97d95f6660b1bb14$export$619500959fc48b26 = typeof (0, ($parcel$interopDefault($32tCg$react)))["useId"] === "function" ? $97d95f6660b1bb14$var$useModernSSRSafeId : $97d95f6660b1bb14$var$useLegacySSRSafeId;
function $97d95f6660b1bb14$var$getSnapshot() {
    return false;
}
function $97d95f6660b1bb14$var$getServerSnapshot() {
    return true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function $97d95f6660b1bb14$var$subscribe(onStoreChange) {
    // noop
    return ()=>{};
}
function $97d95f6660b1bb14$export$535bd6ca7f90a273() {
    // In React 18, we can use useSyncExternalStore to detect if we're server rendering or hydrating.
    if (typeof (0, ($parcel$interopDefault($32tCg$react)))["useSyncExternalStore"] === "function") return (0, ($parcel$interopDefault($32tCg$react)))["useSyncExternalStore"]($97d95f6660b1bb14$var$subscribe, $97d95f6660b1bb14$var$getSnapshot, $97d95f6660b1bb14$var$getServerSnapshot);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return (0, $32tCg$react.useContext)($97d95f6660b1bb14$var$IsSSRContext);
}




//# sourceMappingURL=main.js.map
