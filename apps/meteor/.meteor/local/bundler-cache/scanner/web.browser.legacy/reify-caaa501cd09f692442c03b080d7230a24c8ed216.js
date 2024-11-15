var $5XAuq$reactstatelycollections = require("@react-stately/collections");
var $5XAuq$reactstatelylist = require("@react-stately/list");
var $5XAuq$react = require("react");
var $5XAuq$reactstatelyutils = require("@react-stately/utils");
var $5XAuq$reactstatelymenu = require("@react-stately/menu");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useComboBoxState", () => $e563f9c9469ad14c$export$b453a3bfd4a5fa9e);
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




function $e563f9c9469ad14c$export$b453a3bfd4a5fa9e(props) {
    var _collection_getItem;
    let { defaultFilter: defaultFilter , menuTrigger: menuTrigger = "input" , allowsEmptyCollection: allowsEmptyCollection = false , allowsCustomValue: allowsCustomValue , shouldCloseOnBlur: shouldCloseOnBlur = true  } = props;
    let [showAllItems, setShowAllItems] = (0, $5XAuq$react.useState)(false);
    let [isFocused, setFocusedState] = (0, $5XAuq$react.useState)(false);
    var _props_defaultInputValue;
    let [inputValue, setInputValue] = (0, $5XAuq$reactstatelyutils.useControlledState)(props.inputValue, (_props_defaultInputValue = props.defaultInputValue) !== null && _props_defaultInputValue !== void 0 ? _props_defaultInputValue : "", props.onInputChange);
    let onSelectionChange = (key)=>{
        if (props.onSelectionChange) props.onSelectionChange(key);
        // If key is the same, reset the inputValue and close the menu
        // (scenario: user clicks on already selected option)
        if (key === selectedKey) {
            resetInputValue();
            closeMenu();
        }
    };
    var _props_items;
    let { collection: collection , selectionManager: selectionManager , selectedKey: selectedKey , setSelectedKey: setSelectedKey , selectedItem: selectedItem , disabledKeys: disabledKeys  } = (0, $5XAuq$reactstatelylist.useSingleSelectListState)({
        ...props,
        onSelectionChange: onSelectionChange,
        items: (_props_items = props.items) !== null && _props_items !== void 0 ? _props_items : props.defaultItems
    });
    // Preserve original collection so we can show all items on demand
    let originalCollection = collection;
    let filteredCollection = (0, $5XAuq$react.useMemo)(()=>// No default filter if items are controlled.
        props.items != null || !defaultFilter ? collection : $e563f9c9469ad14c$var$filterCollection(collection, inputValue, defaultFilter), [
        collection,
        inputValue,
        defaultFilter,
        props.items
    ]);
    let [lastCollection, setLastCollection] = (0, $5XAuq$react.useState)(filteredCollection);
    // Track what action is attempting to open the menu
    let menuOpenTrigger = (0, $5XAuq$react.useRef)("focus");
    let onOpenChange = (open)=>{
        if (props.onOpenChange) props.onOpenChange(open, open ? menuOpenTrigger.current : undefined);
        selectionManager.setFocused(open);
        if (!open) selectionManager.setFocusedKey(null);
    };
    let triggerState = (0, $5XAuq$reactstatelymenu.useMenuTriggerState)({
        ...props,
        onOpenChange: onOpenChange,
        isOpen: undefined,
        defaultOpen: undefined
    });
    let open = (focusStrategy, trigger)=>{
        let displayAllItems = trigger === "manual" || trigger === "focus" && menuTrigger === "focus";
        // Prevent open operations from triggering if there is nothing to display
        // Also prevent open operations from triggering if items are uncontrolled but defaultItems is empty, even if displayAllItems is true.
        // This is to prevent comboboxes with empty defaultItems from opening but allow controlled items comboboxes to open even if the inital list is empty (assumption is user will provide swap the empty list with a base list via onOpenChange returning `menuTrigger` manual)
        if (allowsEmptyCollection || filteredCollection.size > 0 || displayAllItems && originalCollection.size > 0 || props.items) {
            if (displayAllItems && !triggerState.isOpen && props.items === undefined) // Show all items if menu is manually opened. Only care about this if items are undefined
            setShowAllItems(true);
            menuOpenTrigger.current = trigger;
            triggerState.open(focusStrategy);
        }
    };
    let toggle = (focusStrategy, trigger)=>{
        let displayAllItems = trigger === "manual" || trigger === "focus" && menuTrigger === "focus";
        // If the menu is closed and there is nothing to display, early return so toggle isn't called to prevent extraneous onOpenChange
        if (!(allowsEmptyCollection || filteredCollection.size > 0 || displayAllItems && originalCollection.size > 0 || props.items) && !triggerState.isOpen) return;
        if (displayAllItems && !triggerState.isOpen && props.items === undefined) // Show all items if menu is toggled open. Only care about this if items are undefined
        setShowAllItems(true);
        // Only update the menuOpenTrigger if menu is currently closed
        if (!triggerState.isOpen) menuOpenTrigger.current = trigger;
        toggleMenu(focusStrategy);
    };
    // If menu is going to close, save the current collection so we can freeze the displayed collection when the
    // user clicks outside the popover to close the menu. Prevents the menu contents from updating as the menu closes.
    let toggleMenu = (0, $5XAuq$react.useCallback)((focusStrategy)=>{
        if (triggerState.isOpen) setLastCollection(filteredCollection);
        triggerState.toggle(focusStrategy);
    }, [
        triggerState,
        filteredCollection
    ]);
    let closeMenu = (0, $5XAuq$react.useCallback)(()=>{
        if (triggerState.isOpen) {
            setLastCollection(filteredCollection);
            triggerState.close();
        }
    }, [
        triggerState,
        filteredCollection
    ]);
    let lastValue = (0, $5XAuq$react.useRef)(inputValue);
    let resetInputValue = ()=>{
        var _collection_getItem;
        var _collection_getItem_textValue;
        let itemText = (_collection_getItem_textValue = (_collection_getItem = collection.getItem(selectedKey)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _collection_getItem_textValue !== void 0 ? _collection_getItem_textValue : "";
        lastValue.current = itemText;
        setInputValue(itemText);
    };
    let isInitialRender = (0, $5XAuq$react.useRef)(true);
    var _props_selectedKey, _ref;
    let lastSelectedKey = (0, $5XAuq$react.useRef)((_ref = (_props_selectedKey = props.selectedKey) !== null && _props_selectedKey !== void 0 ? _props_selectedKey : props.defaultSelectedKey) !== null && _ref !== void 0 ? _ref : null);
    var _collection_getItem_textValue;
    let lastSelectedKeyText = (0, $5XAuq$react.useRef)((_collection_getItem_textValue = (_collection_getItem = collection.getItem(selectedKey)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _collection_getItem_textValue !== void 0 ? _collection_getItem_textValue : "");
    // intentional omit dependency array, want this to happen on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $5XAuq$react.useEffect)(()=>{
        var _collection_getItem;
        // Open and close menu automatically when the input value changes if the input is focused,
        // and there are items in the collection or allowEmptyCollection is true.
        if (isFocused && (filteredCollection.size > 0 || allowsEmptyCollection) && !triggerState.isOpen && inputValue !== lastValue.current && menuTrigger !== "manual") open(null, "input");
        // Close the menu if the collection is empty. Don't close menu if filtered collection size is 0
        // but we are currently showing all items via button press
        if (!showAllItems && !allowsEmptyCollection && triggerState.isOpen && filteredCollection.size === 0) closeMenu();
        // Close when an item is selected.
        if (selectedKey != null && selectedKey !== lastSelectedKey.current) closeMenu();
        // Clear focused key when input value changes and display filtered collection again.
        if (inputValue !== lastValue.current) {
            selectionManager.setFocusedKey(null);
            setShowAllItems(false);
            // Set selectedKey to null when the user clears the input.
            // If controlled, this is the application developer's responsibility.
            if (inputValue === "" && (props.inputValue === undefined || props.selectedKey === undefined)) setSelectedKey(null);
        }
        // If it is the intial render and inputValue isn't controlled nor has an intial value, set input to match current selected key if any
        if (isInitialRender.current && props.inputValue === undefined && props.defaultInputValue === undefined) resetInputValue();
        // If the selectedKey changed, update the input value.
        // Do nothing if both inputValue and selectedKey are controlled.
        // In this case, it's the user's responsibility to update inputValue in onSelectionChange.
        if (selectedKey !== lastSelectedKey.current && (props.inputValue === undefined || props.selectedKey === undefined)) resetInputValue();
        else lastValue.current = inputValue;
        var _collection_getItem_textValue;
        // Update the inputValue if the selected item's text changes from its last tracked value.
        // This is to handle cases where a selectedKey is specified but the items aren't available (async loading) or the selected item's text value updates.
        // Only reset if the user isn't currently within the field so we don't erroneously modify user input.
        // If inputValue is controlled, it is the user's responsibility to update the inputValue when items change.
        let selectedItemText = (_collection_getItem_textValue = (_collection_getItem = collection.getItem(selectedKey)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _collection_getItem_textValue !== void 0 ? _collection_getItem_textValue : "";
        if (!isFocused && selectedKey != null && props.inputValue === undefined && selectedKey === lastSelectedKey.current) {
            if (lastSelectedKeyText.current !== selectedItemText) {
                lastValue.current = selectedItemText;
                setInputValue(selectedItemText);
            }
        }
        isInitialRender.current = false;
        lastSelectedKey.current = selectedKey;
        lastSelectedKeyText.current = selectedItemText;
    });
    // Revert input value and close menu
    let revert = ()=>{
        if (allowsCustomValue && selectedKey == null) commitCustomValue();
        else commitSelection();
    };
    let commitCustomValue = ()=>{
        lastSelectedKey.current = null;
        setSelectedKey(null);
        closeMenu();
    };
    let commitSelection = ()=>{
        // If multiple things are controlled, call onSelectionChange
        if (props.selectedKey !== undefined && props.inputValue !== undefined) {
            var _collection_getItem;
            props.onSelectionChange(selectedKey);
            var _collection_getItem_textValue;
            // Stop menu from reopening from useEffect
            let itemText = (_collection_getItem_textValue = (_collection_getItem = collection.getItem(selectedKey)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _collection_getItem_textValue !== void 0 ? _collection_getItem_textValue : "";
            lastValue.current = itemText;
            closeMenu();
        } else {
            // If only a single aspect of combobox is controlled, reset input value and close menu for the user
            resetInputValue();
            closeMenu();
        }
    };
    let commit = ()=>{
        if (triggerState.isOpen && selectionManager.focusedKey != null) {
            // Reset inputValue and close menu here if the selected key is already the focused key. Otherwise
            // fire onSelectionChange to allow the application to control the closing.
            if (selectedKey === selectionManager.focusedKey) commitSelection();
            else setSelectedKey(selectionManager.focusedKey);
        } else if (allowsCustomValue) commitCustomValue();
        else // Reset inputValue and close menu if no item is focused but user triggers a commit
        commitSelection();
    };
    let close = ()=>{
        var _collection_getItem;
        var _collection_getItem_textValue;
        let itemText = (_collection_getItem_textValue = (_collection_getItem = collection.getItem(selectedKey)) === null || _collection_getItem === void 0 ? void 0 : _collection_getItem.textValue) !== null && _collection_getItem_textValue !== void 0 ? _collection_getItem_textValue : "";
        if (allowsCustomValue && inputValue !== itemText) commitCustomValue();
        else commitSelection();
        closeMenu();
    };
    let setFocused = (isFocused)=>{
        if (isFocused) {
            if (menuTrigger === "focus") open(null, "focus");
        } else if (shouldCloseOnBlur) close();
        setFocusedState(isFocused);
    };
    let displayedCollection = (0, $5XAuq$react.useMemo)(()=>{
        if (triggerState.isOpen) {
            if (showAllItems) return originalCollection;
            else return filteredCollection;
        } else return lastCollection;
    }, [
        triggerState.isOpen,
        originalCollection,
        filteredCollection,
        showAllItems,
        lastCollection
    ]);
    return {
        ...triggerState,
        toggle: toggle,
        open: open,
        close: close,
        selectionManager: selectionManager,
        selectedKey: selectedKey,
        setSelectedKey: setSelectedKey,
        disabledKeys: disabledKeys,
        isFocused: isFocused,
        setFocused: setFocused,
        selectedItem: selectedItem,
        collection: displayedCollection,
        inputValue: inputValue,
        setInputValue: setInputValue,
        commit: commit,
        revert: revert
    };
}
function $e563f9c9469ad14c$var$filterCollection(collection, inputValue, filter) {
    return new (0, $5XAuq$reactstatelylist.ListCollection)($e563f9c9469ad14c$var$filterNodes(collection, collection, inputValue, filter));
}
function $e563f9c9469ad14c$var$filterNodes(collection, nodes, inputValue, filter) {
    let filteredNode = [];
    for (let node of nodes){
        if (node.type === "section" && node.hasChildNodes) {
            let filtered = $e563f9c9469ad14c$var$filterNodes(collection, (0, $5XAuq$reactstatelycollections.getChildNodes)(node, collection), inputValue, filter);
            if ([
                ...filtered
            ].some((node)=>node.type === "item")) filteredNode.push({
                ...node,
                childNodes: filtered
            });
        } else if (node.type === "item" && filter(node.textValue, inputValue)) filteredNode.push({
            ...node
        });
        else if (node.type !== "item") filteredNode.push({
            ...node
        });
    }
    return filteredNode;
}




//# sourceMappingURL=main.js.map
