var $aGFp5$reactariautils = require("@react-aria/utils");
var $aGFp5$reactariainteractions = require("@react-aria/interactions");
var $aGFp5$react = require("react");
var $aGFp5$reactariafocus = require("@react-aria/focus");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTooltip", () => $199fa2aaa84f20b7$export$1c4b08e0eca38426);
$parcel$export(module.exports, "useTooltipTrigger", () => $f017bbc46d58d42a$export$a6da6c504e4bba8b);
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

function $199fa2aaa84f20b7$export$1c4b08e0eca38426(props, state) {
    let domProps = (0, $aGFp5$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let { hoverProps: hoverProps  } = (0, $aGFp5$reactariainteractions.useHover)({
        onHoverStart: ()=>{
            return state === null || state === void 0 ? void 0 : state.open(true);
        },
        onHoverEnd: ()=>{
            return state === null || state === void 0 ? void 0 : state.close();
        }
    });
    return {
        tooltipProps: (0, $aGFp5$reactariautils.mergeProps)(domProps, hoverProps, {
            role: "tooltip"
        })
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




function $f017bbc46d58d42a$export$a6da6c504e4bba8b(props, state, ref) {
    let { isDisabled: isDisabled , trigger: trigger  } = props;
    let tooltipId = (0, $aGFp5$reactariautils.useId)();
    let isHovered = (0, $aGFp5$react.useRef)(false);
    let isFocused = (0, $aGFp5$react.useRef)(false);
    let handleShow = ()=>{
        if (isHovered.current || isFocused.current) state.open(isFocused.current);
    };
    let handleHide = (immediate)=>{
        if (!isHovered.current && !isFocused.current) state.close(immediate);
    };
    (0, $aGFp5$react.useEffect)(()=>{
        let onKeyDown = (e)=>{
            if (ref && ref.current) // Escape after clicking something can give it keyboard focus
            // dismiss tooltip on esc key press
            {
                if (e.key === "Escape") {
                    e.stopPropagation();
                    state.close(true);
                }
            }
        };
        if (state.isOpen) {
            document.addEventListener("keydown", onKeyDown, true);
            return ()=>{
                document.removeEventListener("keydown", onKeyDown, true);
            };
        }
    }, [
        ref,
        state
    ]);
    let onHoverStart = ()=>{
        if (trigger === "focus") return;
        // In chrome, if you hover a trigger, then another element obscures it, due to keyboard
        // interactions for example, hover will end. When hover is restored after that element disappears,
        // focus moves on for example, then the tooltip will reopen. We check the modality to know if the hover
        // is the result of moving the mouse.
        if ((0, $aGFp5$reactariainteractions.getInteractionModality)() === "pointer") isHovered.current = true;
        else isHovered.current = false;
        handleShow();
    };
    let onHoverEnd = ()=>{
        if (trigger === "focus") return;
        // no matter how the trigger is left, we should close the tooltip
        isFocused.current = false;
        isHovered.current = false;
        handleHide();
    };
    let onPressStart = ()=>{
        // no matter how the trigger is pressed, we should close the tooltip
        isFocused.current = false;
        isHovered.current = false;
        handleHide(true);
    };
    let onFocus = ()=>{
        let isVisible = (0, $aGFp5$reactariainteractions.isFocusVisible)();
        if (isVisible) {
            isFocused.current = true;
            handleShow();
        }
    };
    let onBlur = ()=>{
        isFocused.current = false;
        isHovered.current = false;
        handleHide(true);
    };
    let { hoverProps: hoverProps  } = (0, $aGFp5$reactariainteractions.useHover)({
        isDisabled: isDisabled,
        onHoverStart: onHoverStart,
        onHoverEnd: onHoverEnd
    });
    let { pressProps: pressProps  } = (0, $aGFp5$reactariainteractions.usePress)({
        onPressStart: onPressStart
    });
    let { focusableProps: focusableProps  } = (0, $aGFp5$reactariafocus.useFocusable)({
        isDisabled: isDisabled,
        onFocus: onFocus,
        onBlur: onBlur
    }, ref);
    return {
        triggerProps: {
            "aria-describedby": state.isOpen ? tooltipId : undefined,
            ...(0, $aGFp5$reactariautils.mergeProps)(focusableProps, hoverProps, pressProps)
        },
        tooltipProps: {
            id: tooltipId
        }
    };
}




//# sourceMappingURL=main.js.map
