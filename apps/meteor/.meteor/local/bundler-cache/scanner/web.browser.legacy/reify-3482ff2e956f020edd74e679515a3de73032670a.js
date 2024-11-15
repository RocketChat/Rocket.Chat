var $goTMa$reactariautils = require("@react-aria/utils");
var $goTMa$react = require("react");
var $goTMa$reactariassr = require("@react-aria/ssr");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "Pressable", () => $e1dbec26039c051d$export$27c701ed9e449e99);
$parcel$export(module.exports, "PressResponder", () => $3596bae48579386f$export$3351871ee4b288b8);
$parcel$export(module.exports, "useFocus", () => $5cb73d0ce355b0dc$export$f8168d8dd8fd66e6);
$parcel$export(module.exports, "isFocusVisible", () => $e77252a287ef94ab$export$b9b3dfddab17db27);
$parcel$export(module.exports, "getInteractionModality", () => $e77252a287ef94ab$export$630ff653c5ada6a9);
$parcel$export(module.exports, "setInteractionModality", () => $e77252a287ef94ab$export$8397ddfc504fdb9a);
$parcel$export(module.exports, "useInteractionModality", () => $e77252a287ef94ab$export$98e20ec92f614cfe);
$parcel$export(module.exports, "useFocusVisible", () => $e77252a287ef94ab$export$ffd9e5021c1fb2d6);
$parcel$export(module.exports, "useFocusVisibleListener", () => $e77252a287ef94ab$export$ec71b4b83ac08ec3);
$parcel$export(module.exports, "useFocusWithin", () => $d16842bbd0359d1b$export$420e68273165f4ec);
$parcel$export(module.exports, "useHover", () => $ffbc150311c75f01$export$ae780daf29e6d456);
$parcel$export(module.exports, "useInteractOutside", () => $edcfa848c42f94f4$export$872b660ac5a1ff98);
$parcel$export(module.exports, "useKeyboard", () => $892d64db2a3c53b0$export$8f71654801c2f7cd);
$parcel$export(module.exports, "useMove", () => $c09386fc48fa427d$export$36da96379f79f245);
$parcel$export(module.exports, "usePress", () => $0294ea432cd92340$export$45712eceda6fad21);
$parcel$export(module.exports, "useScrollWheel", () => $a3dbce0aed7087e2$export$2123ff2b87c81ca);
$parcel$export(module.exports, "useLongPress", () => $3cd7b5d0eebf0ca9$export$c24ed0104d07eab9);
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions
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
// Note that state only matters here for iOS. Non-iOS gets user-select: none applied to the target element
// rather than at the document level so we just need to apply/remove user-select: none for each pressed element individually
let $f7e14e656343df57$var$state = "default";
let $f7e14e656343df57$var$savedUserSelect = "";
let $f7e14e656343df57$var$modifiedElementMap = new WeakMap();
function $f7e14e656343df57$export$16a4697467175487(target) {
    if ((0, $goTMa$reactariautils.isIOS)()) {
        if ($f7e14e656343df57$var$state === "default") {
            $f7e14e656343df57$var$savedUserSelect = document.documentElement.style.webkitUserSelect;
            document.documentElement.style.webkitUserSelect = "none";
        }
        $f7e14e656343df57$var$state = "disabled";
    } else if (target instanceof HTMLElement || target instanceof SVGElement) {
        // If not iOS, store the target's original user-select and change to user-select: none
        // Ignore state since it doesn't apply for non iOS
        $f7e14e656343df57$var$modifiedElementMap.set(target, target.style.userSelect);
        target.style.userSelect = "none";
    }
}
function $f7e14e656343df57$export$b0d6fa1ab32e3295(target) {
    if ((0, $goTMa$reactariautils.isIOS)()) {
        // If the state is already default, there's nothing to do.
        // If it is restoring, then there's no need to queue a second restore.
        if ($f7e14e656343df57$var$state !== "disabled") return;
        $f7e14e656343df57$var$state = "restoring";
        // There appears to be a delay on iOS where selection still might occur
        // after pointer up, so wait a bit before removing user-select.
        setTimeout(()=>{
            // Wait for any CSS transitions to complete so we don't recompute style
            // for the whole page in the middle of the animation and cause jank.
            (0, $goTMa$reactariautils.runAfterTransition)(()=>{
                // Avoid race conditions
                if ($f7e14e656343df57$var$state === "restoring") {
                    if (document.documentElement.style.webkitUserSelect === "none") document.documentElement.style.webkitUserSelect = $f7e14e656343df57$var$savedUserSelect || "";
                    $f7e14e656343df57$var$savedUserSelect = "";
                    $f7e14e656343df57$var$state = "default";
                }
            });
        }, 300);
    } else if (target instanceof HTMLElement || target instanceof SVGElement) // If not iOS, restore the target's original user-select if any
    // Ignore state since it doesn't apply for non iOS
    {
        if (target && $f7e14e656343df57$var$modifiedElementMap.has(target)) {
            let targetOldUserSelect = $f7e14e656343df57$var$modifiedElementMap.get(target);
            if (target.style.userSelect === "none") target.style.userSelect = targetOldUserSelect;
            if (target.getAttribute("style") === "") target.removeAttribute("style");
            $f7e14e656343df57$var$modifiedElementMap.delete(target);
        }
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
 */ 
const $01d3f539e91688c8$export$5165eccb35aaadb5 = (0, ($parcel$interopDefault($goTMa$react))).createContext(null);
$01d3f539e91688c8$export$5165eccb35aaadb5.displayName = "PressResponderContext";



function $0294ea432cd92340$var$usePressResponderContext(props) {
    // Consume context from <PressResponder> and merge with props.
    let context = (0, $goTMa$react.useContext)((0, $01d3f539e91688c8$export$5165eccb35aaadb5));
    if (context) {
        let { register: register , ...contextProps } = context;
        props = (0, $goTMa$reactariautils.mergeProps)(contextProps, props);
        register();
    }
    (0, $goTMa$reactariautils.useSyncRef)(context, props.ref);
    return props;
}
function $0294ea432cd92340$export$45712eceda6fad21(props) {
    let { onPress: onPress , onPressChange: onPressChange , onPressStart: onPressStart , onPressEnd: onPressEnd , onPressUp: onPressUp , isDisabled: isDisabled , isPressed: isPressedProp , preventFocusOnPress: preventFocusOnPress , shouldCancelOnPointerExit: shouldCancelOnPointerExit , allowTextSelectionOnPress: allowTextSelectionOnPress , // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref: _ , ...domProps } = $0294ea432cd92340$var$usePressResponderContext(props);
    let propsRef = (0, $goTMa$react.useRef)(null);
    propsRef.current = {
        onPress: onPress,
        onPressChange: onPressChange,
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressUp: onPressUp,
        isDisabled: isDisabled,
        shouldCancelOnPointerExit: shouldCancelOnPointerExit
    };
    let [isPressed, setPressed] = (0, $goTMa$react.useState)(false);
    let ref = (0, $goTMa$react.useRef)({
        isPressed: false,
        ignoreEmulatedMouseEvents: false,
        ignoreClickAfterPress: false,
        didFirePressStart: false,
        activePointerId: null,
        target: null,
        isOverTarget: false,
        pointerType: null
    });
    let { addGlobalListener: addGlobalListener , removeAllGlobalListeners: removeAllGlobalListeners  } = (0, $goTMa$reactariautils.useGlobalListeners)();
    let pressProps = (0, $goTMa$react.useMemo)(()=>{
        let state = ref.current;
        let triggerPressStart = (originalEvent, pointerType)=>{
            let { onPressStart: onPressStart , onPressChange: onPressChange , isDisabled: isDisabled  } = propsRef.current;
            if (isDisabled || state.didFirePressStart) return;
            if (onPressStart) onPressStart({
                type: "pressstart",
                pointerType: pointerType,
                target: originalEvent.currentTarget,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
            if (onPressChange) onPressChange(true);
            state.didFirePressStart = true;
            setPressed(true);
        };
        let triggerPressEnd = (originalEvent, pointerType, wasPressed = true)=>{
            let { onPressEnd: onPressEnd , onPressChange: onPressChange , onPress: onPress , isDisabled: isDisabled  } = propsRef.current;
            if (!state.didFirePressStart) return;
            state.ignoreClickAfterPress = true;
            state.didFirePressStart = false;
            if (onPressEnd) onPressEnd({
                type: "pressend",
                pointerType: pointerType,
                target: originalEvent.currentTarget,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
            if (onPressChange) onPressChange(false);
            setPressed(false);
            if (onPress && wasPressed && !isDisabled) onPress({
                type: "press",
                pointerType: pointerType,
                target: originalEvent.currentTarget,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        };
        let triggerPressUp = (originalEvent, pointerType)=>{
            let { onPressUp: onPressUp , isDisabled: isDisabled  } = propsRef.current;
            if (isDisabled) return;
            if (onPressUp) onPressUp({
                type: "pressup",
                pointerType: pointerType,
                target: originalEvent.currentTarget,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        };
        let cancel = (e)=>{
            if (state.isPressed) {
                if (state.isOverTarget) triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType, false);
                state.isPressed = false;
                state.isOverTarget = false;
                state.activePointerId = null;
                state.pointerType = null;
                removeAllGlobalListeners();
                if (!allowTextSelectionOnPress) (0, $f7e14e656343df57$export$b0d6fa1ab32e3295)(state.target);
            }
        };
        let pressProps = {
            onKeyDown (e) {
                if ($0294ea432cd92340$var$isValidKeyboardEvent(e.nativeEvent, e.currentTarget) && e.currentTarget.contains(e.target)) {
                    if ($0294ea432cd92340$var$shouldPreventDefaultKeyboard(e.target, e.key)) e.preventDefault();
                    e.stopPropagation();
                    // If the event is repeating, it may have started on a different element
                    // after which focus moved to the current element. Ignore these events and
                    // only handle the first key down event.
                    if (!state.isPressed && !e.repeat) {
                        state.target = e.currentTarget;
                        state.isPressed = true;
                        triggerPressStart(e, "keyboard");
                        // Focus may move before the key up event, so register the event on the document
                        // instead of the same element where the key down event occurred.
                        addGlobalListener(document, "keyup", onKeyUp, false);
                    }
                } else if (e.key === "Enter" && $0294ea432cd92340$var$isHTMLAnchorLink(e.currentTarget)) // If the target is a link, we won't have handled this above because we want the default
                // browser behavior to open the link when pressing Enter. But we still need to prevent
                // default so that elements above do not also handle it (e.g. table row).
                e.stopPropagation();
            },
            onKeyUp (e) {
                if ($0294ea432cd92340$var$isValidKeyboardEvent(e.nativeEvent, e.currentTarget) && !e.repeat && e.currentTarget.contains(e.target)) triggerPressUp($0294ea432cd92340$var$createEvent(state.target, e), "keyboard");
            },
            onClick (e) {
                if (e && !e.currentTarget.contains(e.target)) return;
                if (e && e.button === 0) {
                    e.stopPropagation();
                    if (isDisabled) e.preventDefault();
                    // If triggered from a screen reader or by using element.click(),
                    // trigger as if it were a keyboard click.
                    if (!state.ignoreClickAfterPress && !state.ignoreEmulatedMouseEvents && (state.pointerType === "virtual" || (0, $goTMa$reactariautils.isVirtualClick)(e.nativeEvent))) {
                        // Ensure the element receives focus (VoiceOver on iOS does not do this)
                        if (!isDisabled && !preventFocusOnPress) (0, $goTMa$reactariautils.focusWithoutScrolling)(e.currentTarget);
                        triggerPressStart(e, "virtual");
                        triggerPressUp(e, "virtual");
                        triggerPressEnd(e, "virtual");
                    }
                    state.ignoreEmulatedMouseEvents = false;
                    state.ignoreClickAfterPress = false;
                }
            }
        };
        let onKeyUp = (e)=>{
            if (state.isPressed && $0294ea432cd92340$var$isValidKeyboardEvent(e, state.target)) {
                if ($0294ea432cd92340$var$shouldPreventDefaultKeyboard(e.target, e.key)) e.preventDefault();
                e.stopPropagation();
                state.isPressed = false;
                let target = e.target;
                triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), "keyboard", state.target.contains(target));
                removeAllGlobalListeners();
                // If the target is a link, trigger the click method to open the URL,
                // but defer triggering pressEnd until onClick event handler.
                if (state.target instanceof HTMLElement && state.target.contains(target) && ($0294ea432cd92340$var$isHTMLAnchorLink(state.target) || state.target.getAttribute("role") === "link")) state.target.click();
            }
        };
        if (typeof PointerEvent !== "undefined") {
            pressProps.onPointerDown = (e)=>{
                // Only handle left clicks, and ignore events that bubbled through portals.
                if (e.button !== 0 || !e.currentTarget.contains(e.target)) return;
                // iOS safari fires pointer events from VoiceOver with incorrect coordinates/target.
                // Ignore and let the onClick handler take care of it instead.
                // https://bugs.webkit.org/show_bug.cgi?id=222627
                // https://bugs.webkit.org/show_bug.cgi?id=223202
                if ((0, $goTMa$reactariautils.isVirtualPointerEvent)(e.nativeEvent)) {
                    state.pointerType = "virtual";
                    return;
                }
                // Due to browser inconsistencies, especially on mobile browsers, we prevent
                // default on pointer down and handle focusing the pressable element ourselves.
                if ($0294ea432cd92340$var$shouldPreventDefault(e.currentTarget)) e.preventDefault();
                state.pointerType = e.pointerType;
                e.stopPropagation();
                if (!state.isPressed) {
                    state.isPressed = true;
                    state.isOverTarget = true;
                    state.activePointerId = e.pointerId;
                    state.target = e.currentTarget;
                    if (!isDisabled && !preventFocusOnPress) (0, $goTMa$reactariautils.focusWithoutScrolling)(e.currentTarget);
                    if (!allowTextSelectionOnPress) (0, $f7e14e656343df57$export$16a4697467175487)(state.target);
                    triggerPressStart(e, state.pointerType);
                    addGlobalListener(document, "pointermove", onPointerMove, false);
                    addGlobalListener(document, "pointerup", onPointerUp, false);
                    addGlobalListener(document, "pointercancel", onPointerCancel, false);
                }
            };
            pressProps.onMouseDown = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                if (e.button === 0) {
                    // Chrome and Firefox on touch Windows devices require mouse down events
                    // to be canceled in addition to pointer events, or an extra asynchronous
                    // focus event will be fired.
                    if ($0294ea432cd92340$var$shouldPreventDefault(e.currentTarget)) e.preventDefault();
                    e.stopPropagation();
                }
            };
            pressProps.onPointerUp = (e)=>{
                // iOS fires pointerup with zero width and height, so check the pointerType recorded during pointerdown.
                if (!e.currentTarget.contains(e.target) || state.pointerType === "virtual") return;
                // Only handle left clicks
                // Safari on iOS sometimes fires pointerup events, even
                // when the touch isn't over the target, so double check.
                if (e.button === 0 && $0294ea432cd92340$var$isOverTarget(e, e.currentTarget)) triggerPressUp(e, state.pointerType || e.pointerType);
            };
            // Safari on iOS < 13.2 does not implement pointerenter/pointerleave events correctly.
            // Use pointer move events instead to implement our own hit testing.
            // See https://bugs.webkit.org/show_bug.cgi?id=199803
            let onPointerMove = (e)=>{
                if (e.pointerId !== state.activePointerId) return;
                if ($0294ea432cd92340$var$isOverTarget(e, state.target)) {
                    if (!state.isOverTarget) {
                        state.isOverTarget = true;
                        triggerPressStart($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType);
                    }
                } else if (state.isOverTarget) {
                    state.isOverTarget = false;
                    triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType, false);
                    if (propsRef.current.shouldCancelOnPointerExit) cancel(e);
                }
            };
            let onPointerUp = (e)=>{
                if (e.pointerId === state.activePointerId && state.isPressed && e.button === 0) {
                    if ($0294ea432cd92340$var$isOverTarget(e, state.target)) triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType);
                    else if (state.isOverTarget) triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType, false);
                    state.isPressed = false;
                    state.isOverTarget = false;
                    state.activePointerId = null;
                    state.pointerType = null;
                    removeAllGlobalListeners();
                    if (!allowTextSelectionOnPress) (0, $f7e14e656343df57$export$b0d6fa1ab32e3295)(state.target);
                }
            };
            let onPointerCancel = (e)=>{
                cancel(e);
            };
            pressProps.onDragStart = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                // Safari does not call onPointerCancel when a drag starts, whereas Chrome and Firefox do.
                cancel(e);
            };
        } else {
            pressProps.onMouseDown = (e)=>{
                // Only handle left clicks
                if (e.button !== 0 || !e.currentTarget.contains(e.target)) return;
                // Due to browser inconsistencies, especially on mobile browsers, we prevent
                // default on mouse down and handle focusing the pressable element ourselves.
                if ($0294ea432cd92340$var$shouldPreventDefault(e.currentTarget)) e.preventDefault();
                e.stopPropagation();
                if (state.ignoreEmulatedMouseEvents) return;
                state.isPressed = true;
                state.isOverTarget = true;
                state.target = e.currentTarget;
                state.pointerType = (0, $goTMa$reactariautils.isVirtualClick)(e.nativeEvent) ? "virtual" : "mouse";
                if (!isDisabled && !preventFocusOnPress) (0, $goTMa$reactariautils.focusWithoutScrolling)(e.currentTarget);
                triggerPressStart(e, state.pointerType);
                addGlobalListener(document, "mouseup", onMouseUp, false);
            };
            pressProps.onMouseEnter = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
                    state.isOverTarget = true;
                    triggerPressStart(e, state.pointerType);
                }
            };
            pressProps.onMouseLeave = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
                    state.isOverTarget = false;
                    triggerPressEnd(e, state.pointerType, false);
                    if (propsRef.current.shouldCancelOnPointerExit) cancel(e);
                }
            };
            pressProps.onMouseUp = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                if (!state.ignoreEmulatedMouseEvents && e.button === 0) triggerPressUp(e, state.pointerType);
            };
            let onMouseUp = (e)=>{
                // Only handle left clicks
                if (e.button !== 0) return;
                state.isPressed = false;
                removeAllGlobalListeners();
                if (state.ignoreEmulatedMouseEvents) {
                    state.ignoreEmulatedMouseEvents = false;
                    return;
                }
                if ($0294ea432cd92340$var$isOverTarget(e, state.target)) triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType);
                else if (state.isOverTarget) triggerPressEnd($0294ea432cd92340$var$createEvent(state.target, e), state.pointerType, false);
                state.isOverTarget = false;
            };
            pressProps.onTouchStart = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                let touch = $0294ea432cd92340$var$getTouchFromEvent(e.nativeEvent);
                if (!touch) return;
                state.activePointerId = touch.identifier;
                state.ignoreEmulatedMouseEvents = true;
                state.isOverTarget = true;
                state.isPressed = true;
                state.target = e.currentTarget;
                state.pointerType = "touch";
                // Due to browser inconsistencies, especially on mobile browsers, we prevent default
                // on the emulated mouse event and handle focusing the pressable element ourselves.
                if (!isDisabled && !preventFocusOnPress) (0, $goTMa$reactariautils.focusWithoutScrolling)(e.currentTarget);
                if (!allowTextSelectionOnPress) (0, $f7e14e656343df57$export$16a4697467175487)(state.target);
                triggerPressStart(e, state.pointerType);
                addGlobalListener(window, "scroll", onScroll, true);
            };
            pressProps.onTouchMove = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                if (!state.isPressed) return;
                let touch = $0294ea432cd92340$var$getTouchById(e.nativeEvent, state.activePointerId);
                if (touch && $0294ea432cd92340$var$isOverTarget(touch, e.currentTarget)) {
                    if (!state.isOverTarget) {
                        state.isOverTarget = true;
                        triggerPressStart(e, state.pointerType);
                    }
                } else if (state.isOverTarget) {
                    state.isOverTarget = false;
                    triggerPressEnd(e, state.pointerType, false);
                    if (propsRef.current.shouldCancelOnPointerExit) cancel(e);
                }
            };
            pressProps.onTouchEnd = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                if (!state.isPressed) return;
                let touch = $0294ea432cd92340$var$getTouchById(e.nativeEvent, state.activePointerId);
                if (touch && $0294ea432cd92340$var$isOverTarget(touch, e.currentTarget)) {
                    triggerPressUp(e, state.pointerType);
                    triggerPressEnd(e, state.pointerType);
                } else if (state.isOverTarget) triggerPressEnd(e, state.pointerType, false);
                state.isPressed = false;
                state.activePointerId = null;
                state.isOverTarget = false;
                state.ignoreEmulatedMouseEvents = true;
                if (!allowTextSelectionOnPress) (0, $f7e14e656343df57$export$b0d6fa1ab32e3295)(state.target);
                removeAllGlobalListeners();
            };
            pressProps.onTouchCancel = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                e.stopPropagation();
                if (state.isPressed) cancel(e);
            };
            let onScroll = (e)=>{
                if (state.isPressed && e.target.contains(state.target)) cancel({
                    currentTarget: state.target,
                    shiftKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    altKey: false
                });
            };
            pressProps.onDragStart = (e)=>{
                if (!e.currentTarget.contains(e.target)) return;
                cancel(e);
            };
        }
        return pressProps;
    }, [
        addGlobalListener,
        isDisabled,
        preventFocusOnPress,
        removeAllGlobalListeners,
        allowTextSelectionOnPress
    ]);
    // Remove user-select: none in case component unmounts immediately after pressStart
    // eslint-disable-next-line arrow-body-style
    (0, $goTMa$react.useEffect)(()=>{
        return ()=>{
            if (!allowTextSelectionOnPress) // eslint-disable-next-line react-hooks/exhaustive-deps
            (0, $f7e14e656343df57$export$b0d6fa1ab32e3295)(ref.current.target);
        };
    }, [
        allowTextSelectionOnPress
    ]);
    return {
        isPressed: isPressedProp || isPressed,
        pressProps: (0, $goTMa$reactariautils.mergeProps)(domProps, pressProps)
    };
}
function $0294ea432cd92340$var$isHTMLAnchorLink(target) {
    return target.tagName === "A" && target.hasAttribute("href");
}
function $0294ea432cd92340$var$isValidKeyboardEvent(event, currentTarget) {
    const { key: key , code: code  } = event;
    const element = currentTarget;
    const role = element.getAttribute("role");
    // Accessibility for keyboards. Space and Enter only.
    // "Spacebar" is for IE 11
    return (key === "Enter" || key === " " || key === "Spacebar" || code === "Space") && !(element instanceof HTMLInputElement && !$0294ea432cd92340$var$isValidInputKey(element, key) || element instanceof HTMLTextAreaElement || element.isContentEditable) && // A link with a valid href should be handled natively,
    // unless it also has role='button' and was triggered using Space.
    (!$0294ea432cd92340$var$isHTMLAnchorLink(element) || role === "button" && key !== "Enter") && // An element with role='link' should only trigger with Enter key
    !(role === "link" && key !== "Enter");
}
function $0294ea432cd92340$var$getTouchFromEvent(event) {
    const { targetTouches: targetTouches  } = event;
    if (targetTouches.length > 0) return targetTouches[0];
    return null;
}
function $0294ea432cd92340$var$getTouchById(event, pointerId) {
    const changedTouches = event.changedTouches;
    for(let i = 0; i < changedTouches.length; i++){
        const touch = changedTouches[i];
        if (touch.identifier === pointerId) return touch;
    }
    return null;
}
function $0294ea432cd92340$var$createEvent(target, e) {
    return {
        currentTarget: target,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey
    };
}
function $0294ea432cd92340$var$getPointClientRect(point) {
    let offsetX = point.width / 2 || point.radiusX || 0;
    let offsetY = point.height / 2 || point.radiusY || 0;
    return {
        top: point.clientY - offsetY,
        right: point.clientX + offsetX,
        bottom: point.clientY + offsetY,
        left: point.clientX - offsetX
    };
}
function $0294ea432cd92340$var$areRectanglesOverlapping(a, b) {
    // check if they cannot overlap on x axis
    if (a.left > b.right || b.left > a.right) return false;
    // check if they cannot overlap on y axis
    if (a.top > b.bottom || b.top > a.bottom) return false;
    return true;
}
function $0294ea432cd92340$var$isOverTarget(point, target) {
    let rect = target.getBoundingClientRect();
    let pointRect = $0294ea432cd92340$var$getPointClientRect(point);
    return $0294ea432cd92340$var$areRectanglesOverlapping(rect, pointRect);
}
function $0294ea432cd92340$var$shouldPreventDefault(target) {
    // We cannot prevent default if the target is a draggable element.
    return !(target instanceof HTMLElement) || !target.draggable;
}
function $0294ea432cd92340$var$shouldPreventDefaultKeyboard(target, key) {
    if (target instanceof HTMLInputElement) return !$0294ea432cd92340$var$isValidInputKey(target, key);
    if (target instanceof HTMLButtonElement) return target.type !== "submit";
    return true;
}
const $0294ea432cd92340$var$nonTextInputTypes = new Set([
    "checkbox",
    "radio",
    "range",
    "color",
    "file",
    "image",
    "button",
    "submit",
    "reset"
]);
function $0294ea432cd92340$var$isValidInputKey(target, key) {
    // Only space should toggle checkboxes and radios, not enter.
    return target.type === "checkbox" || target.type === "radio" ? key === " " : $0294ea432cd92340$var$nonTextInputTypes.has(target.type);
}



