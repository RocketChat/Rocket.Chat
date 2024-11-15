module.export({useSwitch:()=>$b418ec0c85c52f27$export$d853f7095ae95f88});let $7KNc0$useToggle;module.link("@react-aria/toggle",{useToggle(v){$7KNc0$useToggle=v}},0);

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
function $b418ec0c85c52f27$export$d853f7095ae95f88(props, state, ref) {
    let { inputProps: inputProps , isSelected: isSelected , isPressed: isPressed , isDisabled: isDisabled , isReadOnly: isReadOnly  } = (0, $7KNc0$useToggle)(props, state, ref);
    return {
        inputProps: {
            ...inputProps,
            role: "switch",
            checked: isSelected
        },
        isSelected: isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly
    };
}





//# sourceMappingURL=module.js.map
