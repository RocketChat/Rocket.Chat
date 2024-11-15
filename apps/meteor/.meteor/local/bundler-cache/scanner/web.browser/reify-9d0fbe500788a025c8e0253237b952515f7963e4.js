module.export({useRadio:()=>$0d5c49892c1215da$export$37b0961d2f4751e2,useRadioGroup:()=>$430f30ed08ec25fa$export$62b9571f283ff5c2});let $4vDl6$mergeProps,$4vDl6$filterDOMProps,$4vDl6$useId;module.link("@react-aria/utils",{mergeProps(v){$4vDl6$mergeProps=v},filterDOMProps(v){$4vDl6$filterDOMProps=v},useId(v){$4vDl6$useId=v}},0);let $4vDl6$useFocusable,$4vDl6$getFocusableTreeWalker;module.link("@react-aria/focus",{useFocusable(v){$4vDl6$useFocusable=v},getFocusableTreeWalker(v){$4vDl6$getFocusableTreeWalker=v}},1);let $4vDl6$usePress,$4vDl6$useFocusWithin;module.link("@react-aria/interactions",{usePress(v){$4vDl6$usePress=v},useFocusWithin(v){$4vDl6$useFocusWithin=v}},2);let $4vDl6$useField;module.link("@react-aria/label",{useField(v){$4vDl6$useField=v}},3);let $4vDl6$useLocale;module.link("@react-aria/i18n",{useLocale(v){$4vDl6$useLocale=v}},4);





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
 */ const $884aeceb3d67f00f$export$3b7b268d09480394 = new WeakMap();
const $884aeceb3d67f00f$export$8e8b214e06dd397d = new WeakMap();
const $884aeceb3d67f00f$export$61c8d3f0151e21b2 = new WeakMap();




function $0d5c49892c1215da$export$37b0961d2f4751e2(props, state, ref) {
    let { value: value , children: children , "aria-label": ariaLabel , "aria-labelledby": ariaLabelledby  } = props;
    const isDisabled = props.isDisabled || state.isDisabled;
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel) console.warn("If you do not provide children, you must specify an aria-label for accessibility");
    let checked = state.selectedValue === value;
    let onChange = (e)=>{
        e.stopPropagation();
        state.setSelectedValue(value);
    };
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $4vDl6$usePress)({
        isDisabled: isDisabled
    });
    let { focusableProps: focusableProps  } = (0, $4vDl6$useFocusable)((0, $4vDl6$mergeProps)(props, {
        onFocus: ()=>state.setLastFocusedValue(value)
    }), ref);
    let interactions = (0, $4vDl6$mergeProps)(pressProps, focusableProps);
    let domProps = (0, $4vDl6$filterDOMProps)(props, {
        labelable: true
    });
    let tabIndex = state.lastFocusedValue === value || state.lastFocusedValue == null ? 0 : -1;
    if (isDisabled) tabIndex = undefined;
    return {
        inputProps: (0, $4vDl6$mergeProps)(domProps, {
            ...interactions,
            type: "radio",
            name: (0, $884aeceb3d67f00f$export$3b7b268d09480394).get(state),
            tabIndex: tabIndex,
            disabled: isDisabled,
            checked: checked,
            value: value,
            onChange: onChange,
            "aria-describedby": [
                state.validationState === "invalid" ? (0, $884aeceb3d67f00f$export$61c8d3f0151e21b2).get(state) : null,
                (0, $884aeceb3d67f00f$export$8e8b214e06dd397d).get(state)
            ].filter(Boolean).join(" ") || undefined
        }),
        isDisabled: isDisabled,
        isSelected: checked,
        isPressed: isPressed
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





function $430f30ed08ec25fa$export$62b9571f283ff5c2(props, state) {
    let { name: name , validationState: validationState , isReadOnly: isReadOnly , isRequired: isRequired , isDisabled: isDisabled , orientation: orientation = "vertical"  } = props;
    let { direction: direction  } = (0, $4vDl6$useLocale)();
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $4vDl6$useField)({
        ...props,
        // Radio group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    (0, $884aeceb3d67f00f$export$8e8b214e06dd397d).set(state, descriptionProps.id);
    (0, $884aeceb3d67f00f$export$61c8d3f0151e21b2).set(state, errorMessageProps.id);
    let domProps = (0, $4vDl6$filterDOMProps)(props, {
        labelable: true
    });
    // When the radio group loses focus, reset the focusable radio to null if
    // there is no selection. This allows tabbing into the group from either
    // direction to go to the first or last radio.
    let { focusWithinProps: focusWithinProps  } = (0, $4vDl6$useFocusWithin)({
        onBlurWithin () {
            if (!state.selectedValue) state.setLastFocusedValue(null);
        }
    });
    let onKeyDown = (e)=>{
        let nextDir;
        switch(e.key){
            case "ArrowRight":
                if (direction === "rtl" && orientation !== "vertical") nextDir = "prev";
                else nextDir = "next";
                break;
            case "ArrowLeft":
                if (direction === "rtl" && orientation !== "vertical") nextDir = "next";
                else nextDir = "prev";
                break;
            case "ArrowDown":
                nextDir = "next";
                break;
            case "ArrowUp":
                nextDir = "prev";
                break;
            default:
                return;
        }
        e.preventDefault();
        let walker = (0, $4vDl6$getFocusableTreeWalker)(e.currentTarget, {
            from: e.target
        });
        let nextElem;
        if (nextDir === "next") {
            nextElem = walker.nextNode();
            if (!nextElem) {
                walker.currentNode = e.currentTarget;
                nextElem = walker.firstChild();
            }
        } else {
            nextElem = walker.previousNode();
            if (!nextElem) {
                walker.currentNode = e.currentTarget;
                nextElem = walker.lastChild();
            }
        }
        if (nextElem) {
            // Call focus on nextElem so that keyboard navigation scrolls the radio into view
            nextElem.focus();
            state.setSelectedValue(nextElem.value);
        }
    };
    let groupName = (0, $4vDl6$useId)(name);
    (0, $884aeceb3d67f00f$export$3b7b268d09480394).set(state, groupName);
    return {
        radioGroupProps: (0, $4vDl6$mergeProps)(domProps, {
            // https://www.w3.org/TR/wai-aria-1.2/#radiogroup
            role: "radiogroup",
            onKeyDown: onKeyDown,
            "aria-invalid": validationState === "invalid" || undefined,
            "aria-errormessage": props["aria-errormessage"],
            "aria-readonly": isReadOnly || undefined,
            "aria-required": isRequired || undefined,
            "aria-disabled": isDisabled || undefined,
            "aria-orientation": orientation,
            ...fieldProps,
            ...focusWithinProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}





//# sourceMappingURL=module.js.map
