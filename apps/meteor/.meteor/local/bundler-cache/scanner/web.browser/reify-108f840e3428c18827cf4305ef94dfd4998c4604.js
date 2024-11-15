module.export({useToggle:()=>$d2c8e2b0480f3f34$export$cbe85ee05b554577});let $7CUUz$mergeProps,$7CUUz$filterDOMProps;module.link("@react-aria/utils",{mergeProps(v){$7CUUz$mergeProps=v},filterDOMProps(v){$7CUUz$filterDOMProps=v}},0);let $7CUUz$useFocusable;module.link("@react-aria/focus",{useFocusable(v){$7CUUz$useFocusable=v}},1);let $7CUUz$usePress;module.link("@react-aria/interactions",{usePress(v){$7CUUz$usePress=v}},2);



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


function $d2c8e2b0480f3f34$export$cbe85ee05b554577(props, state, ref) {
    let { isDisabled: isDisabled = false , isRequired: isRequired = false , isReadOnly: isReadOnly = false , value: value , name: name , children: children , "aria-label": ariaLabel , "aria-labelledby": ariaLabelledby , validationState: validationState = "valid"  } = props;
    let onChange = (e)=>{
        // since we spread props on label, onChange will end up there as well as in here.
        // so we have to stop propagation at the lowest level that we care about
        e.stopPropagation();
        state.setSelected(e.target.checked);
    };
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel) console.warn("If you do not provide children, you must specify an aria-label for accessibility");
    // This handles focusing the input on pointer down, which Safari does not do by default.
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $7CUUz$usePress)({
        isDisabled: isDisabled
    });
    let { focusableProps: focusableProps  } = (0, $7CUUz$useFocusable)(props, ref);
    let interactions = (0, $7CUUz$mergeProps)(pressProps, focusableProps);
    let domProps = (0, $7CUUz$filterDOMProps)(props, {
        labelable: true
    });
    return {
        inputProps: (0, $7CUUz$mergeProps)(domProps, {
            "aria-invalid": validationState === "invalid" || undefined,
            "aria-errormessage": props["aria-errormessage"],
            "aria-controls": props["aria-controls"],
            "aria-readonly": isReadOnly || undefined,
            "aria-required": isRequired || undefined,
            onChange: onChange,
            disabled: isDisabled,
            ...value == null ? {} : {
                value: value
            },
            name: name,
            type: "checkbox",
            ...interactions
        }),
        isSelected: state.isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly
    };
}





//# sourceMappingURL=module.js.map
