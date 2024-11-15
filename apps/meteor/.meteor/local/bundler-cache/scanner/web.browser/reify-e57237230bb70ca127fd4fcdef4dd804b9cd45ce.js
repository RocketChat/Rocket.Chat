module.export({useTooltip:()=>$326e436e94273fe1$export$1c4b08e0eca38426,useTooltipTrigger:()=>$4e1b34546679e357$export$a6da6c504e4bba8b});let $kgVYN$filterDOMProps,$kgVYN$mergeProps,$kgVYN$useId;module.link("@react-aria/utils",{filterDOMProps(v){$kgVYN$filterDOMProps=v},mergeProps(v){$kgVYN$mergeProps=v},useId(v){$kgVYN$useId=v}},0);let $kgVYN$useHover,$kgVYN$getInteractionModality,$kgVYN$isFocusVisible,$kgVYN$usePress;module.link("@react-aria/interactions",{useHover(v){$kgVYN$useHover=v},getInteractionModality(v){$kgVYN$getInteractionModality=v},isFocusVisible(v){$kgVYN$isFocusVisible=v},usePress(v){$kgVYN$usePress=v}},1);let $kgVYN$useRef,$kgVYN$useEffect;module.link("react",{useRef(v){$kgVYN$useRef=v},useEffect(v){$kgVYN$useEffect=v}},2);let $kgVYN$useFocusable;module.link("@react-aria/focus",{useFocusable(v){$kgVYN$useFocusable=v}},3);




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

function $326e436e94273fe1$export$1c4b08e0eca38426(props, state) {
    let domProps = (0, $kgVYN$filterDOMProps)(props, {
        labelable: true
    });
    let { hoverProps: hoverProps  } = (0, $kgVYN$useHover)({
        onHoverStart: ()=>{
            return state === null || state === void 0 ? void 0 : state.open(true);
        },
        onHoverEnd: ()=>{
            return state === null || state === void 0 ? void 0 : state.close();
        }
    });
    return {
        tooltipProps: (0, $kgVYN$mergeProps)(domProps, hoverProps, {
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




function $4e1b34546679e357$export$a6da6c504e4bba8b(props, state, ref) {
    let { isDisabled: isDisabled , trigger: trigger  } = props;
    let tooltipId = (0, $kgVYN$useId)();
    let isHovered = (0, $kgVYN$useRef)(false);
    let isFocused = (0, $kgVYN$useRef)(false);
    let handleShow = ()=>{
        if (isHovered.current || isFocused.current) state.open(isFocused.current);
    };
    let handleHide = (immediate)=>{
        if (!isHovered.current && !isFocused.current) state.close(immediate);
    };
    (0, $kgVYN$useEffect)(()=>{
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
        if ((0, $kgVYN$getInteractionModality)() === "pointer") isHovered.current = true;
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
        let isVisible = (0, $kgVYN$isFocusVisible)();
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
    let { hoverProps: hoverProps  } = (0, $kgVYN$useHover)({
        isDisabled: isDisabled,
        onHoverStart: onHoverStart,
        onHoverEnd: onHoverEnd
    });
    let { pressProps: pressProps  } = (0, $kgVYN$usePress)({
        onPressStart: onPressStart
    });
    let { focusableProps: focusableProps  } = (0, $kgVYN$useFocusable)({
        isDisabled: isDisabled,
        onFocus: onFocus,
        onBlur: onBlur
    }, ref);
    return {
        triggerProps: {
            "aria-describedby": state.isOpen ? tooltipId : undefined,
            ...(0, $kgVYN$mergeProps)(focusableProps, hoverProps, pressProps)
        },
        tooltipProps: {
            id: tooltipId
        }
    };
}





//# sourceMappingURL=module.js.map