const $e1dbec26039c051d$export$27c701ed9e449e99 = /*#__PURE__*/ (0, ($parcel$interopDefault($goTMa$react))).forwardRef(({ children: children , ...props }, ref)=>{
    let newRef = (0, $goTMa$react.useRef)();
    ref = ref !== null && ref !== void 0 ? ref : newRef;
    let { pressProps: pressProps  } = (0, $0294ea432cd92340$export$45712eceda6fad21)({
        ...props,
        ref: ref
    });
    let child = (0, ($parcel$interopDefault($goTMa$react))).Children.only(children);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($goTMa$react))).cloneElement(child, // @ts-ignore
    {
        ref: ref,
        ...(0, $goTMa$reactariautils.mergeProps)(child.props, pressProps)
    });
});


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


const $3596bae48579386f$export$3351871ee4b288b8 = /*#__PURE__*/ (0, ($parcel$interopDefault($goTMa$react))).forwardRef(({ children: children , ...props }, ref)=>{
    let isRegistered = (0, $goTMa$react.useRef)(false);
    let prevContext = (0, $goTMa$react.useContext)((0, $01d3f539e91688c8$export$5165eccb35aaadb5));
    let context = (0, $goTMa$reactariautils.mergeProps)(prevContext || {}, {
        ...props,
        ref: ref || (prevContext === null || prevContext === void 0 ? void 0 : prevContext.ref),
        register () {
            isRegistered.current = true;
            if (prevContext) prevContext.register();
        }
    });
    (0, $goTMa$reactariautils.useSyncRef)(prevContext, ref);
    (0, $goTMa$react.useEffect)(()=>{
        if (!isRegistered.current) console.warn("A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.");
    }, []);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($goTMa$react))).createElement((0, $01d3f539e91688c8$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
});


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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions

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

