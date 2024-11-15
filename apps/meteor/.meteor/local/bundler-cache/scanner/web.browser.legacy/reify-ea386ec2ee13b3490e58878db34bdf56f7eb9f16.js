var $83d9f$react = require("react");
var $83d9f$reactstatelyutils = require("@react-stately/utils");
var $83d9f$reactstatelycollections = require("@react-stately/collections");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useMultipleSelectionState", () => $1adc19da2128bba9$export$253fe78d46329472);
$parcel$export(module.exports, "SelectionManager", () => $8112da6fa5bbc322$export$6c8a5aaad13c9852);
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
 */ class $21c847070f1f9569$export$52baac22726c72bf extends Set {
    constructor(keys, anchorKey, currentKey){
        super(keys);
        if (keys instanceof $21c847070f1f9569$export$52baac22726c72bf) {
            this.anchorKey = anchorKey || keys.anchorKey;
            this.currentKey = currentKey || keys.currentKey;
        } else {
            this.anchorKey = anchorKey;
            this.currentKey = currentKey;
        }
    }
}



function $1adc19da2128bba9$var$equalSets(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (let item of setA){
        if (!setB.has(item)) return false;
    }
    return true;
}
function $1adc19da2128bba9$export$253fe78d46329472(props) {
    let { selectionMode: selectionMode = "none" , disallowEmptySelection: disallowEmptySelection , allowDuplicateSelectionEvents: allowDuplicateSelectionEvents , selectionBehavior: selectionBehaviorProp = "toggle" , disabledBehavior: disabledBehavior = "all"  } = props;
    // We want synchronous updates to `isFocused` and `focusedKey` after their setters are called.
    // But we also need to trigger a react re-render. So, we have both a ref (sync) and state (async).
    let isFocusedRef = (0, $83d9f$react.useRef)(false);
    let [, setFocused] = (0, $83d9f$react.useState)(false);
    let focusedKeyRef = (0, $83d9f$react.useRef)(null);
    let childFocusStrategyRef = (0, $83d9f$react.useRef)(null);
    let [, setFocusedKey] = (0, $83d9f$react.useState)(null);
    let selectedKeysProp = (0, $83d9f$react.useMemo)(()=>$1adc19da2128bba9$var$convertSelection(props.selectedKeys), [
        props.selectedKeys
    ]);
    let defaultSelectedKeys = (0, $83d9f$react.useMemo)(()=>$1adc19da2128bba9$var$convertSelection(props.defaultSelectedKeys, new (0, $21c847070f1f9569$export$52baac22726c72bf)()), [
        props.defaultSelectedKeys
    ]);
    let [selectedKeys, setSelectedKeys] = (0, $83d9f$reactstatelyutils.useControlledState)(selectedKeysProp, defaultSelectedKeys, props.onSelectionChange);
    let disabledKeysProp = (0, $83d9f$react.useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let [selectionBehavior, setSelectionBehavior] = (0, $83d9f$react.useState)(selectionBehaviorProp);
    // If the selectionBehavior prop is set to replace, but the current state is toggle (e.g. due to long press
    // to enter selection mode on touch), and the selection becomes empty, reset the selection behavior.
    if (selectionBehaviorProp === "replace" && selectionBehavior === "toggle" && typeof selectedKeys === "object" && selectedKeys.size === 0) setSelectionBehavior("replace");
    // If the selectionBehavior prop changes, update the state as well.
    let lastSelectionBehavior = (0, $83d9f$react.useRef)(selectionBehaviorProp);
    (0, $83d9f$react.useEffect)(()=>{
        if (selectionBehaviorProp !== lastSelectionBehavior.current) {
            setSelectionBehavior(selectionBehaviorProp);
            lastSelectionBehavior.current = selectionBehaviorProp;
        }
    }, [
        selectionBehaviorProp
    ]);
    return {
        selectionMode: selectionMode,
        disallowEmptySelection: disallowEmptySelection,
        selectionBehavior: selectionBehavior,
        setSelectionBehavior: setSelectionBehavior,
        get isFocused () {
            return isFocusedRef.current;
        },
        setFocused (f) {
            isFocusedRef.current = f;
            setFocused(f);
        },
        get focusedKey () {
            return focusedKeyRef.current;
        },
        get childFocusStrategy () {
            return childFocusStrategyRef.current;
        },
        setFocusedKey (k, childFocusStrategy = "first") {
            focusedKeyRef.current = k;
            childFocusStrategyRef.current = childFocusStrategy;
            setFocusedKey(k);
        },
        selectedKeys: selectedKeys,
        setSelectedKeys (keys) {
            if (allowDuplicateSelectionEvents || !$1adc19da2128bba9$var$equalSets(keys, selectedKeys)) setSelectedKeys(keys);
        },
        disabledKeys: disabledKeysProp,
        disabledBehavior: disabledBehavior
    };
}
function $1adc19da2128bba9$var$convertSelection(selection, defaultValue) {
    if (!selection) return defaultValue;
    return selection === "all" ? "all" : new (0, $21c847070f1f9569$export$52baac22726c72bf)(selection);
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

class $8112da6fa5bbc322$export$6c8a5aaad13c9852 {
    /**
   * The type of selection that is allowed in the collection.
   */ get selectionMode() {
        return this.state.selectionMode;
    }
    /**
   * Whether the collection allows empty selection.
   */ get disallowEmptySelection() {
        return this.state.disallowEmptySelection;
    }
    /**
   * The selection behavior for the collection.
   */ get selectionBehavior() {
        return this.state.selectionBehavior;
    }
    /**
   * Sets the selection behavior for the collection.
   */ setSelectionBehavior(selectionBehavior) {
        this.state.setSelectionBehavior(selectionBehavior);
    }
    /**
   * Whether the collection is currently focused.
   */ get isFocused() {
        return this.state.isFocused;
    }
    /**
   * Sets whether the collection is focused.
   */ setFocused(isFocused) {
        this.state.setFocused(isFocused);
    }
    /**
   * The current focused key in the collection.
   */ get focusedKey() {
        return this.state.focusedKey;
    }
    /** Whether the first or last child of the focused key should receive focus. */ get childFocusStrategy() {
        return this.state.childFocusStrategy;
    }
    /**
   * Sets the focused key.
   */ setFocusedKey(key, childFocusStrategy) {
        if (key == null || this.collection.getItem(key)) this.state.setFocusedKey(key, childFocusStrategy);
    }
    /**
   * The currently selected keys in the collection.
   */ get selectedKeys() {
        return this.state.selectedKeys === "all" ? new Set(this.getSelectAllKeys()) : this.state.selectedKeys;
    }
    /**
   * The raw selection value for the collection.
   * Either 'all' for select all, or a set of keys.
   */ get rawSelection() {
        return this.state.selectedKeys;
    }
    /**
   * Returns whether a key is selected.
   */ isSelected(key) {
        if (this.state.selectionMode === "none") return false;
        key = this.getKey(key);
        return this.state.selectedKeys === "all" ? this.canSelectItem(key) : this.state.selectedKeys.has(key);
    }
    /**
   * Whether the selection is empty.
   */ get isEmpty() {
        return this.state.selectedKeys !== "all" && this.state.selectedKeys.size === 0;
    }
    /**
   * Whether all items in the collection are selected.
   */ get isSelectAll() {
        if (this.isEmpty) return false;
        if (this.state.selectedKeys === "all") return true;
        if (this._isSelectAll != null) return this._isSelectAll;
        let allKeys = this.getSelectAllKeys();
        let selectedKeys = this.state.selectedKeys;
        this._isSelectAll = allKeys.every((k)=>selectedKeys.has(k));
        return this._isSelectAll;
    }
    get firstSelectedKey() {
        let first = null;
        for (let key of this.state.selectedKeys){
            let item = this.collection.getItem(key);
            if (!first || item && (0, $83d9f$reactstatelycollections.compareNodeOrder)(this.collection, item, first) < 0) first = item;
        }
        return first === null || first === void 0 ? void 0 : first.key;
    }
    get lastSelectedKey() {
        let last = null;
        for (let key of this.state.selectedKeys){
            let item = this.collection.getItem(key);
            if (!last || item && (0, $83d9f$reactstatelycollections.compareNodeOrder)(this.collection, item, last) > 0) last = item;
        }
        return last === null || last === void 0 ? void 0 : last.key;
    }
    get disabledKeys() {
        return this.state.disabledKeys;
    }
    get disabledBehavior() {
        return this.state.disabledBehavior;
    }
    /**
   * Extends the selection to the given key.
   */ extendSelection(toKey) {
        if (this.selectionMode === "none") return;
        if (this.selectionMode === "single") {
            this.replaceSelection(toKey);
            return;
        }
        toKey = this.getKey(toKey);
        let selection;
        // Only select the one key if coming from a select all.
        if (this.state.selectedKeys === "all") selection = new (0, $21c847070f1f9569$export$52baac22726c72bf)([
            toKey
        ], toKey, toKey);
        else {
            let selectedKeys = this.state.selectedKeys;
            let anchorKey = selectedKeys.anchorKey || toKey;
            selection = new (0, $21c847070f1f9569$export$52baac22726c72bf)(selectedKeys, anchorKey, toKey);
            for (let key of this.getKeyRange(anchorKey, selectedKeys.currentKey || toKey))selection.delete(key);
            for (let key1 of this.getKeyRange(toKey, anchorKey))if (this.canSelectItem(key1)) selection.add(key1);
        }
        this.state.setSelectedKeys(selection);
    }
    getKeyRange(from, to) {
        let fromItem = this.collection.getItem(from);
        let toItem = this.collection.getItem(to);
        if (fromItem && toItem) {
            if ((0, $83d9f$reactstatelycollections.compareNodeOrder)(this.collection, fromItem, toItem) <= 0) return this.getKeyRangeInternal(from, to);
            return this.getKeyRangeInternal(to, from);
        }
        return [];
    }
    getKeyRangeInternal(from, to) {
        let keys = [];
        let key = from;
        while(key){
            let item = this.collection.getItem(key);
            if (item && item.type === "item" || item.type === "cell" && this.allowsCellSelection) keys.push(key);
            if (key === to) return keys;
            key = this.collection.getKeyAfter(key);
        }
        return [];
    }
    getKey(key) {
        let item = this.collection.getItem(key);
        if (!item) // ¯\_(ツ)_/¯
        return key;
        // If cell selection is allowed, just return the key.
        if (item.type === "cell" && this.allowsCellSelection) return key;
        // Find a parent item to select
        while(item.type !== "item" && item.parentKey != null)item = this.collection.getItem(item.parentKey);
        if (!item || item.type !== "item") return null;
        return item.key;
    }
    /**
   * Toggles whether the given key is selected.
   */ toggleSelection(key) {
        if (this.selectionMode === "none") return;
        if (this.selectionMode === "single" && !this.isSelected(key)) {
            this.replaceSelection(key);
            return;
        }
        key = this.getKey(key);
        if (key == null) return;
        let keys = new (0, $21c847070f1f9569$export$52baac22726c72bf)(this.state.selectedKeys === "all" ? this.getSelectAllKeys() : this.state.selectedKeys);
        if (keys.has(key)) keys.delete(key);
        else if (this.canSelectItem(key)) {
            keys.add(key);
            keys.anchorKey = key;
            keys.currentKey = key;
        }
        if (this.disallowEmptySelection && keys.size === 0) return;
        this.state.setSelectedKeys(keys);
    }
    /**
   * Replaces the selection with only the given key.
   */ replaceSelection(key) {
        if (this.selectionMode === "none") return;
        key = this.getKey(key);
        if (key == null) return;
        let selection = this.canSelectItem(key) ? new (0, $21c847070f1f9569$export$52baac22726c72bf)([
            key
        ], key, key) : new (0, $21c847070f1f9569$export$52baac22726c72bf)();
        this.state.setSelectedKeys(selection);
    }
    /**
   * Replaces the selection with the given keys.
   */ setSelectedKeys(keys) {
        if (this.selectionMode === "none") return;
        let selection = new (0, $21c847070f1f9569$export$52baac22726c72bf)();
        for (let key of keys){
            key = this.getKey(key);
            if (key != null) {
                selection.add(key);
                if (this.selectionMode === "single") break;
            }
        }
        this.state.setSelectedKeys(selection);
    }
    getSelectAllKeys() {
        let keys = [];
        let addKeys = (key)=>{
            while(key){
                if (this.canSelectItem(key)) {
                    let item = this.collection.getItem(key);
                    if (item.type === "item") keys.push(key);
                    // Add child keys. If cell selection is allowed, then include item children too.
                    if (item.hasChildNodes && (this.allowsCellSelection || item.type !== "item")) addKeys((0, $83d9f$reactstatelycollections.getFirstItem)((0, $83d9f$reactstatelycollections.getChildNodes)(item, this.collection)).key);
                }
                key = this.collection.getKeyAfter(key);
            }
        };
        addKeys(this.collection.getFirstKey());
        return keys;
    }
    /**
   * Selects all items in the collection.
   */ selectAll() {
        if (this.selectionMode === "multiple") this.state.setSelectedKeys("all");
    }
    /**
   * Removes all keys from the selection.
   */ clearSelection() {
        if (!this.disallowEmptySelection && (this.state.selectedKeys === "all" || this.state.selectedKeys.size > 0)) this.state.setSelectedKeys(new (0, $21c847070f1f9569$export$52baac22726c72bf)());
    }
    /**
   * Toggles between select all and an empty selection.
   */ toggleSelectAll() {
        if (this.isSelectAll) this.clearSelection();
        else this.selectAll();
    }
    select(key, e) {
        if (this.selectionMode === "none") return;
        if (this.selectionMode === "single") {
            if (this.isSelected(key) && !this.disallowEmptySelection) this.toggleSelection(key);
            else this.replaceSelection(key);
        } else if (this.selectionBehavior === "toggle" || e && (e.pointerType === "touch" || e.pointerType === "virtual")) // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
        this.toggleSelection(key);
        else this.replaceSelection(key);
    }
    /**
   * Returns whether the current selection is equal to the given selection.
   */ isSelectionEqual(selection) {
        if (selection === this.state.selectedKeys) return true;
        // Check if the set of keys match.
        let selectedKeys = this.selectedKeys;
        if (selection.size !== selectedKeys.size) return false;
        for (let key of selection){
            if (!selectedKeys.has(key)) return false;
        }
        for (let key1 of selectedKeys){
            if (!selection.has(key1)) return false;
        }
        return true;
    }
    canSelectItem(key) {
        if (this.state.selectionMode === "none" || this.state.disabledKeys.has(key)) return false;
        let item = this.collection.getItem(key);
        if (!item || item.type === "cell" && !this.allowsCellSelection) return false;
        return true;
    }
    isDisabled(key) {
        return this.state.disabledKeys.has(key) && this.state.disabledBehavior === "all";
    }
    constructor(collection, state, options){
        this.collection = collection;
        this.state = state;
        var _options_allowsCellSelection;
        this.allowsCellSelection = (_options_allowsCellSelection = options === null || options === void 0 ? void 0 : options.allowsCellSelection) !== null && _options_allowsCellSelection !== void 0 ? _options_allowsCellSelection : false;
        this._isSelectAll = null;
    }
}




//# sourceMappingURL=main.js.map
