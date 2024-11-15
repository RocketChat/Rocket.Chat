var $1cJu1$reactariaselection = require("@react-aria/selection");
var $1cJu1$reactariautils = require("@react-aria/utils");
var $1cJu1$reactariafocus = require("@react-aria/focus");
var $1cJu1$react = require("react");
var $1cJu1$reactariai18n = require("@react-aria/i18n");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTab", () => $4eeea1c984cc0628$export$fdf4756d5b8ef90a);
$parcel$export(module.exports, "useTabPanel", () => $8db1928b18472a1f$export$fae0121b5afe572d);
$parcel$export(module.exports, "useTabList", () => $f2b4a4926440e901$export$773e389e644c5874);
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
 */ const $a217ebca77471970$export$c5f62239608282b6 = new WeakMap();
function $a217ebca77471970$export$567fc7097e064344(state, key, role) {
    if (typeof key === "string") key = key.replace(/\s+/g, "");
    let baseId = $a217ebca77471970$export$c5f62239608282b6.get(state);
    return `${baseId}-${role}-${key}`;
}



function $4eeea1c984cc0628$export$fdf4756d5b8ef90a(props, state, ref) {
    let { key: key , isDisabled: propsDisabled  } = props;
    let { selectionManager: manager , selectedKey: selectedKey  } = state;
    let isSelected = key === selectedKey;
    let isDisabled = propsDisabled || state.isDisabled || state.disabledKeys.has(key);
    let { itemProps: itemProps , isPressed: isPressed  } = (0, $1cJu1$reactariaselection.useSelectableItem)({
        selectionManager: manager,
        key: key,
        ref: ref,
        isDisabled: isDisabled
    });
    let tabId = (0, $a217ebca77471970$export$567fc7097e064344)(state, key, "tab");
    let tabPanelId = (0, $a217ebca77471970$export$567fc7097e064344)(state, key, "tabpanel");
    let { tabIndex: tabIndex  } = itemProps;
    return {
        tabProps: {
            ...itemProps,
            id: tabId,
            "aria-selected": isSelected,
            "aria-disabled": isDisabled || undefined,
            "aria-controls": isSelected ? tabPanelId : undefined,
            tabIndex: isDisabled ? undefined : tabIndex,
            role: "tab"
        },
        isSelected: isSelected,
        isDisabled: isDisabled,
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


function $8db1928b18472a1f$export$fae0121b5afe572d(props, state, ref) {
    // The tabpanel should have tabIndex=0 when there are no tabbable elements within it.
    // Otherwise, tabbing from the focused tab should go directly to the first tabbable element
    // within the tabpanel.
    let tabIndex = (0, $1cJu1$reactariafocus.useHasTabbableChild)(ref) ? undefined : 0;
    const id = (0, $a217ebca77471970$export$567fc7097e064344)(state, state === null || state === void 0 ? void 0 : state.selectedKey, "tabpanel");
    const tabPanelProps = (0, $1cJu1$reactariautils.useLabels)({
        ...props,
        id: id,
        "aria-labelledby": (0, $a217ebca77471970$export$567fc7097e064344)(state, state === null || state === void 0 ? void 0 : state.selectedKey, "tab")
    });
    return {
        tabPanelProps: (0, $1cJu1$reactariautils.mergeProps)(tabPanelProps, {
            tabIndex: tabIndex,
            role: "tabpanel",
            "aria-describedby": props["aria-describedby"],
            "aria-details": props["aria-details"]
        })
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
 */ class $283e5d8830177ead$export$15010ca3c1abe90b {
    getKeyLeftOf(key) {
        if (this.flipDirection) return this.getNextKey(key);
        else {
            if (this.orientation === "horizontal") return this.getPreviousKey(key);
            return null;
        }
    }
    getKeyRightOf(key) {
        if (this.flipDirection) return this.getPreviousKey(key);
        else {
            if (this.orientation === "horizontal") return this.getNextKey(key);
            return null;
        }
    }
    getKeyAbove(key) {
        if (this.orientation === "vertical") return this.getPreviousKey(key);
        return null;
    }
    getKeyBelow(key) {
        if (this.orientation === "vertical") return this.getNextKey(key);
        return null;
    }
    getFirstKey() {
        let key = this.collection.getFirstKey();
        if (this.disabledKeys.has(key)) key = this.getNextKey(key);
        return key;
    }
    getLastKey() {
        let key = this.collection.getLastKey();
        if (this.disabledKeys.has(key)) key = this.getPreviousKey(key);
        return key;
    }
    getNextKey(key) {
        do {
            key = this.collection.getKeyAfter(key);
            if (key == null) key = this.collection.getFirstKey();
        }while (this.disabledKeys.has(key));
        return key;
    }
    getPreviousKey(key) {
        do {
            key = this.collection.getKeyBefore(key);
            if (key == null) key = this.collection.getLastKey();
        }while (this.disabledKeys.has(key));
        return key;
    }
    constructor(collection, direction, orientation, disabledKeys = new Set()){
        this.collection = collection;
        this.flipDirection = direction === "rtl" && orientation === "horizontal";
        this.orientation = orientation;
        this.disabledKeys = disabledKeys;
    }
}




function $f2b4a4926440e901$export$773e389e644c5874(props, state, ref) {
    let { orientation: orientation = "horizontal" , keyboardActivation: keyboardActivation = "automatic"  } = props;
    let { collection: collection , selectionManager: manager , disabledKeys: disabledKeys  } = state;
    let { direction: direction  } = (0, $1cJu1$reactariai18n.useLocale)();
    let delegate = (0, $1cJu1$react.useMemo)(()=>new (0, $283e5d8830177ead$export$15010ca3c1abe90b)(collection, direction, orientation, disabledKeys), [
        collection,
        disabledKeys,
        orientation,
        direction
    ]);
    let { collectionProps: collectionProps  } = (0, $1cJu1$reactariaselection.useSelectableCollection)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        selectOnFocus: keyboardActivation === "automatic",
        disallowEmptySelection: true,
        scrollRef: ref
    });
    // Compute base id for all tabs
    let tabsId = (0, $1cJu1$reactariautils.useId)();
    (0, $a217ebca77471970$export$c5f62239608282b6).set(state, tabsId);
    let tabListLabelProps = (0, $1cJu1$reactariautils.useLabels)({
        ...props,
        id: tabsId
    });
    return {
        tabListProps: {
            ...(0, $1cJu1$reactariautils.mergeProps)(collectionProps, tabListLabelProps),
            role: "tablist",
            "aria-orientation": orientation,
            tabIndex: undefined
        }
    };
}




//# sourceMappingURL=main.js.map
