var $4hxXn$react = require("react");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "SSRProvider", () => $29383e587d62412a$export$9f8ac96af4b1b2ae);
$parcel$export(module.exports, "useSSRSafeId", () => $29383e587d62412a$export$619500959fc48b26);
$parcel$export(module.exports, "useIsSSR", () => $29383e587d62412a$export$535bd6ca7f90a273);
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
const $29383e587d62412a$var$defaultContext = {
    prefix: String(Math.round(Math.random() * 10000000000)),
    current: 0,
    isSSR: false
};
const $29383e587d62412a$var$SSRContext = /*#__PURE__*/ (0, ($parcel$interopDefault($4hxXn$react))).createContext($29383e587d62412a$var$defaultContext);
function $29383e587d62412a$export$9f8ac96af4b1b2ae(props) {
    let cur = (0, $4hxXn$react.useContext)($29383e587d62412a$var$SSRContext);
    let counter = $29383e587d62412a$var$useCounter(cur === $29383e587d62412a$var$defaultContext);
    let [isSSR, setIsSSR] = (0, $4hxXn$react.useState)(true);
    let value = (0, $4hxXn$react.useMemo)(()=>({
            // If this is the first SSRProvider, start with an empty string prefix, otherwise
            // append and increment the counter.
            prefix: cur === $29383e587d62412a$var$defaultContext ? "" : `${cur.prefix}-${counter}`,
            current: 0,
            isSSR: isSSR
        }), [
        cur,
        counter,
        isSSR
    ]);
    // If on the client, and the component was initially server rendered,
    // then schedule a layout effect to update the component after hydration.
    if (typeof window !== "undefined") // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, $4hxXn$react.useLayoutEffect)(()=>{
        setIsSSR(false);
    }, []);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($4hxXn$react))).createElement($29383e587d62412a$var$SSRContext.Provider, {
        value: value
    }, props.children);
}
let $29383e587d62412a$var$canUseDOM = Boolean(typeof window !== "undefined" && window.document && window.document.createElement);
let $29383e587d62412a$var$componentIds = new WeakMap();
function $29383e587d62412a$var$useCounter(isDisabled = false) {
    let ctx = (0, $4hxXn$react.useContext)($29383e587d62412a$var$SSRContext);
    let ref = (0, $4hxXn$react.useRef)(null);
    if (ref.current === null && !isDisabled) {
        var _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner;
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
        let currentOwner = (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = (0, ($parcel$interopDefault($4hxXn$react))).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === void 0 ? void 0 : (_React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner = _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner) === null || _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner === void 0 ? void 0 : _React___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_ReactCurrentOwner.current;
        if (currentOwner) {
            let prevComponentValue = $29383e587d62412a$var$componentIds.get(currentOwner);
            if (prevComponentValue == null) // On the first render, and first call to useId, store the id and state in our weak map.
            $29383e587d62412a$var$componentIds.set(currentOwner, {
                id: ctx.current,
                state: currentOwner.memoizedState
            });
            else if (currentOwner.memoizedState !== prevComponentValue.state) {
                // On the second render, the memoizedState gets reset by React.
                // Reset the counter, and remove from the weak map so we don't
                // do this for subsequent useId calls.
                ctx.current = prevComponentValue.id;
                $29383e587d62412a$var$componentIds.delete(currentOwner);
            }
        }
        ref.current = ++ctx.current;
    }
    return ref.current;
}
function $29383e587d62412a$export$619500959fc48b26(defaultId) {
    let ctx = (0, $4hxXn$react.useContext)($29383e587d62412a$var$SSRContext);
    // If we are rendering in a non-DOM environment, and there's no SSRProvider,
    // provide a warning to hint to the developer to add one.
    if (ctx === $29383e587d62412a$var$defaultContext && !$29383e587d62412a$var$canUseDOM) console.warn("When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.");
    let counter = $29383e587d62412a$var$useCounter(!!defaultId);
    return defaultId || `react-aria${ctx.prefix}-${counter}`;
}
function $29383e587d62412a$export$535bd6ca7f90a273() {
    let cur = (0, $4hxXn$react.useContext)($29383e587d62412a$var$SSRContext);
    return cur.isSSR;
}




//# sourceMappingURL=main.js.map
