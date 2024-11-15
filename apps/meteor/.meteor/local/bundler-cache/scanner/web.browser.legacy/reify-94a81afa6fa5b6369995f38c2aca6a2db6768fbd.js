var $7iSyh$reactstatelylist = require("@react-stately/list");
var $7iSyh$react = require("react");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTabListState", () => $817f925d289daf81$export$4ba071daf4e486);
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

function $817f925d289daf81$export$4ba071daf4e486(props) {
    let state = (0, $7iSyh$reactstatelylist.useSingleSelectListState)({
        ...props,
        suppressTextValueWarning: true
    });
    let { selectionManager: selectionManager , collection: collection , selectedKey: currentSelectedKey  } = state;
    let lastSelectedKey = (0, $7iSyh$react.useRef)(currentSelectedKey);
    // Ensure a tab is always selected (in case no selected key was specified or if selected item was deleted from collection)
    let selectedKey = currentSelectedKey;
    if (selectionManager.isEmpty || !collection.getItem(selectedKey)) {
        selectedKey = collection.getFirstKey();
        // loop over tabs until we find one that isn't disabled and select that
        while(state.disabledKeys.has(selectedKey) && selectedKey !== collection.getLastKey())selectedKey = collection.getKeyAfter(selectedKey);
        // if this check is true, then every item is disabled, it makes more sense to default to the first key than the last
        if (state.disabledKeys.has(selectedKey) && selectedKey === collection.getLastKey()) selectedKey = collection.getFirstKey();
        if (selectedKey != null) // directly set selection because replace/toggle selection won't consider disabled keys
        selectionManager.setSelectedKeys([
            selectedKey
        ]);
    }
    // If the tablist doesn't have focus and the selected key changes or if there isn't a focused key yet, change focused key to the selected key if it exists.
    if (selectedKey != null && selectionManager.focusedKey == null || !selectionManager.isFocused && selectedKey !== lastSelectedKey.current) selectionManager.setFocusedKey(selectedKey);
    lastSelectedKey.current = selectedKey;
    return {
        ...state,
        isDisabled: props.isDisabled || false
    };
}




//# sourceMappingURL=main.js.map
