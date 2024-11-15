var $eFCLV$reactariautils = require("@react-aria/utils");
var $eFCLV$reactariainteractions = require("@react-aria/interactions");
var $eFCLV$reactarialabel = require("@react-aria/label");
var $eFCLV$reactariaselection = require("@react-aria/selection");
var $eFCLV$reactstatelycollections = require("@react-stately/collections");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useListBox", () => $a3ce5bb3074610af$export$50eacbbf140a3141);
$parcel$export(module.exports, "useOption", () => $c164f9f79f4cef2d$export$497855f14858aa34);
$parcel$export(module.exports, "useListBoxSection", () => $f32afd5f225c3320$export$c3f9f39876e4bc7);
$parcel$export(module.exports, "listData", () => $87beb89ab4a308fd$export$3585ede4d035bf14);
$parcel$export(module.exports, "getItemId", () => $87beb89ab4a308fd$export$9145995848b05025);
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
 */ const $87beb89ab4a308fd$export$3585ede4d035bf14 = new WeakMap();
function $87beb89ab4a308fd$var$normalizeKey(key) {
    if (typeof key === "string") return key.replace(/\s*/g, "");
    return "" + key;
}
function $87beb89ab4a308fd$export$9145995848b05025(state, itemKey) {
    let data = $87beb89ab4a308fd$export$3585ede4d035bf14.get(state);
    if (!data) throw new Error("Unknown list");
    return `${data.id}-option-${$87beb89ab4a308fd$var$normalizeKey(itemKey)}`;
}






