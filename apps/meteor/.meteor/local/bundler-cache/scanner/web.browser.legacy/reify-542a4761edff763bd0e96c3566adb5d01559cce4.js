var $fMEGB$reactariautils = require("@react-aria/utils");
var $fMEGB$reactariafocus = require("@react-aria/focus");
var $fMEGB$reactariainteractions = require("@react-aria/interactions");
var $fMEGB$reactarialabel = require("@react-aria/label");
var $fMEGB$reactariai18n = require("@react-aria/i18n");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useRadio", () => $e184702b1b7f1863$export$37b0961d2f4751e2);
$parcel$export(module.exports, "useRadioGroup", () => $dfcade00a56a6317$export$62b9571f283ff5c2);
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
 */ const $eeb149278aae5c67$export$3b7b268d09480394 = new WeakMap();
const $eeb149278aae5c67$export$8e8b214e06dd397d = new WeakMap();
const $eeb149278aae5c67$export$61c8d3f0151e21b2 = new WeakMap();




function $e184702b1b7f1863$export$37b0961d2f4751e2(props, state, ref) {
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
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $fMEGB$reactariainteractions.usePress)({
        isDisabled: isDisabled
    });
    let { focusableProps: focusableProps  } = (0, $fMEGB$reactariafocus.useFocusable)((0, $fMEGB$reactariautils.mergeProps)(props, {
        onFocus: ()=>state.setLastFocusedValue(value)
    }), ref);
    let interactions = (0, $fMEGB$reactariautils.mergeProps)(pressProps, focusableProps);
    let domProps = (0, $fMEGB$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let tabIndex = state.lastFocusedValue === value || state.lastFocusedValue == null ? 0 : -1;
    if (isDisabled) tabIndex = undefined;
    return {
        inputProps: (0, $fMEGB$reactariautils.mergeProps)(domProps, {
            ...interactions,
            type: "radio",
            name: (0, $eeb149278aae5c67$export$3b7b268d09480394).get(state),
            tabIndex: tabIndex,
            disabled: isDisabled,
            checked: checked,
            value: value,
            onChange: onChange,
            "aria-describedby": [
                state.validationState === "invalid" ? (0, $eeb149278aae5c67$export$61c8d3f0151e21b2).get(state) : null,
                (0, $eeb149278aae5c67$export$8e8b214e06dd397d).get(state)
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





function $dfcade00a56a6317$export$62b9571f283ff5c2(props, state) {
    let { name: name , validationState: validationState , isReadOnly: isReadOnly , isRequired: isRequired , isDisabled: isDisabled , orientation: orientation = "vertical"  } = props;
    let { direction: direction  } = (0, $fMEGB$reactariai18n.useLocale)();
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $fMEGB$reactarialabel.useField)({
        ...props,
        // Radio group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    (0, $eeb149278aae5c67$export$8e8b214e06dd397d).set(state, descriptionProps.id);
    (0, $eeb149278aae5c67$export$61c8d3f0151e21b2).set(state, errorMessageProps.id);
    let domProps = (0, $fMEGB$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    // When the radio group loses focus, reset the focusable radio to null if
    // there is no selection. This allows tabbing into the group from either
    // direction to go to the first or last radio.
    let { focusWithinProps: focusWithinProps  } = (0, $fMEGB$reactariainteractions.useFocusWithin)({
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
        let walker = (0, $fMEGB$reactariafocus.getFocusableTreeWalker)(e.currentTarget, {
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
    let groupName = (0, $fMEGB$reactariautils.useId)(name);
    (0, $eeb149278aae5c67$export$3b7b268d09480394).set(state, groupName);
    return {
        radioGroupProps: (0, $fMEGB$reactariautils.mergeProps)(domProps, {
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




//# sourceMappingURL=main.js.map
