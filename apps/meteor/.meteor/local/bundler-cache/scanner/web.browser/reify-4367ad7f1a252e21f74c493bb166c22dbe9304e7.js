module.export({useCheckbox:()=>$406796ff087fe49b$export$e375f10ce42261c5,useCheckboxGroup:()=>$1e9fce0cfacc738b$export$49ff6f28c54f1cbe,useCheckboxGroupItem:()=>$fba3e38d5ca8983f$export$353b32fc6898d37d});let $cKEhs$useEffect;module.link("react",{useEffect(v){$cKEhs$useEffect=v}},0);let $cKEhs$useToggle;module.link("@react-aria/toggle",{useToggle(v){$cKEhs$useToggle=v}},1);let $cKEhs$filterDOMProps,$cKEhs$mergeProps;module.link("@react-aria/utils",{filterDOMProps(v){$cKEhs$filterDOMProps=v},mergeProps(v){$cKEhs$mergeProps=v}},2);let $cKEhs$useField;module.link("@react-aria/label",{useField(v){$cKEhs$useField=v}},3);let $cKEhs$useToggleState;module.link("@react-stately/toggle",{useToggleState(v){$cKEhs$useToggleState=v}},4);





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

function $406796ff087fe49b$export$e375f10ce42261c5(props, state, inputRef) {
    let { inputProps: inputProps , isSelected: isSelected , isPressed: isPressed , isDisabled: isDisabled , isReadOnly: isReadOnly  } = (0, $cKEhs$useToggle)(props, state, inputRef);
    let { isIndeterminate: isIndeterminate  } = props;
    (0, $cKEhs$useEffect)(()=>{
        // indeterminate is a property, but it can only be set via javascript
        // https://css-tricks.com/indeterminate-checkboxes/
        if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
    });
    return {
        inputProps: {
            ...inputProps,
            checked: isSelected
        },
        isSelected: isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly
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
 */ const $1ae600c947479353$export$31440636951aa68c = new WeakMap();
const $1ae600c947479353$export$a3077e9c93f7360f = new WeakMap();
const $1ae600c947479353$export$d5679492e2864181 = new WeakMap();




function $1e9fce0cfacc738b$export$49ff6f28c54f1cbe(props, state) {
    let { isDisabled: isDisabled , name: name  } = props;
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $cKEhs$useField)({
        ...props,
        // Checkbox group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    (0, $1ae600c947479353$export$a3077e9c93f7360f).set(state, descriptionProps.id);
    (0, $1ae600c947479353$export$d5679492e2864181).set(state, errorMessageProps.id);
    let domProps = (0, $cKEhs$filterDOMProps)(props, {
        labelable: true
    });
    // Pass name prop from group to all items by attaching to the state.
    (0, $1ae600c947479353$export$31440636951aa68c).set(state, name);
    return {
        groupProps: (0, $cKEhs$mergeProps)(domProps, {
            role: "group",
            "aria-disabled": isDisabled || undefined,
            ...fieldProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
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


function $fba3e38d5ca8983f$export$353b32fc6898d37d(props, state, inputRef) {
    const toggleState = (0, $cKEhs$useToggleState)({
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isSelected: state.isSelected(props.value),
        onChange (isSelected) {
            if (isSelected) state.addValue(props.value);
            else state.removeValue(props.value);
            if (props.onChange) props.onChange(isSelected);
        }
    });
    let res = (0, $406796ff087fe49b$export$e375f10ce42261c5)({
        ...props,
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isDisabled: props.isDisabled || state.isDisabled,
        name: props.name || (0, $1ae600c947479353$export$31440636951aa68c).get(state)
    }, toggleState, inputRef);
    return {
        ...res,
        inputProps: {
            ...res.inputProps,
            "aria-describedby": [
                state.validationState === "invalid" ? (0, $1ae600c947479353$export$d5679492e2864181).get(state) : null,
                (0, $1ae600c947479353$export$a3077e9c93f7360f).get(state)
            ].filter(Boolean).join(" ") || undefined
        }
    };
}





//# sourceMappingURL=module.js.map