class $625cf83917e112ad$export$905e7fc544a71f36 {
    isDefaultPrevented() {
        return this.nativeEvent.defaultPrevented;
    }
    preventDefault() {
        this.defaultPrevented = true;
        this.nativeEvent.preventDefault();
    }
    stopPropagation() {
        this.nativeEvent.stopPropagation();
        this.isPropagationStopped = ()=>true;
    }
    isPropagationStopped() {
        return false;
    }
    persist() {}
    constructor(type, nativeEvent){
        this.nativeEvent = nativeEvent;
        this.target = nativeEvent.target;
        this.currentTarget = nativeEvent.currentTarget;
        this.relatedTarget = nativeEvent.relatedTarget;
        this.bubbles = nativeEvent.bubbles;
        this.cancelable = nativeEvent.cancelable;
        this.defaultPrevented = nativeEvent.defaultPrevented;
        this.eventPhase = nativeEvent.eventPhase;
        this.isTrusted = nativeEvent.isTrusted;
        this.timeStamp = nativeEvent.timeStamp;
        this.type = type;
    }
}
function $625cf83917e112ad$export$715c682d09d639cc(onBlur) {
    let stateRef = (0, $goTMa$react.useRef)({
        isFocused: false,
        onBlur: onBlur,
        observer: null
    });
    stateRef.current.onBlur = onBlur;
    // Clean up MutationObserver on unmount. See below.
    // eslint-disable-next-line arrow-body-style
    (0, $goTMa$reactariautils.useLayoutEffect)(()=>{
        const state = stateRef.current;
        return ()=>{
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }
        };
    }, []);
    // This function is called during a React onFocus event.
    return (0, $goTMa$react.useCallback)((e)=>{
        // React does not fire onBlur when an element is disabled. https://github.com/facebook/react/issues/9142
        // Most browsers fire a native focusout event in this case, except for Firefox. In that case, we use a
        // MutationObserver to watch for the disabled attribute, and dispatch these events ourselves.
        // For browsers that do, focusout fires before the MutationObserver, so onBlur should not fire twice.
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
            stateRef.current.isFocused = true;
            let target = e.target;
            let onBlurHandler = (e)=>{
                var // For backward compatibility, dispatch a (fake) React synthetic event.
                _stateRef_current, _stateRef_current_onBlur;
                stateRef.current.isFocused = false;
                if (target.disabled) (_stateRef_current_onBlur = (_stateRef_current = stateRef.current).onBlur) === null || _stateRef_current_onBlur === void 0 ? void 0 : _stateRef_current_onBlur.call(_stateRef_current, new $625cf83917e112ad$export$905e7fc544a71f36("blur", e));
                // We no longer need the MutationObserver once the target is blurred.
                if (stateRef.current.observer) {
                    stateRef.current.observer.disconnect();
                    stateRef.current.observer = null;
                }
            };
            target.addEventListener("focusout", onBlurHandler, {
                once: true
            });
            stateRef.current.observer = new MutationObserver(()=>{
                if (stateRef.current.isFocused && target.disabled) {
                    stateRef.current.observer.disconnect();
                    target.dispatchEvent(new FocusEvent("blur"));
                    target.dispatchEvent(new FocusEvent("focusout", {
                        bubbles: true
                    }));
                }
            });
            stateRef.current.observer.observe(target, {
                attributes: true,
                attributeFilter: [
                    "disabled"
                ]
            });
        }
    }, []);
}


