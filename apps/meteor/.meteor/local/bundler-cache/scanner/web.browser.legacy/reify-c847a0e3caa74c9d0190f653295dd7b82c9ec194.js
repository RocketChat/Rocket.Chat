var $aJE2N$reactstatelymenu = require("@react-stately/menu");
var $aJE2N$reactstatelylist = require("@react-stately/list");
var $aJE2N$react = require("react");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSelectState", () => $80ebb60e77198879$export$5159ec8b34d4ec12);
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


function $80ebb60e77198879$export$5159ec8b34d4ec12(props) {
    let triggerState = (0, $aJE2N$reactstatelymenu.useMenuTriggerState)(props);
    let listState = (0, $aJE2N$reactstatelylist.useSingleSelectListState)({
        ...props,
        onSelectionChange: (key)=>{
            if (props.onSelectionChange != null) props.onSelectionChange(key);
            triggerState.close();
        }
    });
    let [isFocused, setFocused] = (0, $aJE2N$react.useState)(false);
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




//# sourceMappingURL=main.js.map
