var $glPPV$react = require("react");
var $glPPV$reactariafocus = require("@react-aria/focus");
var $glPPV$reactariautils = require("@react-aria/utils");
var $glPPV$reactariainteractions = require("@react-aria/interactions");
var $glPPV$reactariai18n = require("@react-aria/i18n");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSelectableCollection", () => $b6837c2f80a3c32f$export$d6daf82dcd84e87c);
$parcel$export(module.exports, "useSelectableItem", () => $433b1145b0781e10$export$ecf600387e221c37);
$parcel$export(module.exports, "useSelectableList", () => $bd230acee196f50c$export$b95089534ab7c1fd);
$parcel$export(module.exports, "ListKeyboardDelegate", () => $836f880b12dcae5c$export$a05409b8bb224a5a);
$parcel$export(module.exports, "useTypeSelect", () => $a1189052f36475e8$export$e32c88dfddc6e1d8);
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
 */ 

function $ee0bdf4faa47f2a8$export$d3e3bd3e26688c04(e) {
    // Ctrl + Arrow Up/Arrow Down has a system wide meaning on macOS, so use Alt instead.
    // On Windows and Ubuntu, Alt + Space has a system wide meaning.
    return (0, $glPPV$reactariautils.isAppleDevice)() ? e.altKey : e.ctrlKey;
}
function $ee0bdf4faa47f2a8$export$16792effe837dba3(e) {
    if ((0, $glPPV$reactariautils.isMac)()) return e.metaKey;
    return e.ctrlKey;
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
/**
 * Controls how long to wait before clearing the typeahead buffer.
 */ const $a1189052f36475e8$var$TYPEAHEAD_DEBOUNCE_WAIT_MS = 1000; // 1 second
function $a1189052f36475e8$export$e32c88dfddc6e1d8(options) {
    let { keyboardDelegate: keyboardDelegate , selectionManager: selectionManager , onTypeSelect: onTypeSelect  } = options;
    let state = (0, $glPPV$react.useRef)({
        search: "",
        timeout: null
    }).current;
    let onKeyDown = (e)=>{
        let character = $a1189052f36475e8$var$getStringForKey(e.key);
        if (!character || e.ctrlKey || e.metaKey) return;
        // Do not propagate the Spacebar event if it's meant to be part of the search.
        // When we time out, the search term becomes empty, hence the check on length.
        // Trimming is to account for the case of pressing the Spacebar more than once,
        // which should cycle through the selection/deselection of the focused item.
        if (character === " " && state.search.trim().length > 0) {
            e.preventDefault();
            if (!("continuePropagation" in e)) e.stopPropagation();
        }
        state.search += character;
        // Use the delegate to find a key to focus.
        // Prioritize items after the currently focused item, falling back to searching the whole list.
        let key = keyboardDelegate.getKeyForSearch(state.search, selectionManager.focusedKey);
        // If no key found, search from the top.
        if (key == null) key = keyboardDelegate.getKeyForSearch(state.search);
        if (key != null) {
            selectionManager.setFocusedKey(key);
            if (onTypeSelect) onTypeSelect(key);
        }
        clearTimeout(state.timeout);
        state.timeout = setTimeout(()=>{
            state.search = "";
        }, $a1189052f36475e8$var$TYPEAHEAD_DEBOUNCE_WAIT_MS);
    };
    return {
        typeSelectProps: {
            // Using a capturing listener to catch the keydown event before
            // other hooks in order to handle the Spacebar event.
            onKeyDownCapture: keyboardDelegate.getKeyForSearch ? onKeyDown : null
        }
    };
}
function $a1189052f36475e8$var$getStringForKey(key) {
    // If the key is of length 1, it is an ASCII value.
    // Otherwise, if there are no ASCII characters in the key name,
    // it is a Unicode character.
    // See https://www.w3.org/TR/uievents-key/
    if (key.length === 1 || !/^[A-Z]/i.test(key)) return key;
    return "";
}


function $b6837c2f80a3c32f$export$d6daf82dcd84e87c(options) {
    let { selectionManager: manager , keyboardDelegate: delegate , ref: ref , autoFocus: autoFocus = false , shouldFocusWrap: shouldFocusWrap = false , disallowEmptySelection: disallowEmptySelection = false , disallowSelectAll: disallowSelectAll = false , selectOnFocus: selectOnFocus = manager.selectionBehavior === "replace" , disallowTypeAhead: disallowTypeAhead = false , shouldUseVirtualFocus: shouldUseVirtualFocus , allowsTabNavigation: allowsTabNavigation = false , isVirtualized: isVirtualized , scrollRef: // If no scrollRef is provided, assume the collection ref is the scrollable region
    scrollRef = ref  } = options;
    let { direction: direction  } = (0, $glPPV$reactariai18n.useLocale)();
    let onKeyDown = (e)=>{
        // Prevent option + tab from doing anything since it doesn't move focus to the cells, only buttons/checkboxes
        if (e.altKey && e.key === "Tab") e.preventDefault();
        // Keyboard events bubble through portals. Don't handle keyboard events
        // for elements outside the collection (e.g. menus).
        if (!ref.current.contains(e.target)) return;
        const navigateToKey = (key, childFocus)=>{
            if (key != null) {
                manager.setFocusedKey(key, childFocus);
                if (e.shiftKey && manager.selectionMode === "multiple") manager.extendSelection(key);
                else if (selectOnFocus && !(0, $ee0bdf4faa47f2a8$export$d3e3bd3e26688c04)(e)) manager.replaceSelection(key);
            }
        };
        switch(e.key){
            case "ArrowDown":
                if (delegate.getKeyBelow) {
                    var _delegate_getFirstKey, _delegate_getFirstKey1;
                    e.preventDefault();
                    let nextKey = manager.focusedKey != null ? delegate.getKeyBelow(manager.focusedKey) : (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate);
                    if (nextKey == null && shouldFocusWrap) nextKey = (_delegate_getFirstKey1 = delegate.getFirstKey) === null || _delegate_getFirstKey1 === void 0 ? void 0 : _delegate_getFirstKey1.call(delegate, manager.focusedKey);
                    navigateToKey(nextKey);
                }
                break;
            case "ArrowUp":
                if (delegate.getKeyAbove) {
                    var _delegate_getLastKey, _delegate_getLastKey1;
                    e.preventDefault();
                    let nextKey1 = manager.focusedKey != null ? delegate.getKeyAbove(manager.focusedKey) : (_delegate_getLastKey = delegate.getLastKey) === null || _delegate_getLastKey === void 0 ? void 0 : _delegate_getLastKey.call(delegate);
                    if (nextKey1 == null && shouldFocusWrap) nextKey1 = (_delegate_getLastKey1 = delegate.getLastKey) === null || _delegate_getLastKey1 === void 0 ? void 0 : _delegate_getLastKey1.call(delegate, manager.focusedKey);
                    navigateToKey(nextKey1);
                }
                break;
            case "ArrowLeft":
                if (delegate.getKeyLeftOf) {
                    e.preventDefault();
                    let nextKey2 = delegate.getKeyLeftOf(manager.focusedKey);
                    navigateToKey(nextKey2, direction === "rtl" ? "first" : "last");
                }
                break;
            case "ArrowRight":
                if (delegate.getKeyRightOf) {
                    e.preventDefault();
                    let nextKey3 = delegate.getKeyRightOf(manager.focusedKey);
                    navigateToKey(nextKey3, direction === "rtl" ? "last" : "first");
                }
                break;
            case "Home":
                if (delegate.getFirstKey) {
                    e.preventDefault();
                    let firstKey = delegate.getFirstKey(manager.focusedKey, (0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e));
                    manager.setFocusedKey(firstKey);
                    if ((0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e) && e.shiftKey && manager.selectionMode === "multiple") manager.extendSelection(firstKey);
                    else if (selectOnFocus) manager.replaceSelection(firstKey);
                }
                break;
            case "End":
                if (delegate.getLastKey) {
                    e.preventDefault();
                    let lastKey = delegate.getLastKey(manager.focusedKey, (0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e));
                    manager.setFocusedKey(lastKey);
                    if ((0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e) && e.shiftKey && manager.selectionMode === "multiple") manager.extendSelection(lastKey);
                    else if (selectOnFocus) manager.replaceSelection(lastKey);
                }
                break;
            case "PageDown":
                if (delegate.getKeyPageBelow) {
                    e.preventDefault();
                    let nextKey4 = delegate.getKeyPageBelow(manager.focusedKey);
                    navigateToKey(nextKey4);
                }
                break;
            case "PageUp":
                if (delegate.getKeyPageAbove) {
                    e.preventDefault();
                    let nextKey5 = delegate.getKeyPageAbove(manager.focusedKey);
                    navigateToKey(nextKey5);
                }
                break;
            case "a":
                if ((0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e) && manager.selectionMode === "multiple" && disallowSelectAll !== true) {
                    e.preventDefault();
                    manager.selectAll();
                }
                break;
            case "Escape":
                e.preventDefault();
                if (!disallowEmptySelection) manager.clearSelection();
                break;
            case "Tab":
                if (!allowsTabNavigation) {
                    // There may be elements that are "tabbable" inside a collection (e.g. in a grid cell).
                    // However, collections should be treated as a single tab stop, with arrow key navigation internally.
                    // We don't control the rendering of these, so we can't override the tabIndex to prevent tabbing.
                    // Instead, we handle the Tab key, and move focus manually to the first/last tabbable element
                    // in the collection, so that the browser default behavior will apply starting from that element
                    // rather than the currently focused one.
                    if (e.shiftKey) ref.current.focus();
                    else {
                        let walker = (0, $glPPV$reactariafocus.getFocusableTreeWalker)(ref.current, {
                            tabbable: true
                        });
                        let next;
                        let last;
                        do {
                            last = walker.lastChild();
                            if (last) next = last;
                        }while (last);
                        if (next && !next.contains(document.activeElement)) (0, $glPPV$reactariautils.focusWithoutScrolling)(next);
                    }
                    break;
                }
        }
    };
    // Store the scroll position so we can restore it later.
    let scrollPos = (0, $glPPV$react.useRef)({
        top: 0,
        left: 0
    });
    (0, $glPPV$reactariautils.useEvent)(scrollRef, "scroll", isVirtualized ? null : ()=>{
        scrollPos.current = {
            top: scrollRef.current.scrollTop,
            left: scrollRef.current.scrollLeft
        };
    });
    let onFocus = (e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!e.currentTarget.contains(e.target)) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!e.currentTarget.contains(e.target)) return;
        manager.setFocused(true);
        if (manager.focusedKey == null) {
            let navigateToFirstKey = (key)=>{
                if (key != null) {
                    manager.setFocusedKey(key);
                    if (selectOnFocus) manager.replaceSelection(key);
                }
            };
            // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
            // Attempt to detect whether the user is tabbing forward or backward into the collection
            // and either focus the first or last item accordingly.
            let relatedTarget = e.relatedTarget;
            var _manager_lastSelectedKey, _manager_firstSelectedKey;
            if (relatedTarget && e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING) navigateToFirstKey((_manager_lastSelectedKey = manager.lastSelectedKey) !== null && _manager_lastSelectedKey !== void 0 ? _manager_lastSelectedKey : delegate.getLastKey());
            else navigateToFirstKey((_manager_firstSelectedKey = manager.firstSelectedKey) !== null && _manager_firstSelectedKey !== void 0 ? _manager_firstSelectedKey : delegate.getFirstKey());
        } else if (!isVirtualized) {
            // Restore the scroll position to what it was before.
            scrollRef.current.scrollTop = scrollPos.current.top;
            scrollRef.current.scrollLeft = scrollPos.current.left;
        }
        if (!isVirtualized && manager.focusedKey != null) {
            // Refocus and scroll the focused item into view if it exists within the scrollable region.
            let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`);
            if (element) {
                // This prevents a flash of focus on the first/last element in the collection, or the collection itself.
                (0, $glPPV$reactariautils.focusWithoutScrolling)(element);
                (0, $glPPV$reactariautils.scrollIntoView)(scrollRef.current, element);
            }
        }
    };
    let onBlur = (e)=>{
        // Don't set blurred and then focused again if moving focus within the collection.
        if (!e.currentTarget.contains(e.relatedTarget)) manager.setFocused(false);
    };
    const autoFocusRef = (0, $glPPV$react.useRef)(autoFocus);
    (0, $glPPV$react.useEffect)(()=>{
        if (autoFocusRef.current) {
            let focusedKey = null;
            // Check focus strategy to determine which item to focus
            if (autoFocus === "first") focusedKey = delegate.getFirstKey();
            if (autoFocus === "last") focusedKey = delegate.getLastKey();
            // If there are any selected keys, make the first one the new focus target
            let selectedKeys = manager.selectedKeys;
            if (selectedKeys.size) focusedKey = selectedKeys.values().next().value;
            manager.setFocused(true);
            manager.setFocusedKey(focusedKey);
            // If no default focus key is selected, focus the collection itself.
            if (focusedKey == null && !shouldUseVirtualFocus) (0, $glPPV$reactariafocus.focusSafely)(ref.current);
        }
        autoFocusRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // If not virtualized, scroll the focused element into view when the focusedKey changes.
    // When virtualized, Virtualizer handles this internally.
    (0, $glPPV$react.useEffect)(()=>{
        let modality = (0, $glPPV$reactariainteractions.getInteractionModality)();
        if (!isVirtualized && manager.isFocused && manager.focusedKey != null && (scrollRef === null || scrollRef === void 0 ? void 0 : scrollRef.current)) {
            let element = scrollRef.current.querySelector(`[data-key="${manager.focusedKey}"]`);
            if (element) {
                (0, $glPPV$reactariautils.scrollIntoView)(scrollRef.current, element);
                if (modality === "keyboard") (0, $glPPV$reactariautils.scrollIntoViewport)(element, {
                    containingElement: ref.current
                });
            }
        }
    }, [
        isVirtualized,
        scrollRef,
        manager.focusedKey,
        manager.isFocused,
        ref
    ]);
    let handlers = {
        onKeyDown: onKeyDown,
        onFocus: onFocus,
        onBlur: onBlur,
        onMouseDown (e) {
            // Ignore events that bubbled through portals.
            if (scrollRef.current === e.target) // Prevent focus going to the collection when clicking on the scrollbar.
            e.preventDefault();
        }
    };
    let { typeSelectProps: typeSelectProps  } = (0, $a1189052f36475e8$export$e32c88dfddc6e1d8)({
        keyboardDelegate: delegate,
        selectionManager: manager
    });
    if (!disallowTypeAhead) handlers = (0, $glPPV$reactariautils.mergeProps)(typeSelectProps, handlers);
    // If nothing is focused within the collection, make the collection itself tabbable.
    // This will be marshalled to either the first or last item depending on where focus came from.
    // If using virtual focus, don't set a tabIndex at all so that VoiceOver on iOS 14 doesn't try
    // to move real DOM focus to the element anyway.
    let tabIndex;
    if (!shouldUseVirtualFocus) tabIndex = manager.focusedKey == null ? 0 : -1;
    return {
        collectionProps: {
            ...handlers,
            tabIndex: tabIndex
        }
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




function $433b1145b0781e10$export$ecf600387e221c37(options) {
    let { selectionManager: manager , key: key , ref: ref , shouldSelectOnPressUp: shouldSelectOnPressUp , isVirtualized: isVirtualized , shouldUseVirtualFocus: shouldUseVirtualFocus , focus: focus , isDisabled: isDisabled , onAction: onAction , allowsDifferentPressOrigin: allowsDifferentPressOrigin  } = options;
    let onSelect = (e)=>{
        if (e.pointerType === "keyboard" && (0, $ee0bdf4faa47f2a8$export$d3e3bd3e26688c04)(e)) manager.toggleSelection(key);
        else {
            if (manager.selectionMode === "none") return;
            if (manager.selectionMode === "single") {
                if (manager.isSelected(key) && !manager.disallowEmptySelection) manager.toggleSelection(key);
                else manager.replaceSelection(key);
            } else if (e && e.shiftKey) manager.extendSelection(key);
            else if (manager.selectionBehavior === "toggle" || e && ((0, $ee0bdf4faa47f2a8$export$16792effe837dba3)(e) || e.pointerType === "touch" || e.pointerType === "virtual")) // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
            manager.toggleSelection(key);
            else manager.replaceSelection(key);
        }
    };
    // Focus the associated DOM node when this item becomes the focusedKey
    (0, $glPPV$react.useEffect)(()=>{
        let isFocused = key === manager.focusedKey;
        if (isFocused && manager.isFocused && !shouldUseVirtualFocus) {
            if (focus) focus();
            else if (document.activeElement !== ref.current) (0, $glPPV$reactariafocus.focusSafely)(ref.current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        ref,
        key,
        manager.focusedKey,
        manager.childFocusStrategy,
        manager.isFocused,
        shouldUseVirtualFocus
    ]);
    isDisabled = isDisabled || manager.isDisabled(key);
    // Set tabIndex to 0 if the element is focused, or -1 otherwise so that only the last focused
    // item is tabbable.  If using virtual focus, don't set a tabIndex at all so that VoiceOver
    // on iOS 14 doesn't try to move real DOM focus to the item anyway.
    let itemProps = {};
    if (!shouldUseVirtualFocus && !isDisabled) itemProps = {
        tabIndex: key === manager.focusedKey ? 0 : -1,
        onFocus (e) {
            if (e.target === ref.current) manager.setFocusedKey(key);
        }
    };
    else if (isDisabled) itemProps.onMouseDown = (e)=>{
        // Prevent focus going to the body when clicking on a disabled item.
        e.preventDefault();
    };
    // With checkbox selection, onAction (i.e. navigation) becomes primary, and occurs on a single click of the row.
    // Clicking the checkbox enters selection mode, after which clicking anywhere on any row toggles selection for that row.
    // With highlight selection, onAction is secondary, and occurs on double click. Single click selects the row.
    // With touch, onAction occurs on single tap, and long press enters selection mode.
    let allowsSelection = !isDisabled && manager.canSelectItem(key);
    let allowsActions = onAction && !isDisabled;
    let hasPrimaryAction = allowsActions && (manager.selectionBehavior === "replace" ? !allowsSelection : manager.isEmpty);
    let hasSecondaryAction = allowsActions && allowsSelection && manager.selectionBehavior === "replace";
    let hasAction = hasPrimaryAction || hasSecondaryAction;
    let modality = (0, $glPPV$react.useRef)(null);
    let longPressEnabled = hasAction && allowsSelection;
    let longPressEnabledOnPressStart = (0, $glPPV$react.useRef)(false);
    let hadPrimaryActionOnPressStart = (0, $glPPV$react.useRef)(false);
    // By default, selection occurs on pointer down. This can be strange if selecting an
    // item causes the UI to disappear immediately (e.g. menus).
    // If shouldSelectOnPressUp is true, we use onPressUp instead of onPressStart.
    // onPress requires a pointer down event on the same element as pointer up. For menus,
    // we want to be able to have the pointer down on the trigger that opens the menu and
    // the pointer up on the menu item rather than requiring a separate press.
    // For keyboard events, selection still occurs on key down.
    let itemPressProps = {};
    if (shouldSelectOnPressUp) {
        itemPressProps.onPressStart = (e)=>{
            modality.current = e.pointerType;
            longPressEnabledOnPressStart.current = longPressEnabled;
            if (e.pointerType === "keyboard" && (!hasAction || $433b1145b0781e10$var$isSelectionKey())) onSelect(e);
        };
        // If allowsDifferentPressOrigin, make selection happen on pressUp (e.g. open menu on press down, selection on menu item happens on press up.)
        // Otherwise, have selection happen onPress (prevents listview row selection when clicking on interactable elements in the row)
        if (!allowsDifferentPressOrigin) itemPressProps.onPress = (e)=>{
            if (hasPrimaryAction || hasSecondaryAction && e.pointerType !== "mouse") {
                if (e.pointerType === "keyboard" && !$433b1145b0781e10$var$isActionKey()) return;
                onAction();
            } else if (e.pointerType !== "keyboard") onSelect(e);
        };
        else {
            itemPressProps.onPressUp = (e)=>{
                if (e.pointerType !== "keyboard") onSelect(e);
            };
            itemPressProps.onPress = hasPrimaryAction ? ()=>onAction() : null;
        }
    } else {
        itemPressProps.onPressStart = (e)=>{
            modality.current = e.pointerType;
            longPressEnabledOnPressStart.current = longPressEnabled;
            hadPrimaryActionOnPressStart.current = hasPrimaryAction;
            // Select on mouse down unless there is a primary action which will occur on mouse up.
            // For keyboard, select on key down. If there is an action, the Space key selects on key down,
            // and the Enter key performs onAction on key up.
            if (e.pointerType === "mouse" && !hasPrimaryAction || e.pointerType === "keyboard" && (!onAction || $433b1145b0781e10$var$isSelectionKey())) onSelect(e);
        };
        itemPressProps.onPress = (e)=>{
            // Selection occurs on touch up. Primary actions always occur on pointer up.
            // Both primary and secondary actions occur on Enter key up. The only exception
            // is secondary actions, which occur on double click with a mouse.
            if (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "virtual" || e.pointerType === "keyboard" && hasAction && $433b1145b0781e10$var$isActionKey() || e.pointerType === "mouse" && hadPrimaryActionOnPressStart.current) {
                if (hasAction) onAction();
                else onSelect(e);
            }
        };
    }
    if (!isVirtualized) itemProps["data-key"] = key;
    itemPressProps.preventFocusOnPress = shouldUseVirtualFocus;
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $glPPV$reactariainteractions.usePress)(itemPressProps);
    // Double clicking with a mouse with selectionBehavior = 'replace' performs an action.
    let onDoubleClick = hasSecondaryAction ? (e)=>{
        if (modality.current === "mouse") {
            e.stopPropagation();
            e.preventDefault();
            onAction();
        }
    } : undefined;
    // Long pressing an item with touch when selectionBehavior = 'replace' switches the selection behavior
    // to 'toggle'. This changes the single tap behavior from performing an action (i.e. navigating) to
    // selecting, and may toggle the appearance of a UI affordance like checkboxes on each item.
    let { longPressProps: longPressProps  } = (0, $glPPV$reactariainteractions.useLongPress)({
        isDisabled: !longPressEnabled,
        onLongPress (e) {
            if (e.pointerType === "touch") {
                onSelect(e);
                manager.setSelectionBehavior("toggle");
            }
        }
    });
    // Prevent native drag and drop on long press if we also select on long press.
    // Once the user is in selection mode, they can long press again to drag.
    // Use a capturing listener to ensure this runs before useDrag, regardless of
    // the order the props get merged.
    let onDragStartCapture = (e)=>{
        if (modality.current === "touch" && longPressEnabledOnPressStart.current) e.preventDefault();
    };
    return {
        itemProps: (0, $glPPV$reactariautils.mergeProps)(itemProps, allowsSelection || hasPrimaryAction ? pressProps : {}, longPressEnabled ? longPressProps : {}, {
            onDoubleClick: onDoubleClick,
            onDragStartCapture: onDragStartCapture
        }),
        isPressed: isPressed,
        isSelected: manager.isSelected(key),
        isFocused: manager.isFocused && manager.focusedKey === key,
        isDisabled: isDisabled,
        allowsSelection: allowsSelection,
        hasAction: hasAction
    };
}
function $433b1145b0781e10$var$isActionKey() {
    let event = window.event;
    return (event === null || event === void 0 ? void 0 : event.key) === "Enter";
}
function $433b1145b0781e10$var$isSelectionKey() {
    let event = window.event;
    return (event === null || event === void 0 ? void 0 : event.key) === " " || (event === null || event === void 0 ? void 0 : event.code) === "Space";
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
 */ class $836f880b12dcae5c$export$a05409b8bb224a5a {
    getKeyBelow(key) {
        key = this.collection.getKeyAfter(key);
        while(key != null){
            let item = this.collection.getItem(key);
            if (item.type === "item" && !this.disabledKeys.has(key)) return key;
            key = this.collection.getKeyAfter(key);
        }
        return null;
    }
    getKeyAbove(key) {
        key = this.collection.getKeyBefore(key);
        while(key != null){
            let item = this.collection.getItem(key);
            if (item.type === "item" && !this.disabledKeys.has(key)) return key;
            key = this.collection.getKeyBefore(key);
        }
        return null;
    }
    getFirstKey() {
        let key = this.collection.getFirstKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (item.type === "item" && !this.disabledKeys.has(key)) return key;
            key = this.collection.getKeyAfter(key);
        }
        return null;
    }
    getLastKey() {
        let key = this.collection.getLastKey();
        while(key != null){
            let item = this.collection.getItem(key);
            if (item.type === "item" && !this.disabledKeys.has(key)) return key;
            key = this.collection.getKeyBefore(key);
        }
        return null;
    }
    getItem(key) {
        return this.ref.current.querySelector(`[data-key="${key}"]`);
    }
    getKeyPageAbove(key) {
        let menu = this.ref.current;
        let item = this.getItem(key);
        if (!item) return null;
        let pageY = Math.max(0, item.offsetTop + item.offsetHeight - menu.offsetHeight);
        while(item && item.offsetTop > pageY){
            key = this.getKeyAbove(key);
            item = key == null ? null : this.getItem(key);
        }
        return key;
    }
    getKeyPageBelow(key) {
        let menu = this.ref.current;
        let item = this.getItem(key);
        if (!item) return null;
        let pageY = Math.min(menu.scrollHeight, item.offsetTop - item.offsetHeight + menu.offsetHeight);
        while(item && item.offsetTop < pageY){
            key = this.getKeyBelow(key);
            item = key == null ? null : this.getItem(key);
        }
        return key;
    }
    getKeyForSearch(search, fromKey) {
        if (!this.collator) return null;
        let collection = this.collection;
        let key = fromKey || this.getFirstKey();
        while(key != null){
            let item = collection.getItem(key);
            let substring = item.textValue.slice(0, search.length);
            if (item.textValue && this.collator.compare(substring, search) === 0) return key;
            key = this.getKeyBelow(key);
        }
        return null;
    }
    constructor(collection, disabledKeys, ref, collator){
        this.collection = collection;
        this.disabledKeys = disabledKeys;
        this.ref = ref;
        this.collator = collator;
    }
}




function $bd230acee196f50c$export$b95089534ab7c1fd(props) {
    let { selectionManager: selectionManager , collection: collection , disabledKeys: disabledKeys , ref: ref , keyboardDelegate: keyboardDelegate , autoFocus: autoFocus , shouldFocusWrap: shouldFocusWrap , isVirtualized: isVirtualized , disallowEmptySelection: disallowEmptySelection , selectOnFocus: selectOnFocus = selectionManager.selectionBehavior === "replace" , disallowTypeAhead: disallowTypeAhead , shouldUseVirtualFocus: shouldUseVirtualFocus , allowsTabNavigation: allowsTabNavigation  } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $glPPV$reactariai18n.useCollator)({
        usage: "search",
        sensitivity: "base"
    });
    let disabledBehavior = selectionManager.disabledBehavior;
    let delegate = (0, $glPPV$react.useMemo)(()=>keyboardDelegate || new (0, $836f880b12dcae5c$export$a05409b8bb224a5a)(collection, disabledBehavior === "selection" ? new Set() : disabledKeys, ref, collator), [
        keyboardDelegate,
        collection,
        disabledKeys,
        ref,
        collator,
        disabledBehavior
    ]);
    let { collectionProps: collectionProps  } = (0, $b6837c2f80a3c32f$export$d6daf82dcd84e87c)({
        ref: ref,
        selectionManager: selectionManager,
        keyboardDelegate: delegate,
        autoFocus: autoFocus,
        shouldFocusWrap: shouldFocusWrap,
        disallowEmptySelection: disallowEmptySelection,
        selectOnFocus: selectOnFocus,
        disallowTypeAhead: disallowTypeAhead,
        shouldUseVirtualFocus: shouldUseVirtualFocus,
        allowsTabNavigation: allowsTabNavigation,
        isVirtualized: isVirtualized,
        scrollRef: ref
    });
    return {
        listProps: collectionProps
    };
}






//# sourceMappingURL=main.js.map
