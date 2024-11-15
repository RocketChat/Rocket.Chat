var $1Yh1N$reactstatelyutils = require("@react-stately/utils");
var $1Yh1N$react = require("react");
var $1Yh1N$reactariassr = require("@react-aria/ssr");
var $1Yh1N$clsx = require("clsx");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useId", () => $8c61827343eed941$export$f680877a34711e37);
$parcel$export(module.exports, "mergeIds", () => $8c61827343eed941$export$cd8c9cb68f842629);
$parcel$export(module.exports, "useSlotId", () => $8c61827343eed941$export$b4cc09c592e8fdb8);
$parcel$export(module.exports, "chain", () => $1e2191638e54f613$export$e08e3b67e392101e);
$parcel$export(module.exports, "mergeProps", () => $f847cd1382ea7cd4$export$9d1611c77c2fe928);
$parcel$export(module.exports, "mergeRefs", () => $f05dc24eafaeb7e2$export$c9058316764c140e);
$parcel$export(module.exports, "filterDOMProps", () => $8d15d0e1797d4238$export$457c3d6518dd4c6f);
$parcel$export(module.exports, "focusWithoutScrolling", () => $1117b6c0d4c4c164$export$de79e2c695e052f3);
$parcel$export(module.exports, "getOffset", () => $16ec41ef3e36c19c$export$622cea445a1c5b7d);
$parcel$export(module.exports, "runAfterTransition", () => $e8117ebcab55be6a$export$24490316f764c430);
$parcel$export(module.exports, "useDrag1D", () => $28ed3fb20343b78b$export$7bbed75feba39706);
$parcel$export(module.exports, "useGlobalListeners", () => $4571ff54ac709100$export$4eaf04e54aa8eed6);
$parcel$export(module.exports, "useLabels", () => $6ec78bde395c477d$export$d6875122194c7b44);
$parcel$export(module.exports, "useObjectRef", () => $475b35fe72ba49b3$export$4338b53315abf666);
$parcel$export(module.exports, "useUpdateEffect", () => $29293a6f5c75b37e$export$496315a1608d9602);
$parcel$export(module.exports, "useLayoutEffect", () => $78605a5d7424e31b$export$e5c5a5f917a5871c);
$parcel$export(module.exports, "useResizeObserver", () => $37733e1652f47193$export$683480f191c0e3ea);
$parcel$export(module.exports, "useSyncRef", () => $6fc733991a9f977c$export$4debdb1a3f0fa79e);
$parcel$export(module.exports, "getScrollParent", () => $d796e7157ac96470$export$cfa2225e87938781);
$parcel$export(module.exports, "isScrollable", () => $d796e7157ac96470$export$2bb74740c4e19def);
$parcel$export(module.exports, "useViewportSize", () => $8b24bab62f5c65ad$export$d699905dd57c73ca);
$parcel$export(module.exports, "useDescription", () => $34da4502ea8120db$export$f8aeda7b10753fa1);
$parcel$export(module.exports, "isMac", () => $9e20cff0af27e8cc$export$9ac100e40613ea10);
$parcel$export(module.exports, "isIPhone", () => $9e20cff0af27e8cc$export$186c6964ca17d99);
$parcel$export(module.exports, "isIPad", () => $9e20cff0af27e8cc$export$7bef049ce92e4224);
$parcel$export(module.exports, "isIOS", () => $9e20cff0af27e8cc$export$fedb369cb70207f1);
$parcel$export(module.exports, "isAppleDevice", () => $9e20cff0af27e8cc$export$e1865c3bedcd822b);
$parcel$export(module.exports, "isWebKit", () => $9e20cff0af27e8cc$export$78551043582a6a98);
$parcel$export(module.exports, "isChrome", () => $9e20cff0af27e8cc$export$6446a186d09e379e);
$parcel$export(module.exports, "isAndroid", () => $9e20cff0af27e8cc$export$a11b0059900ceec8);
$parcel$export(module.exports, "useEvent", () => $2a8c0bb1629926c8$export$90fc3a17d93f704c);
$parcel$export(module.exports, "useValueEffect", () => $19a2307bfabafaf1$export$14d238f342723f25);
$parcel$export(module.exports, "scrollIntoView", () => $449412113267a1fe$export$53a0910f038337bd);
$parcel$export(module.exports, "scrollIntoViewport", () => $449412113267a1fe$export$c826860796309d1b);
$parcel$export(module.exports, "clamp", () => $1Yh1N$reactstatelyutils.clamp);
$parcel$export(module.exports, "snapValueToStep", () => $1Yh1N$reactstatelyutils.snapValueToStep);
$parcel$export(module.exports, "isVirtualClick", () => $577e795361f19be9$export$60278871457622de);
$parcel$export(module.exports, "isVirtualPointerEvent", () => $577e795361f19be9$export$29bf1b5f2c56cf63);
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
 */ 
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
 */ 
