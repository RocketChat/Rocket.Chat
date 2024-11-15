var $coMqq$reactariautils = require("@react-aria/utils");
var $coMqq$react = require("react");
var $coMqq$reactariainteractions = require("@react-aria/interactions");
var $coMqq$reactarialabel = require("@react-aria/label");
var $coMqq$reactariai18n = require("@react-aria/i18n");
var $coMqq$reactariafocus = require("@react-aria/focus");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSlider", () => $481f97d830e3ede6$export$56b2c08e277f365);
$parcel$export(module.exports, "useSliderThumb", () => $5eb806b626475377$export$8d15029008292ae);
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
const $28db8d634be2fa58$export$7a8d2b02c9371cbf = new WeakMap();
function $28db8d634be2fa58$export$68e648cbec363a18(state, index) {
    let id = $28db8d634be2fa58$export$7a8d2b02c9371cbf.get(state);
    if (!id) throw new Error("Unknown slider state");
    return `${id}-${index}`;
}






function $481f97d830e3ede6$export$56b2c08e277f365(props, state, trackRef) {
    let { labelProps: labelProps , fieldProps: fieldProps  } = (0, $coMqq$reactarialabel.useLabel)(props);
    let isVertical = props.orientation === "vertical";
    var _labelProps_id;
    // Attach id of the label to the state so it can be accessed by useSliderThumb.
    (0, $28db8d634be2fa58$export$7a8d2b02c9371cbf).set(state, (_labelProps_id = labelProps.id) !== null && _labelProps_id !== void 0 ? _labelProps_id : fieldProps.id);
    let { direction: direction  } = (0, $coMqq$reactariai18n.useLocale)();
    let { addGlobalListener: addGlobalListener , removeGlobalListener: removeGlobalListener  } = (0, $coMqq$reactariautils.useGlobalListeners)();
    // When the user clicks or drags the track, we want the motion to set and drag the
    // closest thumb.  Hence we also need to install useMove() on the track element.
    // Here, we keep track of which index is the "closest" to the drag start point.
    // It is set onMouseDown/onTouchDown; see trackProps below.
    const realTimeTrackDraggingIndex = (0, $coMqq$react.useRef)(null);
    const stateRef = (0, $coMqq$react.useRef)(null);
    stateRef.current = state;
    const reverseX = direction === "rtl";
    const currentPosition = (0, $coMqq$react.useRef)(null);
    const { moveProps: moveProps  } = (0, $coMqq$reactariainteractions.useMove)({
        onMoveStart () {
            currentPosition.current = null;
        },
        onMove ({ deltaX: deltaX , deltaY: deltaY  }) {
            let { height: height , width: width  } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            if (currentPosition.current == null) currentPosition.current = stateRef.current.getThumbPercent(realTimeTrackDraggingIndex.current) * size;
            let delta = isVertical ? deltaY : deltaX;
            if (isVertical || reverseX) delta = -delta;
            currentPosition.current += delta;
            if (realTimeTrackDraggingIndex.current != null && trackRef.current) {
                const percent = (0, $coMqq$reactariautils.clamp)(currentPosition.current / size, 0, 1);
                stateRef.current.setThumbPercent(realTimeTrackDraggingIndex.current, percent);
            }
        },
        onMoveEnd () {
            if (realTimeTrackDraggingIndex.current != null) {
                stateRef.current.setThumbDragging(realTimeTrackDraggingIndex.current, false);
                realTimeTrackDraggingIndex.current = null;
            }
        }
    });
    let currentPointer = (0, $coMqq$react.useRef)(undefined);
    let onDownTrack = (e, id, clientX, clientY)=>{
        // We only trigger track-dragging if the user clicks on the track itself and nothing is currently being dragged.
        if (trackRef.current && !props.isDisabled && state.values.every((_, i)=>!state.isThumbDragging(i))) {
            let { height: height , width: width , top: top , left: left  } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            // Find the closest thumb
            const trackPosition = isVertical ? top : left;
            const clickPosition = isVertical ? clientY : clientX;
            const offset = clickPosition - trackPosition;
            let percent = offset / size;
            if (direction === "rtl" || isVertical) percent = 1 - percent;
            let value = state.getPercentValue(percent);
            // to find the closet thumb we split the array based on the first thumb position to the "right/end" of the click.
            let closestThumb;
            let split = state.values.findIndex((v)=>value - v < 0);
            if (split === 0) closestThumb = split;
            else if (split === -1) closestThumb = state.values.length - 1;
            else {
                let lastLeft = state.values[split - 1];
                let firstRight = state.values[split];
                // Pick the last left/start thumb, unless they are stacked on top of each other, then pick the right/end one
                if (Math.abs(lastLeft - value) < Math.abs(firstRight - value)) closestThumb = split - 1;
                else closestThumb = split;
            }
            // Confirm that the found closest thumb is editable, not disabled, and move it
            if (closestThumb >= 0 && state.isThumbEditable(closestThumb)) {
                // Don't unfocus anything
                e.preventDefault();
                realTimeTrackDraggingIndex.current = closestThumb;
                state.setFocusedThumb(closestThumb);
                currentPointer.current = id;
                state.setThumbDragging(realTimeTrackDraggingIndex.current, true);
                state.setThumbValue(closestThumb, value);
                addGlobalListener(window, "mouseup", onUpTrack, false);
                addGlobalListener(window, "touchend", onUpTrack, false);
                addGlobalListener(window, "pointerup", onUpTrack, false);
            } else realTimeTrackDraggingIndex.current = null;
        }
    };
    let onUpTrack = (e)=>{
        var _e_changedTouches;
        var _e_pointerId;
        let id = (_e_pointerId = e.pointerId) !== null && _e_pointerId !== void 0 ? _e_pointerId : (_e_changedTouches = e.changedTouches) === null || _e_changedTouches === void 0 ? void 0 : _e_changedTouches[0].identifier;
        if (id === currentPointer.current) {
            if (realTimeTrackDraggingIndex.current != null) {
                state.setThumbDragging(realTimeTrackDraggingIndex.current, false);
                realTimeTrackDraggingIndex.current = null;
            }
            removeGlobalListener(window, "mouseup", onUpTrack, false);
            removeGlobalListener(window, "touchend", onUpTrack, false);
            removeGlobalListener(window, "pointerup", onUpTrack, false);
        }
    };
    if ("htmlFor" in labelProps && labelProps.htmlFor) {
        // Ideally the `for` attribute should point to the first thumb, but VoiceOver on iOS
        // causes this to override the `aria-labelledby` on the thumb. This causes the first
        // thumb to only be announced as the slider label rather than its individual name as well.
        // See https://bugs.webkit.org/show_bug.cgi?id=172464.
        delete labelProps.htmlFor;
        labelProps.onClick = ()=>{
            var // Safari does not focus <input type="range"> elements when clicking on an associated <label>,
            // so do it manually. In addition, make sure we show the focus ring.
            _document_getElementById;
            (_document_getElementById = document.getElementById((0, $28db8d634be2fa58$export$68e648cbec363a18)(state, 0))) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.focus();
            (0, $coMqq$reactariainteractions.setInteractionModality)("keyboard");
        };
    }
    return {
        labelProps: labelProps,
        // The root element of the Slider will have role="group" to group together
        // all the thumb inputs in the Slider.  The label of the Slider will
        // be used to label the group.
        groupProps: {
            role: "group",
            ...fieldProps
        },
        trackProps: (0, $coMqq$reactariautils.mergeProps)({
            onMouseDown (e) {
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onDownTrack(e, undefined, e.clientX, e.clientY);
            },
            onPointerDown (e) {
                if (e.pointerType === "mouse" && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onDownTrack(e, e.pointerId, e.clientX, e.clientY);
            },
            onTouchStart (e) {
                onDownTrack(e, e.changedTouches[0].identifier, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            },
            style: {
                position: "relative",
                touchAction: "none"
            }
        }, moveProps),
        outputProps: {
            htmlFor: state.values.map((_, index)=>(0, $28db8d634be2fa58$export$68e648cbec363a18)(state, index)).join(" "),
            "aria-live": "off"
        }
    };
}









function $5eb806b626475377$export$8d15029008292ae(opts, state) {
    let { index: index = 0 , isRequired: isRequired , validationState: validationState , trackRef: trackRef , inputRef: inputRef , orientation: orientation = state.orientation  } = opts;
    let isDisabled = opts.isDisabled || state.isDisabled;
    let isVertical = orientation === "vertical";
    let { direction: direction  } = (0, $coMqq$reactariai18n.useLocale)();
    let { addGlobalListener: addGlobalListener , removeGlobalListener: removeGlobalListener  } = (0, $coMqq$reactariautils.useGlobalListeners)();
    let labelId = (0, $28db8d634be2fa58$export$7a8d2b02c9371cbf).get(state);
    var _opts_arialabelledby;
    const { labelProps: labelProps , fieldProps: fieldProps  } = (0, $coMqq$reactarialabel.useLabel)({
        ...opts,
        id: (0, $28db8d634be2fa58$export$68e648cbec363a18)(state, index),
        "aria-labelledby": `${labelId} ${(_opts_arialabelledby = opts["aria-labelledby"]) !== null && _opts_arialabelledby !== void 0 ? _opts_arialabelledby : ""}`.trim()
    });
    const value = state.values[index];
    const focusInput = (0, $coMqq$react.useCallback)(()=>{
        if (inputRef.current) (0, $coMqq$reactariautils.focusWithoutScrolling)(inputRef.current);
    }, [
        inputRef
    ]);
    const isFocused = state.focusedThumb === index;
    (0, $coMqq$react.useEffect)(()=>{
        if (isFocused) focusInput();
    }, [
        isFocused,
        focusInput
    ]);
    const stateRef = (0, $coMqq$react.useRef)(null);
    stateRef.current = state;
    let reverseX = direction === "rtl";
    let currentPosition = (0, $coMqq$react.useRef)(null);
    let { keyboardProps: keyboardProps  } = (0, $coMqq$reactariainteractions.useKeyboard)({
        onKeyDown (e) {
            let { getThumbMaxValue: getThumbMaxValue , getThumbMinValue: getThumbMinValue , decrementThumb: decrementThumb , incrementThumb: incrementThumb , setThumbValue: setThumbValue , setThumbDragging: setThumbDragging , pageSize: pageSize  } = stateRef.current;
            // these are the cases that useMove or useSlider don't handle
            if (!/^(PageUp|PageDown|Home|End)$/.test(e.key)) {
                e.continuePropagation();
                return;
            }
            // same handling as useMove, stopPropagation to prevent useSlider from handling the event as well.
            e.preventDefault();
            // remember to set this so that onChangeEnd is fired
            setThumbDragging(index, true);
            switch(e.key){
                case "PageUp":
                    incrementThumb(index, pageSize);
                    break;
                case "PageDown":
                    decrementThumb(index, pageSize);
                    break;
                case "Home":
                    setThumbValue(index, getThumbMinValue(index));
                    break;
                case "End":
                    setThumbValue(index, getThumbMaxValue(index));
                    break;
            }
            setThumbDragging(index, false);
        }
    });
    let { moveProps: moveProps  } = (0, $coMqq$reactariainteractions.useMove)({
        onMoveStart () {
            currentPosition.current = null;
            stateRef.current.setThumbDragging(index, true);
        },
        onMove ({ deltaX: deltaX , deltaY: deltaY , pointerType: pointerType , shiftKey: shiftKey  }) {
            const { getThumbPercent: getThumbPercent , setThumbPercent: setThumbPercent , decrementThumb: decrementThumb , incrementThumb: incrementThumb , step: step , pageSize: pageSize  } = stateRef.current;
            let { width: width , height: height  } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            if (currentPosition.current == null) currentPosition.current = getThumbPercent(index) * size;
            if (pointerType === "keyboard") {
                if (deltaX > 0 && reverseX || deltaX < 0 && !reverseX || deltaY > 0) decrementThumb(index, shiftKey ? pageSize : step);
                else incrementThumb(index, shiftKey ? pageSize : step);
            } else {
                let delta = isVertical ? deltaY : deltaX;
                if (isVertical || reverseX) delta = -delta;
                currentPosition.current += delta;
                setThumbPercent(index, (0, $coMqq$reactariautils.clamp)(currentPosition.current / size, 0, 1));
            }
        },
        onMoveEnd () {
            stateRef.current.setThumbDragging(index, false);
        }
    });
    // Immediately register editability with the state
    state.setThumbEditable(index, !isDisabled);
    const { focusableProps: focusableProps  } = (0, $coMqq$reactariafocus.useFocusable)((0, $coMqq$reactariautils.mergeProps)(opts, {
        onFocus: ()=>state.setFocusedThumb(index),
        onBlur: ()=>state.setFocusedThumb(undefined)
    }), inputRef);
    let currentPointer = (0, $coMqq$react.useRef)(undefined);
    let onDown = (id)=>{
        focusInput();
        currentPointer.current = id;
        state.setThumbDragging(index, true);
        addGlobalListener(window, "mouseup", onUp, false);
        addGlobalListener(window, "touchend", onUp, false);
        addGlobalListener(window, "pointerup", onUp, false);
    };
    let onUp = (e)=>{
        var _e_changedTouches;
        var _e_pointerId;
        let id = (_e_pointerId = e.pointerId) !== null && _e_pointerId !== void 0 ? _e_pointerId : (_e_changedTouches = e.changedTouches) === null || _e_changedTouches === void 0 ? void 0 : _e_changedTouches[0].identifier;
        if (id === currentPointer.current) {
            focusInput();
            state.setThumbDragging(index, false);
            removeGlobalListener(window, "mouseup", onUp, false);
            removeGlobalListener(window, "touchend", onUp, false);
            removeGlobalListener(window, "pointerup", onUp, false);
        }
    };
    let thumbPosition = state.getThumbPercent(index);
    if (isVertical || direction === "rtl") thumbPosition = 1 - thumbPosition;
    let interactions = !isDisabled ? (0, $coMqq$reactariautils.mergeProps)(keyboardProps, moveProps, {
        onMouseDown: (e)=>{
            if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
            onDown();
        },
        onPointerDown: (e)=>{
            if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
            onDown(e.pointerId);
        },
        onTouchStart: (e)=>{
            onDown(e.changedTouches[0].identifier);
        }
    }) : {};
    // We install mouse handlers for the drag motion on the thumb div, but
    // not the key handler for moving the thumb with the slider.  Instead,
    // we focus the range input, and let the browser handle the keyboard
    // interactions; we then listen to input's onChange to update state.
    return {
        inputProps: (0, $coMqq$reactariautils.mergeProps)(focusableProps, fieldProps, {
            type: "range",
            tabIndex: !isDisabled ? 0 : undefined,
            min: state.getThumbMinValue(index),
            max: state.getThumbMaxValue(index),
            step: state.step,
            value: value,
            disabled: isDisabled,
            "aria-orientation": orientation,
            "aria-valuetext": state.getThumbValueLabel(index),
            "aria-required": isRequired || undefined,
            "aria-invalid": validationState === "invalid" || undefined,
            "aria-errormessage": opts["aria-errormessage"],
            onChange: (e)=>{
                stateRef.current.setThumbValue(index, parseFloat(e.target.value));
            }
        }),
        thumbProps: {
            ...interactions,
            style: {
                position: "absolute",
                [isVertical ? "top" : "left"]: `${thumbPosition * 100}%`,
                transform: "translate(-50%, -50%)",
                touchAction: "none"
            }
        },
        labelProps: labelProps,
        isDragging: state.isThumbDragging(index),
        isDisabled: isDisabled,
        isFocused: isFocused
    };
}




//# sourceMappingURL=main.js.map
