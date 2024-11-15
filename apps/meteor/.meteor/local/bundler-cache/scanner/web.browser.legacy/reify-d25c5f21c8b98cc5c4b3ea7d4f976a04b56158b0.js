var $j4fa6$reactariautils = require("@react-aria/utils");
var $j4fa6$react = require("react");
var $j4fa6$reactariaselection = require("@react-aria/selection");
var $j4fa6$reactariainteractions = require("@react-aria/interactions");
var $j4fa6$reactariai18n = require("@react-aria/i18n");
var $j4fa6$reactarialabel = require("@react-aria/label");
var $j4fa6$reactariamenu = require("@react-aria/menu");
var $j4fa6$reactariavisuallyhidden = require("@react-aria/visually-hidden");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useSelect", () => $23a1e93dc7fa8653$export$e64b2f635402ca43);
$parcel$export(module.exports, "useHiddenSelect", () => $6eae0e0872a4cdd4$export$f809e80f58e251d1);
$parcel$export(module.exports, "HiddenSelect", () => $6eae0e0872a4cdd4$export$cbd84cdb2e668835);
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






function $23a1e93dc7fa8653$export$e64b2f635402ca43(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate , isDisabled: isDisabled  } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $j4fa6$reactariai18n.useCollator)({
        usage: "search",
        sensitivity: "base"
    });
    let delegate = (0, $j4fa6$react.useMemo)(()=>keyboardDelegate || new (0, $j4fa6$reactariaselection.ListKeyboardDelegate)(state.collection, state.disabledKeys, null, collator), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        collator
    ]);
    let { menuTriggerProps: menuTriggerProps , menuProps: menuProps  } = (0, $j4fa6$reactariamenu.useMenuTrigger)({
        isDisabled: isDisabled,
        type: "listbox"
    }, state, ref);
    let onKeyDown = (e)=>{
        switch(e.key){
            case "ArrowLeft":
                {
                    // prevent scrolling containers
                    e.preventDefault();
                    let key = state.selectedKey != null ? delegate.getKeyAbove(state.selectedKey) : delegate.getFirstKey();
                    if (key) state.setSelectedKey(key);
                    break;
                }
            case "ArrowRight":
                {
                    // prevent scrolling containers
                    e.preventDefault();
                    let key1 = state.selectedKey != null ? delegate.getKeyBelow(state.selectedKey) : delegate.getFirstKey();
                    if (key1) state.setSelectedKey(key1);
                    break;
                }
        }
    };
    let { typeSelectProps: typeSelectProps  } = (0, $j4fa6$reactariaselection.useTypeSelect)({
        keyboardDelegate: delegate,
        selectionManager: state.selectionManager,
        onTypeSelect (key) {
            state.setSelectedKey(key);
        }
    });
    let { labelProps: labelProps , fieldProps: fieldProps , descriptionProps: descriptionProps , errorMessageProps: errorMessageProps  } = (0, $j4fa6$reactarialabel.useField)({
        ...props,
        labelElementType: "span"
    });
    typeSelectProps.onKeyDown = typeSelectProps.onKeyDownCapture;
    delete typeSelectProps.onKeyDownCapture;
    let domProps = (0, $j4fa6$reactariautils.filterDOMProps)(props, {
        labelable: true
    });
    let triggerProps = (0, $j4fa6$reactariautils.mergeProps)(typeSelectProps, menuTriggerProps, fieldProps);
    let valueId = (0, $j4fa6$reactariautils.useId)();
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                if (!props.isDisabled) {
                    ref.current.focus();
                    // Show the focus ring so the user knows where focus went
                    (0, $j4fa6$reactariainteractions.setInteractionModality)("keyboard");
                }
            }
        },
        triggerProps: (0, $j4fa6$reactariautils.mergeProps)(domProps, {
            ...triggerProps,
            isDisabled: isDisabled,
            onKeyDown: (0, $j4fa6$reactariautils.chain)(triggerProps.onKeyDown, onKeyDown, props.onKeyDown),
            onKeyUp: props.onKeyUp,
            "aria-labelledby": [
                triggerProps["aria-labelledby"],
                triggerProps["aria-label"] && !triggerProps["aria-labelledby"] ? triggerProps.id : null,
                valueId
            ].filter(Boolean).join(" "),
            onFocus (e) {
                if (state.isFocused) return;
                if (props.onFocus) props.onFocus(e);
                if (props.onFocusChange) props.onFocusChange(true);
                state.setFocused(true);
            },
            onBlur (e) {
                if (state.isOpen) return;
                if (props.onBlur) props.onBlur(e);
                if (props.onFocusChange) props.onFocusChange(false);
                state.setFocused(false);
            }
        }),
        valueProps: {
            id: valueId
        },
        menuProps: {
            ...menuProps,
            autoFocus: state.focusStrategy || true,
            shouldSelectOnPressUp: true,
            shouldFocusOnHover: true,
            disallowEmptySelection: true,
            onBlur: (e)=>{
                if (e.currentTarget.contains(e.relatedTarget)) return;
                if (props.onBlur) props.onBlur(e);
                if (props.onFocusChange) props.onFocusChange(false);
                state.setFocused(false);
            },
            "aria-labelledby": [
                fieldProps["aria-labelledby"],
                triggerProps["aria-label"] && !fieldProps["aria-labelledby"] ? triggerProps.id : null
            ].filter(Boolean).join(" ")
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
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


function $6eae0e0872a4cdd4$export$f809e80f58e251d1(props, state, triggerRef) {
    let { autoComplete: autoComplete , name: name , isDisabled: isDisabled  } = props;
    let modality = (0, $j4fa6$reactariainteractions.useInteractionModality)();
    let { visuallyHiddenProps: visuallyHiddenProps  } = (0, $j4fa6$reactariavisuallyhidden.useVisuallyHidden)();
    var _state_selectedKey;
    // In Safari, the <select> cannot have `display: none` or `hidden` for autofill to work.
    // In Firefox, there must be a <label> to identify the <select> whereas other browsers
    // seem to identify it just by surrounding text.
    // The solution is to use <VisuallyHidden> to hide the elements, which clips the elements to a
    // 1px rectangle. In addition, we hide from screen readers with aria-hidden, and make the <select>
    // non tabbable with tabIndex={-1}.
    //
    // In mobile browsers, there are next/previous buttons above the software keyboard for navigating
    // between fields in a form. These only support native form inputs that are tabbable. In order to
    // support those, an additional hidden input is used to marshall focus to the button. It is tabbable
    // except when the button is focused, so that shift tab works properly to go to the actual previous
    // input in the form. Using the <select> for this also works, but Safari on iOS briefly flashes
    // the native menu on focus, so this isn't ideal. A font-size of 16px or greater is required to
    // prevent Safari from zooming in on the input when it is focused.
    //
    // If the current interaction modality is null, then the user hasn't interacted with the page yet.
    // In this case, we set the tabIndex to -1 on the input element so that automated accessibility
    // checkers don't throw false-positives about focusable elements inside an aria-hidden parent.
    return {
        containerProps: {
            ...visuallyHiddenProps,
            "aria-hidden": true
        },
        inputProps: {
            type: "text",
            tabIndex: modality == null || state.isFocused || state.isOpen ? -1 : 0,
            style: {
                fontSize: 16
            },
            onFocus: ()=>triggerRef.current.focus(),
            disabled: isDisabled
        },
        selectProps: {
            tabIndex: -1,
            autoComplete: autoComplete,
            disabled: isDisabled,
            name: name,
            size: state.collection.size,
            value: (_state_selectedKey = state.selectedKey) !== null && _state_selectedKey !== void 0 ? _state_selectedKey : "",
            onChange: (e)=>state.setSelectedKey(e.target.value)
        }
    };
}
function $6eae0e0872a4cdd4$export$cbd84cdb2e668835(props) {
    let { state: state , triggerRef: triggerRef , label: label , name: name , isDisabled: isDisabled  } = props;
    let { containerProps: containerProps , inputProps: inputProps , selectProps: selectProps  } = $6eae0e0872a4cdd4$export$f809e80f58e251d1(props, state, triggerRef);
    var _state_selectedKey;
    // If used in a <form>, use a hidden input so the value can be submitted to a server.
    // If the collection isn't too big, use a hidden <select> element for this so that browser
    // autofill will work. Otherwise, use an <input type="hidden">.
    if (state.collection.size <= 300) return /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("div", containerProps, /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("input", inputProps), /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("label", null, label, /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("select", selectProps, /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("option", null), [
        ...state.collection.getKeys()
    ].map((key)=>{
        let item = state.collection.getItem(key);
        if (item.type === "item") return /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("option", {
            key: item.key,
            value: item.key
        }, item.textValue);
    }))));
    else if (name) return /*#__PURE__*/ (0, ($parcel$interopDefault($j4fa6$react))).createElement("input", {
        type: "hidden",
        autoComplete: selectProps.autoComplete,
        name: name,
        disabled: isDisabled,
        value: (_state_selectedKey = state.selectedKey) !== null && _state_selectedKey !== void 0 ? _state_selectedKey : ""
    });
    return null;
}




//# sourceMappingURL=main.js.map
