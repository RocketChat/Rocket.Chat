module.export({useTab:()=>$0175d55c2a017ebc$export$fdf4756d5b8ef90a,useTabPanel:()=>$34bce698202e07cb$export$fae0121b5afe572d,useTabList:()=>$58d314389b21fa3f$export$773e389e644c5874});let $8kq0t$useSelectableItem,$8kq0t$useSelectableCollection;module.link("@react-aria/selection",{useSelectableItem(v){$8kq0t$useSelectableItem=v},useSelectableCollection(v){$8kq0t$useSelectableCollection=v}},0);let $8kq0t$useLabels,$8kq0t$mergeProps,$8kq0t$useId;module.link("@react-aria/utils",{useLabels(v){$8kq0t$useLabels=v},mergeProps(v){$8kq0t$mergeProps=v},useId(v){$8kq0t$useId=v}},1);let $8kq0t$useHasTabbableChild;module.link("@react-aria/focus",{useHasTabbableChild(v){$8kq0t$useHasTabbableChild=v}},2);let $8kq0t$useMemo;module.link("react",{useMemo(v){$8kq0t$useMemo=v}},3);let $8kq0t$useLocale;module.link("@react-aria/i18n",{useLocale(v){$8kq0t$useLocale=v}},4);





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
 */ const $99b62ae3ff97ec45$export$c5f62239608282b6 = new WeakMap();
function $99b62ae3ff97ec45$export$567fc7097e064344(state, key, role) {
    if (typeof key === "string") key = key.replace(/\s+/g, "");
    let baseId = $99b62ae3ff97ec45$export$c5f62239608282b6.get(state);
    return `${baseId}-${role}-${key}`;
}



function $0175d55c2a017ebc$export$fdf4756d5b8ef90a(props, state, ref) {
    let { key: key , isDisabled: propsDisabled  } = props;
    let { selectionManager: manager , selectedKey: selectedKey  } = state;
    let isSelected = key === selectedKey;
    let isDisabled = propsDisabled || state.isDisabled || state.disabledKeys.has(key);
    let { itemProps: itemProps , isPressed: isPressed  } = (0, $8kq0t$useSelectableItem)({
        selectionManager: manager,
        key: key,
        ref: ref,
        isDisabled: isDisabled
    });
    let tabId = (0, $99b62ae3ff97ec45$export$567fc7097e064344)(state, key, "tab");
    let tabPanelId = (0, $99b62ae3ff97ec45$export$567fc7097e064344)(state, key, "tabpanel");
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


function $34bce698202e07cb$export$fae0121b5afe572d(props, state, ref) {
    // The tabpanel should have tabIndex=0 when there are no tabbable elements within it.
    // Otherwise, tabbing from the focused tab should go directly to the first tabbable element
    // within the tabpanel.
    let tabIndex = (0, $8kq0t$useHasTabbableChild)(ref) ? undefined : 0;
    const id = (0, $99b62ae3ff97ec45$export$567fc7097e064344)(state, state === null || state === void 0 ? void 0 : state.selectedKey, "tabpanel");
    const tabPanelProps = (0, $8kq0t$useLabels)({
        ...props,
        id: id,
        "aria-labelledby": (0, $99b62ae3ff97ec45$export$567fc7097e064344)(state, state === null || state === void 0 ? void 0 : state.selectedKey, "tab")
    });
    return {
        tabPanelProps: (0, $8kq0t$mergeProps)(tabPanelProps, {
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
 */ class $bfc6f2d60b8a4c40$export$15010ca3c1abe90b {
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




function $58d314389b21fa3f$export$773e389e644c5874(props, state, ref) {
    let { orientation: orientation = "horizontal" , keyboardActivation: keyboardActivation = "automatic"  } = props;
    let { collection: collection , selectionManager: manager , disabledKeys: disabledKeys  } = state;
    let { direction: direction  } = (0, $8kq0t$useLocale)();
    let delegate = (0, $8kq0t$useMemo)(()=>new (0, $bfc6f2d60b8a4c40$export$15010ca3c1abe90b)(collection, direction, orientation, disabledKeys), [
        collection,
        disabledKeys,
        orientation,
        direction
    ]);
    let { collectionProps: collectionProps  } = (0, $8kq0t$useSelectableCollection)({
        ref: ref,
        selectionManager: manager,
        keyboardDelegate: delegate,
        selectOnFocus: keyboardActivation === "automatic",
        disallowEmptySelection: true,
        scrollRef: ref
    });
    // Compute base id for all tabs
    let tabsId = (0, $8kq0t$useId)();
    (0, $99b62ae3ff97ec45$export$c5f62239608282b6).set(state, tabsId);
    let tabListLabelProps = (0, $8kq0t$useLabels)({
        ...props,
        id: tabsId
    });
    return {
        tabListProps: {
            ...(0, $8kq0t$mergeProps)(collectionProps, tabListLabelProps),
            role: "tablist",
            "aria-orientation": orientation,
            tabIndex: undefined
        }
    };
}





//# sourceMappingURL=module.js.map