function $a3ce5bb3074610af$export$50eacbbf140a3141(props, state, ref) {
    let domProps = (0, $eFCLV$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let { listProps: listProps  } = (0, $eFCLV$reactariaselection.useSelectableList)({
        ...props,
        ref: ref,
        selectionManager: state.selectionManager,
        collection: state.collection,
        disabledKeys: state.disabledKeys
    });
    let { focusWithinProps: focusWithinProps  } = (0, $eFCLV$reactariainteractions.useFocusWithin)({
        onFocusWithin: props.onFocus,
        onBlurWithin: props.onBlur,
        onFocusWithinChange: props.onFocusChange
    });
    // Share list id and some props with child options.
    let id = (0, $eFCLV$reactariautils.useId)(props.id);
    (0, $87beb89ab4a308fd$export$3585ede4d035bf14).set(state, {
        id: id,
        shouldUseVirtualFocus: props.shouldUseVirtualFocus,
        shouldSelectOnPressUp: props.shouldSelectOnPressUp,
        shouldFocusOnHover: props.shouldFocusOnHover,
        isVirtualized: props.isVirtualized,
        onAction: props.onAction
    });
    let { labelProps: labelProps , fieldProps: fieldProps  } = (0, $eFCLV$reactarialabel.useLabel)({
        ...props,
        id: id,
        // listbox is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: "span"
    });
    return {
        labelProps: labelProps,
        listBoxProps: (0, $eFCLV$reactariautils.mergeProps)(domProps, focusWithinProps, state.selectionManager.selectionMode === "multiple" ? {
            "aria-multiselectable": "true"
        } : {}, {
            role: "listbox",
            ...(0, $eFCLV$reactariautils.mergeProps)(fieldProps, listProps)
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




function $c164f9f79f4cef2d$export$497855f14858aa34(props, state, ref) {
    let { key: key  } = props;
    let data = (0, $87beb89ab4a308fd$export$3585ede4d035bf14).get(state);
    var _props_isDisabled;
    let isDisabled = (_props_isDisabled = props.isDisabled) !== null && _props_isDisabled !== void 0 ? _props_isDisabled : state.disabledKeys.has(key);
    var _props_isSelected;
    let isSelected = (_props_isSelected = props.isSelected) !== null && _props_isSelected !== void 0 ? _props_isSelected : state.selectionManager.isSelected(key);
    var _props_shouldSelectOnPressUp;
    let shouldSelectOnPressUp = (_props_shouldSelectOnPressUp = props.shouldSelectOnPressUp) !== null && _props_shouldSelectOnPressUp !== void 0 ? _props_shouldSelectOnPressUp : data === null || data === void 0 ? void 0 : data.shouldSelectOnPressUp;
    var _props_shouldFocusOnHover;
    let shouldFocusOnHover = (_props_shouldFocusOnHover = props.shouldFocusOnHover) !== null && _props_shouldFocusOnHover !== void 0 ? _props_shouldFocusOnHover : data === null || data === void 0 ? void 0 : data.shouldFocusOnHover;
    var _props_shouldUseVirtualFocus;
    let shouldUseVirtualFocus = (_props_shouldUseVirtualFocus = props.shouldUseVirtualFocus) !== null && _props_shouldUseVirtualFocus !== void 0 ? _props_shouldUseVirtualFocus : data === null || data === void 0 ? void 0 : data.shouldUseVirtualFocus;
    var _props_isVirtualized;
    let isVirtualized = (_props_isVirtualized = props.isVirtualized) !== null && _props_isVirtualized !== void 0 ? _props_isVirtualized : data === null || data === void 0 ? void 0 : data.isVirtualized;
    let labelId = (0, $eFCLV$reactariautils.useSlotId)();
    let descriptionId = (0, $eFCLV$reactariautils.useSlotId)();
    let optionProps = {
        role: "option",
        "aria-disabled": isDisabled || undefined,
        "aria-selected": state.selectionManager.selectionMode !== "none" ? isSelected : undefined
    };
    // Safari with VoiceOver on macOS misreads options with aria-labelledby or aria-label as simply "text".
    // We should not map slots to the label and description on Safari and instead just have VoiceOver read the textContent.
    // https://bugs.webkit.org/show_bug.cgi?id=209279
    if (!((0, $eFCLV$reactariautils.isMac)() && (0, $eFCLV$reactariautils.isWebKit)())) {
        optionProps["aria-label"] = props["aria-label"];
        optionProps["aria-labelledby"] = labelId;
        optionProps["aria-describedby"] = descriptionId;
    }
    if (isVirtualized) {
        var _state_collection_getItem;
        let index = Number((_state_collection_getItem = state.collection.getItem(key)) === null || _state_collection_getItem === void 0 ? void 0 : _state_collection_getItem.index);
        optionProps["aria-posinset"] = Number.isNaN(index) ? undefined : index + 1;
        optionProps["aria-setsize"] = (0, $eFCLV$reactstatelycollections.getItemCount)(state.collection);
    }
    let { itemProps: itemProps , isPressed: isPressed , isFocused: isFocused , hasAction: hasAction , allowsSelection: allowsSelection  } = (0, $eFCLV$reactariaselection.useSelectableItem)({
        selectionManager: state.selectionManager,
        key: key,
        ref: ref,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        allowsDifferentPressOrigin: shouldSelectOnPressUp && shouldFocusOnHover,
        isVirtualized: isVirtualized,
        shouldUseVirtualFocus: shouldUseVirtualFocus,
        isDisabled: isDisabled,
        onAction: (data === null || data === void 0 ? void 0 : data.onAction) ? ()=>{
            var _data_onAction;
            return data === null || data === void 0 ? void 0 : (_data_onAction = data.onAction) === null || _data_onAction === void 0 ? void 0 : _data_onAction.call(data, key);
        } : undefined
    });
    let { hoverProps: hoverProps  } = (0, $eFCLV$reactariainteractions.useHover)({
        isDisabled: isDisabled || !shouldFocusOnHover,
        onHoverStart () {
            if (!(0, $eFCLV$reactariainteractions.isFocusVisible)()) {
                state.selectionManager.setFocused(true);
                state.selectionManager.setFocusedKey(key);
            }
        }
    });
    return {
        optionProps: {
            ...optionProps,
            ...(0, $eFCLV$reactariautils.mergeProps)(itemProps, hoverProps),
            id: (0, $87beb89ab4a308fd$export$9145995848b05025)(state, key)
        },
        labelProps: {
            id: labelId
        },
        descriptionProps: {
            id: descriptionId
        },
        isFocused: isFocused,
        isFocusVisible: isFocused && (0, $eFCLV$reactariainteractions.isFocusVisible)(),
        isSelected: isSelected,
        isDisabled: isDisabled,
        isPressed: isPressed,
        allowsSelection: allowsSelection,
        hasAction: hasAction
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
function $f32afd5f225c3320$export$c3f9f39876e4bc7(props) {
    let { heading: heading , "aria-label": ariaLabel  } = props;
    let headingId = (0, $eFCLV$reactariautils.useId)();
    return {
        itemProps: {
            role: "presentation"
        },
        headingProps: heading ? {
            // Techincally, listbox cannot contain headings according to ARIA.
            // We hide the heading from assistive technology, and only use it
            // as a label for the nested group.
            id: headingId,
            "aria-hidden": true
        } : {},
        groupProps: {
            role: "group",
            "aria-label": ariaLabel,
            "aria-labelledby": heading ? headingId : undefined
        }
    };
}





//# sourceMappingURL=main.js.map
