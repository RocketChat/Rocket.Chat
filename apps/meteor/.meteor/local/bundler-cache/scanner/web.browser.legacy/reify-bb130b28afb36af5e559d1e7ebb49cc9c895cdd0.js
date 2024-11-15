var $k0DcK$react = require("react");
var $k0DcK$reactariatoggle = require("@react-aria/toggle");
var $k0DcK$reactariautils = require("@react-aria/utils");
var $k0DcK$reactarialabel = require("@react-aria/label");
var $k0DcK$reactstatelytoggle = require("@react-stately/toggle");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCheckbox", () => $468c774d7db917b7$export$e375f10ce42261c5);
$parcel$export(module.exports, "useCheckboxGroup", () => $253685172d17db7d$export$49ff6f28c54f1cbe);
$parcel$export(module.exports, "useCheckboxGroupItem", () => $07e03121d6ac83c8$export$353b32fc6898d37d);
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

function $468c774d7db917b7$export$e375f10ce42261c5(props, state, inputRef) {
    let { inputProps: inputProps , isSelected: isSelected , isPressed: isPressed , isDisabled: isDisabled , isReadOnly: isReadOnly  } = (0, $k0DcK$reactariatoggle.useToggle)(props, state, inputRef);
    let { isIndeterminate: isIndeterminate  } = props;
    (0, $k0DcK$react.useEffect)(()=>{
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
 */ const $64fc3370e682155f$export$31440636951aa68c = new WeakMap();
const $64fc3370e682155f$export$a3077e9c93f7360f = new WeakMap();
const $64fc3370e682155f$export$d5679492e2864181 = new WeakMap();




function $253685172d17db7d$export$49ff6f28c54f1cbe(props, state) {
    let { isDisabled: isDisabled , name: name  } = props;
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $k0DcK$reactarialabel.useField)({
        ...props,
        // Checkbox group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    (0, $64fc3370e682155f$export$a3077e9c93f7360f).set(state, descriptionProps.id);
    (0, $64fc3370e682155f$export$d5679492e2864181).set(state, errorMessageProps.id);
    let domProps = (0, $k0DcK$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    // Pass name prop from group to all items by attaching to the state.
    (0, $64fc3370e682155f$export$31440636951aa68c).set(state, name);
    return {
        groupProps: (0, $k0DcK$reactariautils.mergeProps)(domProps, {
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


function $07e03121d6ac83c8$export$353b32fc6898d37d(props, state, inputRef) {
    const toggleState = (0, $k0DcK$reactstatelytoggle.useToggleState)({
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isSelected: state.isSelected(props.value),
        onChange (isSelected) {
            if (isSelected) state.addValue(props.value);
            else state.removeValue(props.value);
            if (props.onChange) props.onChange(isSelected);
        }
    });
    let res = (0, $468c774d7db917b7$export$e375f10ce42261c5)({
        ...props,
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isDisabled: props.isDisabled || state.isDisabled,
        name: props.name || (0, $64fc3370e682155f$export$31440636951aa68c).get(state)
    }, toggleState, inputRef);
    return {
        ...res,
        inputProps: {
            ...res.inputProps,
            "aria-describedby": [
                state.validationState === "invalid" ? (0, $64fc3370e682155f$export$d5679492e2864181).get(state) : null,
                (0, $64fc3370e682155f$export$a3077e9c93f7360f).get(state)
            ].filter(Boolean).join(" ") || undefined
        }
    };
}




//# sourceMappingURL=main.js.map
