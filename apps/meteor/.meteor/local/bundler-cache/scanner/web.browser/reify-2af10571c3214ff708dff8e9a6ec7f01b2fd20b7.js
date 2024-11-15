module.export({useRadioGroupState:()=>$a54cdc5c1942b639$export$bca9d026f8e704eb});let $fQ2SF$useControlledState;module.link("@react-stately/utils",{useControlledState(v){$fQ2SF$useControlledState=v}},0);let $fQ2SF$useMemo,$fQ2SF$useState;module.link("react",{useMemo(v){$fQ2SF$useMemo=v},useState(v){$fQ2SF$useState=v}},1);


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

let $a54cdc5c1942b639$var$instance = Math.round(Math.random() * 10000000000);
let $a54cdc5c1942b639$var$i = 0;
function $a54cdc5c1942b639$export$bca9d026f8e704eb(props) {
    // Preserved here for backward compatibility. React Aria now generates the name instead of stately.
    let name = (0, $fQ2SF$useMemo)(()=>props.name || `radio-group-${$a54cdc5c1942b639$var$instance}-${++$a54cdc5c1942b639$var$i}`, [
        props.name
    ]);
    let [selectedValue, setSelected] = (0, $fQ2SF$useControlledState)(props.value, props.defaultValue, props.onChange);
    let [lastFocusedValue, setLastFocusedValue] = (0, $fQ2SF$useState)(null);
    let setSelectedValue = (value)=>{
        if (!props.isReadOnly && !props.isDisabled) setSelected(value);
    };
    return {
        name: name,
        selectedValue: selectedValue,
        setSelectedValue: setSelectedValue,
        lastFocusedValue: lastFocusedValue,
        setLastFocusedValue: setLastFocusedValue,
        isDisabled: props.isDisabled || false,
        isReadOnly: props.isReadOnly || false,
        isRequired: props.isRequired || false,
        validationState: props.validationState || null
    };
}





//# sourceMappingURL=module.js.map