function $5cb73d0ce355b0dc$export$f8168d8dd8fd66e6(props) {
    let { isDisabled: isDisabled , onFocus: onFocusProp , onBlur: onBlurProp , onFocusChange: onFocusChange  } = props;
    const onBlur = (0, $goTMa$react.useCallback)((e)=>{
        if (e.target === e.currentTarget) {
            if (onBlurProp) onBlurProp(e);
            if (onFocusChange) onFocusChange(false);
            return true;
        }
    }, [
        onBlurProp,
        onFocusChange
    ]);
    const onSyntheticFocus = (0, $625cf83917e112ad$export$715c682d09d639cc)(onBlur);
    const onFocus = (0, $goTMa$react.useCallback)((e)=>{
        // Double check that document.activeElement actually matches e.target in case a previously chained
        // focus handler already moved focus somewhere else.
        if (e.target === e.currentTarget && document.activeElement === e.target) {
            if (onFocusProp) onFocusProp(e);
            if (onFocusChange) onFocusChange(true);
            onSyntheticFocus(e);
        }
    }, [
        onFocusChange,
        onFocusProp,
        onSyntheticFocus
    ]);
    return {
        focusProps: {
            onFocus: !isDisabled && (onFocusProp || onFocusChange || onBlurProp) ? onFocus : undefined,
            onBlur: !isDisabled && (onBlurProp || onFocusChange) ? onBlur : undefined
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions



let $e77252a287ef94ab$var$currentModality = null;
let $e77252a287ef94ab$var$changeHandlers = new Set();
let $e77252a287ef94ab$var$hasSetupGlobalListeners = false;
let $e77252a287ef94ab$var$hasEventBeforeFocus = false;
let $e77252a287ef94ab$var$hasBlurredWindowRecently = false;
// Only Tab or Esc keys will make focus visible on text input elements
const $e77252a287ef94ab$var$FOCUS_VISIBLE_INPUT_KEYS = {
    Tab: true,
    Escape: true
};
function $e77252a287ef94ab$var$triggerChangeHandlers(modality, e) {
    for (let handler of $e77252a287ef94ab$var$changeHandlers)handler(modality, e);
}
/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus styles visible.
 */ function $e77252a287ef94ab$var$isValidKey(e) {
    // Control and Shift keys trigger when navigating back to the tab with keyboard.
    return !(e.metaKey || !(0, $goTMa$reactariautils.isMac)() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function $e77252a287ef94ab$var$handleKeyboardEvent(e) {
    $e77252a287ef94ab$var$hasEventBeforeFocus = true;
    if ($e77252a287ef94ab$var$isValidKey(e)) {
        $e77252a287ef94ab$var$currentModality = "keyboard";
        $e77252a287ef94ab$var$triggerChangeHandlers("keyboard", e);
    }
}
function $e77252a287ef94ab$var$handlePointerEvent(e) {
    $e77252a287ef94ab$var$currentModality = "pointer";
    if (e.type === "mousedown" || e.type === "pointerdown") {
        $e77252a287ef94ab$var$hasEventBeforeFocus = true;
        $e77252a287ef94ab$var$triggerChangeHandlers("pointer", e);
    }
}
function $e77252a287ef94ab$var$handleClickEvent(e) {
    if ((0, $goTMa$reactariautils.isVirtualClick)(e)) {
        $e77252a287ef94ab$var$hasEventBeforeFocus = true;
        $e77252a287ef94ab$var$currentModality = "virtual";
    }
}
function $e77252a287ef94ab$var$handleFocusEvent(e) {
    // Firefox fires two extra focus events when the user first clicks into an iframe:
    // first on the window, then on the document. We ignore these events so they don't
    // cause keyboard focus rings to appear.
    if (e.target === window || e.target === document) return;
    // If a focus event occurs without a preceding keyboard or pointer event, switch to virtual modality.
    // This occurs, for example, when navigating a form with the next/previous buttons on iOS.
    if (!$e77252a287ef94ab$var$hasEventBeforeFocus && !$e77252a287ef94ab$var$hasBlurredWindowRecently) {
        $e77252a287ef94ab$var$currentModality = "virtual";
        $e77252a287ef94ab$var$triggerChangeHandlers("virtual", e);
    }
    $e77252a287ef94ab$var$hasEventBeforeFocus = false;
    $e77252a287ef94ab$var$hasBlurredWindowRecently = false;
}
function $e77252a287ef94ab$var$handleWindowBlur() {
    // When the window is blurred, reset state. This is necessary when tabbing out of the window,
    // for example, since a subsequent focus event won't be fired.
    $e77252a287ef94ab$var$hasEventBeforeFocus = false;
    $e77252a287ef94ab$var$hasBlurredWindowRecently = true;
}
/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */ function $e77252a287ef94ab$var$setupGlobalFocusEvents() {
    if (typeof window === "undefined" || $e77252a287ef94ab$var$hasSetupGlobalListeners) return;
    // Programmatic focus() calls shouldn't affect the current input modality.
    // However, we need to detect other cases when a focus event occurs without
    // a preceding user event (e.g. screen reader focus). Overriding the focus
    // method on HTMLElement.prototype is a bit hacky, but works.
    let focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function() {
        $e77252a287ef94ab$var$hasEventBeforeFocus = true;
        focus.apply(this, arguments);
    };
    document.addEventListener("keydown", $e77252a287ef94ab$var$handleKeyboardEvent, true);
    document.addEventListener("keyup", $e77252a287ef94ab$var$handleKeyboardEvent, true);
    document.addEventListener("click", $e77252a287ef94ab$var$handleClickEvent, true);
    // Register focus events on the window so they are sure to happen
    // before React's event listeners (registered on the document).
    window.addEventListener("focus", $e77252a287ef94ab$var$handleFocusEvent, true);
    window.addEventListener("blur", $e77252a287ef94ab$var$handleWindowBlur, false);
    if (typeof PointerEvent !== "undefined") {
        document.addEventListener("pointerdown", $e77252a287ef94ab$var$handlePointerEvent, true);
        document.addEventListener("pointermove", $e77252a287ef94ab$var$handlePointerEvent, true);
        document.addEventListener("pointerup", $e77252a287ef94ab$var$handlePointerEvent, true);
    } else {
        document.addEventListener("mousedown", $e77252a287ef94ab$var$handlePointerEvent, true);
        document.addEventListener("mousemove", $e77252a287ef94ab$var$handlePointerEvent, true);
        document.addEventListener("mouseup", $e77252a287ef94ab$var$handlePointerEvent, true);
    }
    $e77252a287ef94ab$var$hasSetupGlobalListeners = true;
}
if (typeof document !== "undefined") {
    if (document.readyState !== "loading") $e77252a287ef94ab$var$setupGlobalFocusEvents();
    else document.addEventListener("DOMContentLoaded", $e77252a287ef94ab$var$setupGlobalFocusEvents);
}
function $e77252a287ef94ab$export$b9b3dfddab17db27() {
    return $e77252a287ef94ab$var$currentModality !== "pointer";
}
function $e77252a287ef94ab$export$630ff653c5ada6a9() {
    return $e77252a287ef94ab$var$currentModality;
}
function $e77252a287ef94ab$export$8397ddfc504fdb9a(modality) {
    $e77252a287ef94ab$var$currentModality = modality;
    $e77252a287ef94ab$var$triggerChangeHandlers(modality, null);
}
function $e77252a287ef94ab$export$98e20ec92f614cfe() {
    $e77252a287ef94ab$var$setupGlobalFocusEvents();
    let [modality, setModality] = (0, $goTMa$react.useState)($e77252a287ef94ab$var$currentModality);
    (0, $goTMa$react.useEffect)(()=>{
        let handler = ()=>{
            setModality($e77252a287ef94ab$var$currentModality);
        };
        $e77252a287ef94ab$var$changeHandlers.add(handler);
        return ()=>{
            $e77252a287ef94ab$var$changeHandlers.delete(handler);
        };
    }, []);
    return (0, $goTMa$reactariassr.useIsSSR)() ? null : modality;
}
/**
 * If this is attached to text input component, return if the event is a focus event (Tab/Escape keys pressed) so that
 * focus visible style can be properly set.
 */ function $e77252a287ef94ab$var$isKeyboardFocusEvent(isTextInput, modality, e) {
    return !(isTextInput && modality === "keyboard" && e instanceof KeyboardEvent && !$e77252a287ef94ab$var$FOCUS_VISIBLE_INPUT_KEYS[e.key]);
}
function $e77252a287ef94ab$export$ffd9e5021c1fb2d6(props = {}) {
    let { isTextInput: isTextInput , autoFocus: autoFocus  } = props;
    let [isFocusVisibleState, setFocusVisible] = (0, $goTMa$react.useState)(autoFocus || $e77252a287ef94ab$export$b9b3dfddab17db27());
    $e77252a287ef94ab$export$ec71b4b83ac08ec3((isFocusVisible)=>{
        setFocusVisible(isFocusVisible);
    }, [
        isTextInput
    ], {
        isTextInput: isTextInput
    });
    return {
        isFocusVisible: isFocusVisibleState
    };
}
function $e77252a287ef94ab$export$ec71b4b83ac08ec3(fn, deps, opts) {
    $e77252a287ef94ab$var$setupGlobalFocusEvents();
    (0, $goTMa$react.useEffect)(()=>{
        let handler = (modality, e)=>{
            if (!$e77252a287ef94ab$var$isKeyboardFocusEvent(opts === null || opts === void 0 ? void 0 : opts.isTextInput, modality, e)) return;
            fn($e77252a287ef94ab$export$b9b3dfddab17db27());
        };
        $e77252a287ef94ab$var$changeHandlers.add(handler);
        return ()=>{
            $e77252a287ef94ab$var$changeHandlers.delete(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions


function $d16842bbd0359d1b$export$420e68273165f4ec(props) {
    let { isDisabled: isDisabled , onBlurWithin: onBlurWithin , onFocusWithin: onFocusWithin , onFocusWithinChange: onFocusWithinChange  } = props;
    let state = (0, $goTMa$react.useRef)({
        isFocusWithin: false
    });
    let onBlur = (0, $goTMa$react.useCallback)((e)=>{
        // We don't want to trigger onBlurWithin and then immediately onFocusWithin again
        // when moving focus inside the element. Only trigger if the currentTarget doesn't
        // include the relatedTarget (where focus is moving).
        if (state.current.isFocusWithin && !e.currentTarget.contains(e.relatedTarget)) {
            state.current.isFocusWithin = false;
            if (onBlurWithin) onBlurWithin(e);
            if (onFocusWithinChange) onFocusWithinChange(false);
        }
    }, [
        onBlurWithin,
        onFocusWithinChange,
        state
    ]);
    let onSyntheticFocus = (0, $625cf83917e112ad$export$715c682d09d639cc)(onBlur);
    let onFocus = (0, $goTMa$react.useCallback)((e)=>{
        // Double check that document.activeElement actually matches e.target in case a previously chained
        // focus handler already moved focus somewhere else.
        if (!state.current.isFocusWithin && document.activeElement === e.target) {
            if (onFocusWithin) onFocusWithin(e);
            if (onFocusWithinChange) onFocusWithinChange(true);
            state.current.isFocusWithin = true;
            onSyntheticFocus(e);
        }
    }, [
        onFocusWithin,
        onFocusWithinChange,
        onSyntheticFocus
    ]);
    if (isDisabled) return {
        focusWithinProps: {
            onFocus: null,
            onBlur: null
        }
    };
    return {
        focusWithinProps: {
            onFocus: onFocus,
            onBlur: onBlur
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions

// iOS fires onPointerEnter twice: once with pointerType="touch" and again with pointerType="mouse".
// We want to ignore these emulated events so they do not trigger hover behavior.
// See https://bugs.webkit.org/show_bug.cgi?id=214609.
let $ffbc150311c75f01$var$globalIgnoreEmulatedMouseEvents = false;
let $ffbc150311c75f01$var$hoverCount = 0;
function $ffbc150311c75f01$var$setGlobalIgnoreEmulatedMouseEvents() {
    $ffbc150311c75f01$var$globalIgnoreEmulatedMouseEvents = true;
    // Clear globalIgnoreEmulatedMouseEvents after a short timeout. iOS fires onPointerEnter
    // with pointerType="mouse" immediately after onPointerUp and before onFocus. On other
    // devices that don't have this quirk, we don't want to ignore a mouse hover sometime in
    // the distant future because a user previously touched the element.
    setTimeout(()=>{
        $ffbc150311c75f01$var$globalIgnoreEmulatedMouseEvents = false;
    }, 50);
}
function $ffbc150311c75f01$var$handleGlobalPointerEvent(e) {
    if (e.pointerType === "touch") $ffbc150311c75f01$var$setGlobalIgnoreEmulatedMouseEvents();
}
function $ffbc150311c75f01$var$setupGlobalTouchEvents() {
    if (typeof document === "undefined") return;
    if (typeof PointerEvent !== "undefined") document.addEventListener("pointerup", $ffbc150311c75f01$var$handleGlobalPointerEvent);
    else document.addEventListener("touchend", $ffbc150311c75f01$var$setGlobalIgnoreEmulatedMouseEvents);
    $ffbc150311c75f01$var$hoverCount++;
    return ()=>{
        $ffbc150311c75f01$var$hoverCount--;
        if ($ffbc150311c75f01$var$hoverCount > 0) return;
        if (typeof PointerEvent !== "undefined") document.removeEventListener("pointerup", $ffbc150311c75f01$var$handleGlobalPointerEvent);
        else document.removeEventListener("touchend", $ffbc150311c75f01$var$setGlobalIgnoreEmulatedMouseEvents);
    };
}
function $ffbc150311c75f01$export$ae780daf29e6d456(props) {
    let { onHoverStart: onHoverStart , onHoverChange: onHoverChange , onHoverEnd: onHoverEnd , isDisabled: isDisabled  } = props;
    let [isHovered, setHovered] = (0, $goTMa$react.useState)(false);
    let state = (0, $goTMa$react.useRef)({
        isHovered: false,
        ignoreEmulatedMouseEvents: false,
        pointerType: "",
        target: null
    }).current;
    (0, $goTMa$react.useEffect)($ffbc150311c75f01$var$setupGlobalTouchEvents, []);
    let { hoverProps: hoverProps , triggerHoverEnd: triggerHoverEnd  } = (0, $goTMa$react.useMemo)(()=>{
        let triggerHoverStart = (event, pointerType)=>{
            state.pointerType = pointerType;
            if (isDisabled || pointerType === "touch" || state.isHovered || !event.currentTarget.contains(event.target)) return;
            state.isHovered = true;
            let target = event.currentTarget;
            state.target = target;
            if (onHoverStart) onHoverStart({
                type: "hoverstart",
                target: target,
                pointerType: pointerType
            });
            if (onHoverChange) onHoverChange(true);
            setHovered(true);
        };
        let triggerHoverEnd = (event, pointerType)=>{
            state.pointerType = "";
            state.target = null;
            if (pointerType === "touch" || !state.isHovered) return;
            state.isHovered = false;
            let target = event.currentTarget;
            if (onHoverEnd) onHoverEnd({
                type: "hoverend",
                target: target,
                pointerType: pointerType
            });
            if (onHoverChange) onHoverChange(false);
            setHovered(false);
        };
        let hoverProps = {};
        if (typeof PointerEvent !== "undefined") {
            hoverProps.onPointerEnter = (e)=>{
                if ($ffbc150311c75f01$var$globalIgnoreEmulatedMouseEvents && e.pointerType === "mouse") return;
                triggerHoverStart(e, e.pointerType);
            };
            hoverProps.onPointerLeave = (e)=>{
                if (!isDisabled && e.currentTarget.contains(e.target)) triggerHoverEnd(e, e.pointerType);
            };
        } else {
            hoverProps.onTouchStart = ()=>{
                state.ignoreEmulatedMouseEvents = true;
            };
            hoverProps.onMouseEnter = (e)=>{
                if (!state.ignoreEmulatedMouseEvents && !$ffbc150311c75f01$var$globalIgnoreEmulatedMouseEvents) triggerHoverStart(e, "mouse");
                state.ignoreEmulatedMouseEvents = false;
            };
            hoverProps.onMouseLeave = (e)=>{
                if (!isDisabled && e.currentTarget.contains(e.target)) triggerHoverEnd(e, "mouse");
            };
        }
        return {
            hoverProps: hoverProps,
            triggerHoverEnd: triggerHoverEnd
        };
    }, [
        onHoverStart,
        onHoverChange,
        onHoverEnd,
        isDisabled,
        state
    ]);
    (0, $goTMa$react.useEffect)(()=>{
        // Call the triggerHoverEnd as soon as isDisabled changes to true
        // Safe to call triggerHoverEnd, it will early return if we aren't currently hovering
        if (isDisabled) triggerHoverEnd({
            currentTarget: state.target
        }, state.pointerType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isDisabled
    ]);
    return {
        hoverProps: hoverProps,
        isHovered: isHovered
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions

function $edcfa848c42f94f4$export$872b660ac5a1ff98(props) {
    let { ref: ref , onInteractOutside: onInteractOutside , isDisabled: isDisabled , onInteractOutsideStart: onInteractOutsideStart  } = props;
    let stateRef = (0, $goTMa$react.useRef)({
        isPointerDown: false,
        ignoreEmulatedMouseEvents: false,
        onInteractOutside: onInteractOutside,
        onInteractOutsideStart: onInteractOutsideStart
    });
    let state = stateRef.current;
    state.onInteractOutside = onInteractOutside;
    state.onInteractOutsideStart = onInteractOutsideStart;
    (0, $goTMa$react.useEffect)(()=>{
        if (isDisabled) return;
        let onPointerDown = (e)=>{
            if ($edcfa848c42f94f4$var$isValidEvent(e, ref) && state.onInteractOutside) {
                if (state.onInteractOutsideStart) state.onInteractOutsideStart(e);
                state.isPointerDown = true;
            }
        };
        // Use pointer events if available. Otherwise, fall back to mouse and touch events.
        if (typeof PointerEvent !== "undefined") {
            let onPointerUp = (e)=>{
                if (state.isPointerDown && state.onInteractOutside && $edcfa848c42f94f4$var$isValidEvent(e, ref)) state.onInteractOutside(e);
                state.isPointerDown = false;
            };
            // changing these to capture phase fixed combobox
            document.addEventListener("pointerdown", onPointerDown, true);
            document.addEventListener("pointerup", onPointerUp, true);
            return ()=>{
                document.removeEventListener("pointerdown", onPointerDown, true);
                document.removeEventListener("pointerup", onPointerUp, true);
            };
        } else {
            let onMouseUp = (e)=>{
                if (state.ignoreEmulatedMouseEvents) state.ignoreEmulatedMouseEvents = false;
                else if (state.isPointerDown && state.onInteractOutside && $edcfa848c42f94f4$var$isValidEvent(e, ref)) state.onInteractOutside(e);
                state.isPointerDown = false;
            };
            let onTouchEnd = (e)=>{
                state.ignoreEmulatedMouseEvents = true;
                if (state.onInteractOutside && state.isPointerDown && $edcfa848c42f94f4$var$isValidEvent(e, ref)) state.onInteractOutside(e);
                state.isPointerDown = false;
            };
            document.addEventListener("mousedown", onPointerDown, true);
            document.addEventListener("mouseup", onMouseUp, true);
            document.addEventListener("touchstart", onPointerDown, true);
            document.addEventListener("touchend", onTouchEnd, true);
            return ()=>{
                document.removeEventListener("mousedown", onPointerDown, true);
                document.removeEventListener("mouseup", onMouseUp, true);
                document.removeEventListener("touchstart", onPointerDown, true);
                document.removeEventListener("touchend", onTouchEnd, true);
            };
        }
    }, [
        ref,
        state,
        isDisabled
    ]);
}
function $edcfa848c42f94f4$var$isValidEvent(event, ref) {
    if (event.button > 0) return false;
    if (event.target) {
        // if the event target is no longer in the document, ignore
        const ownerDocument = event.target.ownerDocument;
        if (!ownerDocument || !ownerDocument.documentElement.contains(event.target)) return false;
        // If the target is within a top layer element (e.g. toasts), ignore.
        if (event.target.closest("[data-react-aria-top-layer]")) return false;
    }
    return ref.current && !ref.current.contains(event.target);
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
 */ function $951fbcbbca8db6ce$export$48d1ea6320830260(handler) {
    if (!handler) return;
    let shouldStopPropagation = true;
    return (e)=>{
        let event = {
            ...e,
            preventDefault () {
                e.preventDefault();
            },
            isDefaultPrevented () {
                return e.isDefaultPrevented();
            },
            stopPropagation () {
                console.error("stopPropagation is now the default behavior for events in React Spectrum. You can use continuePropagation() to revert this behavior.");
            },
            continuePropagation () {
                shouldStopPropagation = false;
            }
        };
        handler(event);
        if (shouldStopPropagation) e.stopPropagation();
    };
}


function $892d64db2a3c53b0$export$8f71654801c2f7cd(props) {
    return {
        keyboardProps: props.isDisabled ? {} : {
            onKeyDown: (0, $951fbcbbca8db6ce$export$48d1ea6320830260)(props.onKeyDown),
            onKeyUp: (0, $951fbcbbca8db6ce$export$48d1ea6320830260)(props.onKeyUp)
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
 */ 


function $c09386fc48fa427d$export$36da96379f79f245(props) {
    let { onMoveStart: onMoveStart , onMove: onMove , onMoveEnd: onMoveEnd  } = props;
    let state = (0, $goTMa$react.useRef)({
        didMove: false,
        lastPosition: null,
        id: null
    });
    let { addGlobalListener: addGlobalListener , removeGlobalListener: removeGlobalListener  } = (0, $goTMa$reactariautils.useGlobalListeners)();
    let moveProps = (0, $goTMa$react.useMemo)(()=>{
        let moveProps = {};
        let start = ()=>{
            (0, $f7e14e656343df57$export$16a4697467175487)();
            state.current.didMove = false;
        };
        let move = (originalEvent, pointerType, deltaX, deltaY)=>{
            if (deltaX === 0 && deltaY === 0) return;
            if (!state.current.didMove) {
                state.current.didMove = true;
                onMoveStart === null || onMoveStart === void 0 ? void 0 : onMoveStart({
                    type: "movestart",
                    pointerType: pointerType,
                    shiftKey: originalEvent.shiftKey,
                    metaKey: originalEvent.metaKey,
                    ctrlKey: originalEvent.ctrlKey,
                    altKey: originalEvent.altKey
                });
            }
            onMove({
                type: "move",
                pointerType: pointerType,
                deltaX: deltaX,
                deltaY: deltaY,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        };
        let end = (originalEvent, pointerType)=>{
            (0, $f7e14e656343df57$export$b0d6fa1ab32e3295)();
            if (state.current.didMove) onMoveEnd === null || onMoveEnd === void 0 ? void 0 : onMoveEnd({
                type: "moveend",
                pointerType: pointerType,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        };
        if (typeof PointerEvent === "undefined") {
            let onMouseMove = (e)=>{
                if (e.button === 0) {
                    move(e, "mouse", e.pageX - state.current.lastPosition.pageX, e.pageY - state.current.lastPosition.pageY);
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                }
            };
            let onMouseUp = (e)=>{
                if (e.button === 0) {
                    end(e, "mouse");
                    removeGlobalListener(window, "mousemove", onMouseMove, false);
                    removeGlobalListener(window, "mouseup", onMouseUp, false);
                }
            };
            moveProps.onMouseDown = (e)=>{
                if (e.button === 0) {
                    start();
                    e.stopPropagation();
                    e.preventDefault();
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                    addGlobalListener(window, "mousemove", onMouseMove, false);
                    addGlobalListener(window, "mouseup", onMouseUp, false);
                }
            };
            let onTouchMove = (e)=>{
                let touch = [
                    ...e.changedTouches
                ].findIndex(({ identifier: identifier  })=>identifier === state.current.id);
                if (touch >= 0) {
                    let { pageX: pageX , pageY: pageY  } = e.changedTouches[touch];
                    move(e, "touch", pageX - state.current.lastPosition.pageX, pageY - state.current.lastPosition.pageY);
                    state.current.lastPosition = {
                        pageX: pageX,
                        pageY: pageY
                    };
                }
            };
            let onTouchEnd = (e)=>{
                let touch = [
                    ...e.changedTouches
                ].findIndex(({ identifier: identifier  })=>identifier === state.current.id);
                if (touch >= 0) {
                    end(e, "touch");
                    state.current.id = null;
                    removeGlobalListener(window, "touchmove", onTouchMove);
                    removeGlobalListener(window, "touchend", onTouchEnd);
                    removeGlobalListener(window, "touchcancel", onTouchEnd);
                }
            };
            moveProps.onTouchStart = (e)=>{
                if (e.changedTouches.length === 0 || state.current.id != null) return;
                let { pageX: pageX , pageY: pageY , identifier: identifier  } = e.changedTouches[0];
                start();
                e.stopPropagation();
                e.preventDefault();
                state.current.lastPosition = {
                    pageX: pageX,
                    pageY: pageY
                };
                state.current.id = identifier;
                addGlobalListener(window, "touchmove", onTouchMove, false);
                addGlobalListener(window, "touchend", onTouchEnd, false);
                addGlobalListener(window, "touchcancel", onTouchEnd, false);
            };
        } else {
            let onPointerMove = (e)=>{
                if (e.pointerId === state.current.id) {
                    let pointerType = e.pointerType || "mouse";
                    // Problems with PointerEvent#movementX/movementY:
                    // 1. it is always 0 on macOS Safari.
                    // 2. On Chrome Android, it's scaled by devicePixelRatio, but not on Chrome macOS
                    move(e, pointerType, e.pageX - state.current.lastPosition.pageX, e.pageY - state.current.lastPosition.pageY);
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                }
            };
            let onPointerUp = (e)=>{
                if (e.pointerId === state.current.id) {
                    let pointerType = e.pointerType || "mouse";
                    end(e, pointerType);
                    state.current.id = null;
                    removeGlobalListener(window, "pointermove", onPointerMove, false);
                    removeGlobalListener(window, "pointerup", onPointerUp, false);
                    removeGlobalListener(window, "pointercancel", onPointerUp, false);
                }
            };
            moveProps.onPointerDown = (e)=>{
                if (e.button === 0 && state.current.id == null) {
                    start();
                    e.stopPropagation();
                    e.preventDefault();
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                    state.current.id = e.pointerId;
                    addGlobalListener(window, "pointermove", onPointerMove, false);
                    addGlobalListener(window, "pointerup", onPointerUp, false);
                    addGlobalListener(window, "pointercancel", onPointerUp, false);
                }
            };
        }
        let triggerKeyboardMove = (e, deltaX, deltaY)=>{
            start();
            move(e, "keyboard", deltaX, deltaY);
            end(e, "keyboard");
        };
        moveProps.onKeyDown = (e)=>{
            switch(e.key){
                case "Left":
                case "ArrowLeft":
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, -1, 0);
                    break;
                case "Right":
                case "ArrowRight":
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 1, 0);
                    break;
                case "Up":
                case "ArrowUp":
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 0, -1);
                    break;
                case "Down":
                case "ArrowDown":
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 0, 1);
                    break;
            }
        };
        return moveProps;
    }, [
        state,
        onMoveStart,
        onMove,
        onMoveEnd,
        addGlobalListener,
        removeGlobalListener
    ]);
    return {
        moveProps: moveProps
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

function $a3dbce0aed7087e2$export$2123ff2b87c81ca(props, ref) {
    let { onScroll: onScroll , isDisabled: isDisabled  } = props;
    let onScrollHandler = (0, $goTMa$react.useCallback)((e)=>{
        // If the ctrlKey is pressed, this is a zoom event, do nothing.
        if (e.ctrlKey) return;
        // stop scrolling the page
        e.preventDefault();
        e.stopPropagation();
        if (onScroll) onScroll({
            deltaX: e.deltaX,
            deltaY: e.deltaY
        });
    }, [
        onScroll
    ]);
    (0, $goTMa$reactariautils.useEvent)(ref, "wheel", isDisabled ? null : onScrollHandler);
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


const $3cd7b5d0eebf0ca9$var$DEFAULT_THRESHOLD = 500;
function $3cd7b5d0eebf0ca9$export$c24ed0104d07eab9(props) {
    let { isDisabled: isDisabled , onLongPressStart: onLongPressStart , onLongPressEnd: onLongPressEnd , onLongPress: onLongPress , threshold: threshold = $3cd7b5d0eebf0ca9$var$DEFAULT_THRESHOLD , accessibilityDescription: accessibilityDescription  } = props;
    const timeRef = (0, $goTMa$react.useRef)(null);
    let { addGlobalListener: addGlobalListener , removeGlobalListener: removeGlobalListener  } = (0, $goTMa$reactariautils.useGlobalListeners)();
    let { pressProps: pressProps  } = (0, $0294ea432cd92340$export$45712eceda6fad21)({
        isDisabled: isDisabled,
        onPressStart (e) {
            if (e.pointerType === "mouse" || e.pointerType === "touch") {
                if (onLongPressStart) onLongPressStart({
                    ...e,
                    type: "longpressstart"
                });
                timeRef.current = setTimeout(()=>{
                    // Prevent other usePress handlers from also handling this event.
                    e.target.dispatchEvent(new PointerEvent("pointercancel", {
                        bubbles: true
                    }));
                    if (onLongPress) onLongPress({
                        ...e,
                        type: "longpress"
                    });
                    timeRef.current = null;
                }, threshold);
                // Prevent context menu, which may be opened on long press on touch devices
                if (e.pointerType === "touch") {
                    let onContextMenu = (e)=>{
                        e.preventDefault();
                    };
                    addGlobalListener(e.target, "contextmenu", onContextMenu, {
                        once: true
                    });
                    addGlobalListener(window, "pointerup", ()=>{
                        // If no contextmenu event is fired quickly after pointerup, remove the handler
                        // so future context menu events outside a long press are not prevented.
                        setTimeout(()=>{
                            removeGlobalListener(e.target, "contextmenu", onContextMenu);
                        }, 30);
                    }, {
                        once: true
                    });
                }
            }
        },
        onPressEnd (e) {
            if (timeRef.current) clearTimeout(timeRef.current);
            if (onLongPressEnd && (e.pointerType === "mouse" || e.pointerType === "touch")) onLongPressEnd({
                ...e,
                type: "longpressend"
            });
        }
    });
    let descriptionProps = (0, $goTMa$reactariautils.useDescription)(onLongPress && !isDisabled ? accessibilityDescription : null);
    return {
        longPressProps: (0, $goTMa$reactariautils.mergeProps)(pressProps, descriptionProps)
    };
}




//# sourceMappingURL=main.js.map
