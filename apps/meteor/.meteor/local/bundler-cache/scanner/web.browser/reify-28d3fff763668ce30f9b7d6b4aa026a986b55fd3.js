module.export({useSelectState:()=>$2bc3a590c5373a4e$export$5159ec8b34d4ec12});let $e17gp$useMenuTriggerState;module.link("@react-stately/menu",{useMenuTriggerState(v){$e17gp$useMenuTriggerState=v}},0);let $e17gp$useSingleSelectListState;module.link("@react-stately/list",{useSingleSelectListState(v){$e17gp$useSingleSelectListState=v}},1);let $e17gp$useState;module.link("react",{useState(v){$e17gp$useState=v}},2);



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


function $2bc3a590c5373a4e$export$5159ec8b34d4ec12(props) {
    let triggerState = (0, $e17gp$useMenuTriggerState)(props);
    let listState = (0, $e17gp$useSingleSelectListState)({
        ...props,
        onSelectionChange: (key)=>{
            if (props.onSelectionChange != null) props.onSelectionChange(key);
            triggerState.close();
        }
    });
    let [isFocused, setFocused] = (0, $e17gp$useState)(false);
    return {
        ...listState,
        ...triggerState,
        open () {
            // Don't open if the collection is empty.
            if (listState.collection.size !== 0) triggerState.open();
        },
        toggle (focusStrategy) {
            if (listState.collection.size !== 0) triggerState.toggle(focusStrategy);
        },
        isFocused: isFocused,
        setFocused: setFocused
    };
}





//# sourceMappingURL=module.js.map