const $78605a5d7424e31b$export$e5c5a5f917a5871c = typeof window !== "undefined" ? (0, ($parcel$interopDefault($1Yh1N$react))).useLayoutEffect : ()=>{};



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
 */ 

function $19a2307bfabafaf1$export$14d238f342723f25(defaultValue) {
    let [value, setValue] = (0, $1Yh1N$react.useState)(defaultValue);
    let valueRef = (0, $1Yh1N$react.useRef)(value);
    let effect = (0, $1Yh1N$react.useRef)(null);
    valueRef.current = value;
    // Store the function in a ref so we can always access the current version
    // which has the proper `value` in scope.
    let nextRef = (0, $1Yh1N$react.useRef)(null);
    nextRef.current = ()=>{
        // Run the generator to the next yield.
        let newValue = effect.current.next();
        // If the generator is done, reset the effect.
        if (newValue.done) {
            effect.current = null;
            return;
        }
        // If the value is the same as the current value,
        // then continue to the next yield. Otherwise,
        // set the value in state and wait for the next layout effect.
        if (value === newValue.value) nextRef.current();
        else setValue(newValue.value);
    };
    (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(()=>{
        // If there is an effect currently running, continue to the next yield.
        if (effect.current) nextRef.current();
    });
    let queue = (0, $1Yh1N$react.useCallback)((fn)=>{
        effect.current = fn(valueRef.current);
        nextRef.current();
    }, [
        effect,
        nextRef
    ]);
    return [
        value,
        queue
    ];
}


let $8c61827343eed941$var$idsUpdaterMap = new Map();
function $8c61827343eed941$export$f680877a34711e37(defaultId) {
    let [value, setValue] = (0, $1Yh1N$react.useState)(defaultId);
    let nextId = (0, $1Yh1N$react.useRef)(null);
    let res = (0, $1Yh1N$reactariassr.useSSRSafeId)(value);
    let updateValue = (0, $1Yh1N$react.useCallback)((val)=>{
        nextId.current = val;
    }, []);
    $8c61827343eed941$var$idsUpdaterMap.set(res, updateValue);
    (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(()=>{
        let r = res;
        return ()=>{
            $8c61827343eed941$var$idsUpdaterMap.delete(r);
        };
    }, [
        res
    ]);
    // This cannot cause an infinite loop because the ref is updated first.
    // eslint-disable-next-line
    (0, $1Yh1N$react.useEffect)(()=>{
        let newId = nextId.current;
        if (newId) {
            nextId.current = null;
            setValue(newId);
        }
    });
    return res;
}
function $8c61827343eed941$export$cd8c9cb68f842629(idA, idB) {
    if (idA === idB) return idA;
    let setIdA = $8c61827343eed941$var$idsUpdaterMap.get(idA);
    if (setIdA) {
        setIdA(idB);
        return idB;
    }
    let setIdB = $8c61827343eed941$var$idsUpdaterMap.get(idB);
    if (setIdB) {
        setIdB(idA);
        return idA;
    }
    return idB;
}
function $8c61827343eed941$export$b4cc09c592e8fdb8(depArray = []) {
    let id = $8c61827343eed941$export$f680877a34711e37();
    let [resolvedId, setResolvedId] = (0, $19a2307bfabafaf1$export$14d238f342723f25)(id);
    let updateId = (0, $1Yh1N$react.useCallback)(()=>{
        setResolvedId(function*() {
            yield id;
            yield document.getElementById(id) ? id : undefined;
        });
    }, [
        id,
        setResolvedId
    ]);
    (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(updateId, [
        id,
        updateId,
        ...depArray
    ]);
    return resolvedId;
}


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
 */ /**
 * Calls all functions in the order they were chained with the same arguments.
 */ function $1e2191638e54f613$export$e08e3b67e392101e(...callbacks) {
    return (...args)=>{
        for (let callback of callbacks)if (typeof callback === "function") callback(...args);
    };
}


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
 */ 


function $f847cd1382ea7cd4$export$9d1611c77c2fe928(...args) {
    // Start with a base clone of the first argument. This is a lot faster than starting
    // with an empty object and adding properties as we go.
    let result = {
        ...args[0]
    };
    for(let i = 1; i < args.length; i++){
        let props = args[i];
        for(let key in props){
            let a = result[key];
            let b = props[key];
            // Chain events
            if (typeof a === "function" && typeof b === "function" && // This is a lot faster than a regex.
            key[0] === "o" && key[1] === "n" && key.charCodeAt(2) >= /* 'A' */ 65 && key.charCodeAt(2) <= /* 'Z' */ 90) result[key] = (0, $1e2191638e54f613$export$e08e3b67e392101e)(a, b);
            else if ((key === "className" || key === "UNSAFE_className") && typeof a === "string" && typeof b === "string") result[key] = (0, ($parcel$interopDefault($1Yh1N$clsx)))(a, b);
            else if (key === "id" && a && b) result.id = (0, $8c61827343eed941$export$cd8c9cb68f842629)(a, b);
            else result[key] = b !== undefined ? b : a;
        }
    }
    return result;
}


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
 */ function $f05dc24eafaeb7e2$export$c9058316764c140e(...refs) {
    if (refs.length === 1) return refs[0];
    return (value)=>{
        for (let ref of refs){
            if (typeof ref === "function") ref(value);
            else if (ref != null) ref.current = value;
        }
    };
}


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
 */ const $8d15d0e1797d4238$var$DOMPropNames = new Set([
    "id"
]);
const $8d15d0e1797d4238$var$labelablePropNames = new Set([
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-details"
]);
const $8d15d0e1797d4238$var$propRe = /^(data-.*)$/;
function $8d15d0e1797d4238$export$457c3d6518dd4c6f(props, opts = {}) {
    let { labelable: labelable , propNames: propNames  } = opts;
    let filteredProps = {};
    for(const prop in props)if (Object.prototype.hasOwnProperty.call(props, prop) && ($8d15d0e1797d4238$var$DOMPropNames.has(prop) || labelable && $8d15d0e1797d4238$var$labelablePropNames.has(prop) || (propNames === null || propNames === void 0 ? void 0 : propNames.has(prop)) || $8d15d0e1797d4238$var$propRe.test(prop))) filteredProps[prop] = props[prop];
    return filteredProps;
}


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
 */ function $1117b6c0d4c4c164$export$de79e2c695e052f3(element) {
    if ($1117b6c0d4c4c164$var$supportsPreventScroll()) element.focus({
        preventScroll: true
    });
    else {
        let scrollableElements = $1117b6c0d4c4c164$var$getScrollableElements(element);
        element.focus();
        $1117b6c0d4c4c164$var$restoreScrollPosition(scrollableElements);
    }
}
let $1117b6c0d4c4c164$var$supportsPreventScrollCached = null;
function $1117b6c0d4c4c164$var$supportsPreventScroll() {
    if ($1117b6c0d4c4c164$var$supportsPreventScrollCached == null) {
        $1117b6c0d4c4c164$var$supportsPreventScrollCached = false;
        try {
            var focusElem = document.createElement("div");
            focusElem.focus({
                get preventScroll () {
                    $1117b6c0d4c4c164$var$supportsPreventScrollCached = true;
                    return true;
                }
            });
        } catch (e) {
        // Ignore
        }
    }
    return $1117b6c0d4c4c164$var$supportsPreventScrollCached;
}
function $1117b6c0d4c4c164$var$getScrollableElements(element) {
    var parent = element.parentNode;
    var scrollableElements = [];
    var rootScrollingElement = document.scrollingElement || document.documentElement;
    while(parent instanceof HTMLElement && parent !== rootScrollingElement){
        if (parent.offsetHeight < parent.scrollHeight || parent.offsetWidth < parent.scrollWidth) scrollableElements.push({
            element: parent,
            scrollTop: parent.scrollTop,
            scrollLeft: parent.scrollLeft
        });
        parent = parent.parentNode;
    }
    if (rootScrollingElement instanceof HTMLElement) scrollableElements.push({
        element: rootScrollingElement,
        scrollTop: rootScrollingElement.scrollTop,
        scrollLeft: rootScrollingElement.scrollLeft
    });
    return scrollableElements;
}
function $1117b6c0d4c4c164$var$restoreScrollPosition(scrollableElements) {
    for (let { element: element , scrollTop: scrollTop , scrollLeft: scrollLeft  } of scrollableElements){
        element.scrollTop = scrollTop;
        element.scrollLeft = scrollLeft;
    }
}


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
 */ function $16ec41ef3e36c19c$export$622cea445a1c5b7d(element, reverse, orientation = "horizontal") {
    let rect = element.getBoundingClientRect();
    if (reverse) return orientation === "horizontal" ? rect.right : rect.bottom;
    return orientation === "horizontal" ? rect.left : rect.top;
}


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
 */ // We store a global list of elements that are currently transitioning,
// mapped to a set of CSS properties that are transitioning for that element.
// This is necessary rather than a simple count of transitions because of browser
// bugs, e.g. Chrome sometimes fires both transitionend and transitioncancel rather
// than one or the other. So we need to track what's actually transitioning so that
// we can ignore these duplicate events.
let $e8117ebcab55be6a$var$transitionsByElement = new Map();
// A list of callbacks to call once there are no transitioning elements.
let $e8117ebcab55be6a$var$transitionCallbacks = new Set();
function $e8117ebcab55be6a$var$setupGlobalEvents() {
    if (typeof window === "undefined") return;
    let onTransitionStart = (e)=>{
        // Add the transitioning property to the list for this element.
        let transitions = $e8117ebcab55be6a$var$transitionsByElement.get(e.target);
        if (!transitions) {
            transitions = new Set();
            $e8117ebcab55be6a$var$transitionsByElement.set(e.target, transitions);
            // The transitioncancel event must be registered on the element itself, rather than as a global
            // event. This enables us to handle when the node is deleted from the document while it is transitioning.
            // In that case, the cancel event would have nowhere to bubble to so we need to handle it directly.
            e.target.addEventListener("transitioncancel", onTransitionEnd);
        }
        transitions.add(e.propertyName);
    };
    let onTransitionEnd = (e)=>{
        // Remove property from list of transitioning properties.
        let properties = $e8117ebcab55be6a$var$transitionsByElement.get(e.target);
        if (!properties) return;
        properties.delete(e.propertyName);
        // If empty, remove transitioncancel event, and remove the element from the list of transitioning elements.
        if (properties.size === 0) {
            e.target.removeEventListener("transitioncancel", onTransitionEnd);
            $e8117ebcab55be6a$var$transitionsByElement.delete(e.target);
        }
        // If no transitioning elements, call all of the queued callbacks.
        if ($e8117ebcab55be6a$var$transitionsByElement.size === 0) {
            for (let cb of $e8117ebcab55be6a$var$transitionCallbacks)cb();
            $e8117ebcab55be6a$var$transitionCallbacks.clear();
        }
    };
    document.body.addEventListener("transitionrun", onTransitionStart);
    document.body.addEventListener("transitionend", onTransitionEnd);
}
if (typeof document !== "undefined") {
    if (document.readyState !== "loading") $e8117ebcab55be6a$var$setupGlobalEvents();
    else document.addEventListener("DOMContentLoaded", $e8117ebcab55be6a$var$setupGlobalEvents);
}
function $e8117ebcab55be6a$export$24490316f764c430(fn) {
    // Wait one frame to see if an animation starts, e.g. a transition on mount.
    requestAnimationFrame(()=>{
        // If no transitions are running, call the function immediately.
        // Otherwise, add it to a list of callbacks to run at the end of the animation.
        if ($e8117ebcab55be6a$var$transitionsByElement.size === 0) fn();
        else $e8117ebcab55be6a$var$transitionCallbacks.add(fn);
    });
}


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
 */ 

// Keep track of elements that we are currently handling dragging for via useDrag1D.
// If there's an ancestor and a descendant both using useDrag1D(), and the user starts
// dragging the descendant, we don't want useDrag1D events to fire for the ancestor.
const $28ed3fb20343b78b$var$draggingElements = [];
function $28ed3fb20343b78b$export$7bbed75feba39706(props) {
    console.warn("useDrag1D is deprecated, please use `useMove` instead https://react-spectrum.adobe.com/react-aria/useMove.html");
    let { containerRef: containerRef , reverse: reverse , orientation: orientation , onHover: onHover , onDrag: onDrag , onPositionChange: onPositionChange , onIncrement: onIncrement , onDecrement: onDecrement , onIncrementToMax: onIncrementToMax , onDecrementToMin: onDecrementToMin , onCollapseToggle: onCollapseToggle  } = props;
    let getPosition = (e)=>orientation === "horizontal" ? e.clientX : e.clientY;
    let getNextOffset = (e)=>{
        let containerOffset = (0, $16ec41ef3e36c19c$export$622cea445a1c5b7d)(containerRef.current, reverse, orientation);
        let mouseOffset = getPosition(e);
        let nextOffset = reverse ? containerOffset - mouseOffset : mouseOffset - containerOffset;
        return nextOffset;
    };
    let dragging = (0, $1Yh1N$react.useRef)(false);
    let prevPosition = (0, $1Yh1N$react.useRef)(0);
    // Keep track of the current handlers in a ref so that the events can access them.
    let handlers = (0, $1Yh1N$react.useRef)({
        onPositionChange: onPositionChange,
        onDrag: onDrag
    });
    handlers.current.onDrag = onDrag;
    handlers.current.onPositionChange = onPositionChange;
    let onMouseDragged = (e)=>{
        e.preventDefault();
        let nextOffset = getNextOffset(e);
        if (!dragging.current) {
            dragging.current = true;
            if (handlers.current.onDrag) handlers.current.onDrag(true);
            if (handlers.current.onPositionChange) handlers.current.onPositionChange(nextOffset);
        }
        if (prevPosition.current === nextOffset) return;
        prevPosition.current = nextOffset;
        if (onPositionChange) onPositionChange(nextOffset);
    };
    let onMouseUp = (e)=>{
        const target = e.target;
        dragging.current = false;
        let nextOffset = getNextOffset(e);
        if (handlers.current.onDrag) handlers.current.onDrag(false);
        if (handlers.current.onPositionChange) handlers.current.onPositionChange(nextOffset);
        $28ed3fb20343b78b$var$draggingElements.splice($28ed3fb20343b78b$var$draggingElements.indexOf(target), 1);
        window.removeEventListener("mouseup", onMouseUp, false);
        window.removeEventListener("mousemove", onMouseDragged, false);
    };
    let onMouseDown = (e)=>{
        const target = e.currentTarget;
        // If we're already handling dragging on a descendant with useDrag1D, then
        // we don't want to handle the drag motion on this target as well.
        if ($28ed3fb20343b78b$var$draggingElements.some((elt)=>target.contains(elt))) return;
        $28ed3fb20343b78b$var$draggingElements.push(target);
        window.addEventListener("mousemove", onMouseDragged, false);
        window.addEventListener("mouseup", onMouseUp, false);
    };
    let onMouseEnter = ()=>{
        if (onHover) onHover(true);
    };
    let onMouseOut = ()=>{
        if (onHover) onHover(false);
    };
    let onKeyDown = (e)=>{
        switch(e.key){
            case "Left":
            case "ArrowLeft":
                if (orientation === "horizontal") {
                    e.preventDefault();
                    if (onDecrement && !reverse) onDecrement();
                    else if (onIncrement && reverse) onIncrement();
                }
                break;
            case "Up":
            case "ArrowUp":
                if (orientation === "vertical") {
                    e.preventDefault();
                    if (onDecrement && !reverse) onDecrement();
                    else if (onIncrement && reverse) onIncrement();
                }
                break;
            case "Right":
            case "ArrowRight":
                if (orientation === "horizontal") {
                    e.preventDefault();
                    if (onIncrement && !reverse) onIncrement();
                    else if (onDecrement && reverse) onDecrement();
                }
                break;
            case "Down":
            case "ArrowDown":
                if (orientation === "vertical") {
                    e.preventDefault();
                    if (onIncrement && !reverse) onIncrement();
                    else if (onDecrement && reverse) onDecrement();
                }
                break;
            case "Home":
                e.preventDefault();
                if (onDecrementToMin) onDecrementToMin();
                break;
            case "End":
                e.preventDefault();
                if (onIncrementToMax) onIncrementToMax();
                break;
            case "Enter":
                e.preventDefault();
                if (onCollapseToggle) onCollapseToggle();
                break;
        }
    };
    return {
        onMouseDown: onMouseDown,
        onMouseEnter: onMouseEnter,
        onMouseOut: onMouseOut,
        onKeyDown: onKeyDown
    };
}


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
 */ 
function $4571ff54ac709100$export$4eaf04e54aa8eed6() {
    let globalListeners = (0, $1Yh1N$react.useRef)(new Map());
    let addGlobalListener = (0, $1Yh1N$react.useCallback)((eventTarget, type, listener, options)=>{
        // Make sure we remove the listener after it is called with the `once` option.
        let fn = (options === null || options === void 0 ? void 0 : options.once) ? (...args)=>{
            globalListeners.current.delete(listener);
            listener(...args);
        } : listener;
        globalListeners.current.set(listener, {
            type: type,
            eventTarget: eventTarget,
            fn: fn,
            options: options
        });
        eventTarget.addEventListener(type, listener, options);
    }, []);
    let removeGlobalListener = (0, $1Yh1N$react.useCallback)((eventTarget, type, listener, options)=>{
        var _globalListeners_current_get;
        let fn = ((_globalListeners_current_get = globalListeners.current.get(listener)) === null || _globalListeners_current_get === void 0 ? void 0 : _globalListeners_current_get.fn) || listener;
        eventTarget.removeEventListener(type, fn, options);
        globalListeners.current.delete(listener);
    }, []);
    let removeAllGlobalListeners = (0, $1Yh1N$react.useCallback)(()=>{
        globalListeners.current.forEach((value, key)=>{
            removeGlobalListener(value.eventTarget, value.type, key, value.options);
        });
    }, [
        removeGlobalListener
    ]);
    // eslint-disable-next-line arrow-body-style
    (0, $1Yh1N$react.useEffect)(()=>{
        return removeAllGlobalListeners;
    }, [
        removeAllGlobalListeners
    ]);
    return {
        addGlobalListener: addGlobalListener,
        removeGlobalListener: removeGlobalListener,
        removeAllGlobalListeners: removeAllGlobalListeners
    };
}


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
 */ 
function $6ec78bde395c477d$export$d6875122194c7b44(props, defaultLabel) {
    let { id: id , "aria-label": label , "aria-labelledby": labelledBy  } = props;
    // If there is both an aria-label and aria-labelledby,
    // combine them by pointing to the element itself.
    id = (0, $8c61827343eed941$export$f680877a34711e37)(id);
    if (labelledBy && label) {
        let ids = new Set([
            ...labelledBy.trim().split(/\s+/),
            id
        ]);
        labelledBy = [
            ...ids
        ].join(" ");
    } else if (labelledBy) labelledBy = labelledBy.trim().split(/\s+/).join(" ");
    // If no labels are provided, use the default
    if (!label && !labelledBy && defaultLabel) label = defaultLabel;
    return {
        id: id,
        "aria-label": label,
        "aria-labelledby": labelledBy
    };
}


/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $475b35fe72ba49b3$export$4338b53315abf666(forwardedRef) {
    const objRef = (0, $1Yh1N$react.useRef)();
    /**
   * We're using `useLayoutEffect` here instead of `useEffect` because we want
   * to make sure that the `ref` value is up to date before other places in the
   * the execution cycle try to read it.
   */ (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(()=>{
        if (!forwardedRef) return;
        if (typeof forwardedRef === "function") forwardedRef(objRef.current);
        else forwardedRef.current = objRef.current;
        return ()=>{
            if (typeof forwardedRef === "function") forwardedRef(null);
            else forwardedRef.current = null;
        };
    }, [
        forwardedRef
    ]);
    return objRef;
}


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
 */ 
function $29293a6f5c75b37e$export$496315a1608d9602(effect, dependencies) {
    const isInitialMount = (0, $1Yh1N$react.useRef)(true);
    (0, $1Yh1N$react.useEffect)(()=>{
        if (isInitialMount.current) isInitialMount.current = false;
        else effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}




function $37733e1652f47193$var$hasResizeObserver() {
    return typeof window.ResizeObserver !== "undefined";
}
function $37733e1652f47193$export$683480f191c0e3ea(options) {
    const { ref: ref , onResize: onResize  } = options;
    (0, $1Yh1N$react.useEffect)(()=>{
        let element = ref === null || ref === void 0 ? void 0 : ref.current;
        if (!element) return;
        if (!$37733e1652f47193$var$hasResizeObserver()) {
            window.addEventListener("resize", onResize, false);
            return ()=>{
                window.removeEventListener("resize", onResize, false);
            };
        } else {
            const resizeObserverInstance = new window.ResizeObserver((entries)=>{
                if (!entries.length) return;
                onResize();
            });
            resizeObserverInstance.observe(element);
            return ()=>{
                if (element) resizeObserverInstance.unobserve(element);
            };
        }
    }, [
        onResize,
        ref
    ]);
}


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
 */ 
function $6fc733991a9f977c$export$4debdb1a3f0fa79e(context, ref) {
    (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(()=>{
        if (context && context.ref && ref) {
            context.ref.current = ref.current;
            return ()=>{
                context.ref.current = null;
            };
        }
    }, [
        context,
        ref
    ]);
}


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
 */ function $d796e7157ac96470$export$cfa2225e87938781(node) {
    if ($d796e7157ac96470$export$2bb74740c4e19def(node)) node = node.parentElement;
    while(node && !$d796e7157ac96470$export$2bb74740c4e19def(node))node = node.parentElement;
    return node || document.scrollingElement || document.documentElement;
}
function $d796e7157ac96470$export$2bb74740c4e19def(node) {
    let style = window.getComputedStyle(node);
    return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}


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
 */ 
// @ts-ignore
let $8b24bab62f5c65ad$var$visualViewport = typeof window !== "undefined" && window.visualViewport;
function $8b24bab62f5c65ad$export$d699905dd57c73ca() {
    let [size, setSize] = (0, $1Yh1N$react.useState)(()=>$8b24bab62f5c65ad$var$getViewportSize());
    (0, $1Yh1N$react.useEffect)(()=>{
        // Use visualViewport api to track available height even on iOS virtual keyboard opening
        let onResize = ()=>{
            setSize((size)=>{
                let newSize = $8b24bab62f5c65ad$var$getViewportSize();
                if (newSize.width === size.width && newSize.height === size.height) return size;
                return newSize;
            });
        };
        if (!$8b24bab62f5c65ad$var$visualViewport) window.addEventListener("resize", onResize);
        else $8b24bab62f5c65ad$var$visualViewport.addEventListener("resize", onResize);
        return ()=>{
            if (!$8b24bab62f5c65ad$var$visualViewport) window.removeEventListener("resize", onResize);
            else $8b24bab62f5c65ad$var$visualViewport.removeEventListener("resize", onResize);
        };
    }, []);
    return size;
}
function $8b24bab62f5c65ad$var$getViewportSize() {
    return {
        width: ($8b24bab62f5c65ad$var$visualViewport === null || $8b24bab62f5c65ad$var$visualViewport === void 0 ? void 0 : $8b24bab62f5c65ad$var$visualViewport.width) || window.innerWidth,
        height: ($8b24bab62f5c65ad$var$visualViewport === null || $8b24bab62f5c65ad$var$visualViewport === void 0 ? void 0 : $8b24bab62f5c65ad$var$visualViewport.height) || window.innerHeight
    };
}


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
 */ 

let $34da4502ea8120db$var$descriptionId = 0;
const $34da4502ea8120db$var$descriptionNodes = new Map();
function $34da4502ea8120db$export$f8aeda7b10753fa1(description) {
    let [id, setId] = (0, $1Yh1N$react.useState)(undefined);
    (0, $78605a5d7424e31b$export$e5c5a5f917a5871c)(()=>{
        if (!description) return;
        let desc = $34da4502ea8120db$var$descriptionNodes.get(description);
        if (!desc) {
            let id = `react-aria-description-${$34da4502ea8120db$var$descriptionId++}`;
            setId(id);
            let node = document.createElement("div");
            node.id = id;
            node.style.display = "none";
            node.textContent = description;
            document.body.appendChild(node);
            desc = {
                refCount: 0,
                element: node
            };
            $34da4502ea8120db$var$descriptionNodes.set(description, desc);
        } else setId(desc.element.id);
        desc.refCount++;
        return ()=>{
            if (--desc.refCount === 0) {
                desc.element.remove();
                $34da4502ea8120db$var$descriptionNodes.delete(description);
            }
        };
    }, [
        description
    ]);
    return {
        "aria-describedby": description ? id : undefined
    };
}


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
 */ function $9e20cff0af27e8cc$var$testUserAgent(re) {
    var _window_navigator_userAgentData;
    if (typeof window === "undefined" || window.navigator == null) return false;
    return ((_window_navigator_userAgentData = window.navigator["userAgentData"]) === null || _window_navigator_userAgentData === void 0 ? void 0 : _window_navigator_userAgentData.brands.some((brand)=>re.test(brand.brand))) || re.test(window.navigator.userAgent);
}
function $9e20cff0af27e8cc$var$testPlatform(re) {
    var _window_navigator_userAgentData;
    return typeof window !== "undefined" && window.navigator != null ? re.test(((_window_navigator_userAgentData = window.navigator["userAgentData"]) === null || _window_navigator_userAgentData === void 0 ? void 0 : _window_navigator_userAgentData.platform) || window.navigator.platform) : false;
}
function $9e20cff0af27e8cc$export$9ac100e40613ea10() {
    return $9e20cff0af27e8cc$var$testPlatform(/^Mac/i);
}
function $9e20cff0af27e8cc$export$186c6964ca17d99() {
    return $9e20cff0af27e8cc$var$testPlatform(/^iPhone/i);
}
function $9e20cff0af27e8cc$export$7bef049ce92e4224() {
    return $9e20cff0af27e8cc$var$testPlatform(/^iPad/i) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    $9e20cff0af27e8cc$export$9ac100e40613ea10() && navigator.maxTouchPoints > 1;
}
function $9e20cff0af27e8cc$export$fedb369cb70207f1() {
    return $9e20cff0af27e8cc$export$186c6964ca17d99() || $9e20cff0af27e8cc$export$7bef049ce92e4224();
}
function $9e20cff0af27e8cc$export$e1865c3bedcd822b() {
    return $9e20cff0af27e8cc$export$9ac100e40613ea10() || $9e20cff0af27e8cc$export$fedb369cb70207f1();
}
function $9e20cff0af27e8cc$export$78551043582a6a98() {
    return $9e20cff0af27e8cc$var$testUserAgent(/AppleWebKit/i) && !$9e20cff0af27e8cc$export$6446a186d09e379e();
}
function $9e20cff0af27e8cc$export$6446a186d09e379e() {
    return $9e20cff0af27e8cc$var$testUserAgent(/Chrome/i);
}
function $9e20cff0af27e8cc$export$a11b0059900ceec8() {
    return $9e20cff0af27e8cc$var$testUserAgent(/Android/i);
}


/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $2a8c0bb1629926c8$export$90fc3a17d93f704c(ref, event, handler, options) {
    let handlerRef = (0, $1Yh1N$react.useRef)(handler);
    handlerRef.current = handler;
    let isDisabled = handler == null;
    (0, $1Yh1N$react.useEffect)(()=>{
        if (isDisabled) return;
        let element = ref.current;
        let handler = (e)=>handlerRef.current.call(this, e);
        element.addEventListener(event, handler, options);
        return ()=>{
            element.removeEventListener(event, handler, options);
        };
    }, [
        ref,
        event,
        options,
        isDisabled
    ]);
}



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
 */ 
function $449412113267a1fe$export$53a0910f038337bd(scrollView, element) {
    let offsetX = $449412113267a1fe$var$relativeOffset(scrollView, element, "left");
    let offsetY = $449412113267a1fe$var$relativeOffset(scrollView, element, "top");
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    let x = scrollView.scrollLeft;
    let y = scrollView.scrollTop;
    // Account for top/left border offsetting the scroll top/Left
    let { borderTopWidth: borderTopWidth , borderLeftWidth: borderLeftWidth  } = getComputedStyle(scrollView);
    let borderAdjustedX = scrollView.scrollLeft + parseInt(borderLeftWidth, 10);
    let borderAdjustedY = scrollView.scrollTop + parseInt(borderTopWidth, 10);
    // Ignore end/bottom border via clientHeight/Width instead of offsetHeight/Width
    let maxX = borderAdjustedX + scrollView.clientWidth;
    let maxY = borderAdjustedY + scrollView.clientHeight;
    if (offsetX <= x) x = offsetX - parseInt(borderLeftWidth, 10);
    else if (offsetX + width > maxX) x += offsetX + width - maxX;
    if (offsetY <= borderAdjustedY) y = offsetY - parseInt(borderTopWidth, 10);
    else if (offsetY + height > maxY) y += offsetY + height - maxY;
    scrollView.scrollLeft = x;
    scrollView.scrollTop = y;
}
/**
 * Computes the offset left or top from child to ancestor by accumulating
 * offsetLeft or offsetTop through intervening offsetParents.
 */ function $449412113267a1fe$var$relativeOffset(ancestor, child, axis) {
    const prop = axis === "left" ? "offsetLeft" : "offsetTop";
    let sum = 0;
    while(child.offsetParent){
        sum += child[prop];
        if (child.offsetParent === ancestor) break;
        else if (child.offsetParent.contains(ancestor)) {
            // If the ancestor is not `position:relative`, then we stop at
            // _its_ offset parent, and we subtract off _its_ offset, so that
            // we end up with the proper offset from child to ancestor.
            sum -= ancestor[prop];
            break;
        }
        child = child.offsetParent;
    }
    return sum;
}
function $449412113267a1fe$export$c826860796309d1b(targetElement, opts) {
    if (document.contains(targetElement)) {
        let root = document.scrollingElement || document.documentElement;
        let isScrollPrevented = window.getComputedStyle(root).overflow === "hidden";
        // If scrolling is not currently prevented then we aren’t in a overlay nor is a overlay open, just use element.scrollIntoView to bring the element into view
        if (!isScrollPrevented) {
            var // use scrollIntoView({block: 'nearest'}) instead of .focus to check if the element is fully in view or not since .focus()
            // won't cause a scroll if the element is already focused and doesn't behave consistently when an element is partially out of view horizontally vs vertically
            _targetElement_scrollIntoView;
            let { left: originalLeft , top: originalTop  } = targetElement.getBoundingClientRect();
            targetElement === null || targetElement === void 0 ? void 0 : (_targetElement_scrollIntoView = targetElement.scrollIntoView) === null || _targetElement_scrollIntoView === void 0 ? void 0 : _targetElement_scrollIntoView.call(targetElement, {
                block: "nearest"
            });
            let { left: newLeft , top: newTop  } = targetElement.getBoundingClientRect();
            // Account for sub pixel differences from rounding
            if (Math.abs(originalLeft - newLeft) > 1 || Math.abs(originalTop - newTop) > 1) {
                var _opts_containingElement, _opts_containingElement_scrollIntoView, _targetElement_scrollIntoView1;
                opts === null || opts === void 0 ? void 0 : (_opts_containingElement = opts.containingElement) === null || _opts_containingElement === void 0 ? void 0 : (_opts_containingElement_scrollIntoView = _opts_containingElement.scrollIntoView) === null || _opts_containingElement_scrollIntoView === void 0 ? void 0 : _opts_containingElement_scrollIntoView.call(_opts_containingElement, {
                    block: "center",
                    inline: "center"
                });
                (_targetElement_scrollIntoView1 = targetElement.scrollIntoView) === null || _targetElement_scrollIntoView1 === void 0 ? void 0 : _targetElement_scrollIntoView1.call(targetElement, {
                    block: "nearest"
                });
            }
        } else {
            let scrollParent = (0, $d796e7157ac96470$export$cfa2225e87938781)(targetElement);
            // If scrolling is prevented, we don't want to scroll the body since it might move the overlay partially offscreen and the user can't scroll it back into view.
            while(targetElement && scrollParent && targetElement !== root && scrollParent !== root){
                $449412113267a1fe$export$53a0910f038337bd(scrollParent, targetElement);
                targetElement = scrollParent;
                scrollParent = (0, $d796e7157ac96470$export$cfa2225e87938781)(targetElement);
            }
        }
    }
}



/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $577e795361f19be9$export$60278871457622de(event) {
    // JAWS/NVDA with Firefox.
    if (event.mozInputSource === 0 && event.isTrusted) return true;
    // Android TalkBack's detail value varies depending on the event listener providing the event so we have specific logic here instead
    // If pointerType is defined, event is from a click listener. For events from mousedown listener, detail === 0 is a sufficient check
    // to detect TalkBack virtual clicks.
    if ((0, $9e20cff0af27e8cc$export$a11b0059900ceec8)() && event.pointerType) return event.type === "click" && event.buttons === 1;
    return event.detail === 0 && !event.pointerType;
}
function $577e795361f19be9$export$29bf1b5f2c56cf63(event) {
    // If the pointer size is zero, then we assume it's from a screen reader.
    // Android TalkBack double tap will sometimes return a event with width and height of 1
    // and pointerType === 'mouse' so we need to check for a specific combination of event attributes.
    // Cannot use "event.pressure === 0" as the sole check due to Safari pointer events always returning pressure === 0
    // instead of .5, see https://bugs.webkit.org/show_bug.cgi?id=206216. event.pointerType === 'mouse' is to distingush
    // Talkback double tap from Windows Firefox touch screen press
    return event.width === 0 && event.height === 0 || event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "mouse";
}




//# sourceMappingURL=main.js.map
