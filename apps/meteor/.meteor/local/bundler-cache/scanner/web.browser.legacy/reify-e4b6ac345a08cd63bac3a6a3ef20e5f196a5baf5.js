var $8sZuk$reactariafocus = require("@react-aria/focus");
var $8sZuk$react = require("react");
var $8sZuk$reactariautils = require("@react-aria/utils");
var $8sZuk$reactariai18n = require("@react-aria/i18n");


function $parcel$exportWildcard(dest, source) {
  Object.keys(source).forEach(function(key) {
    if (key === 'default' || key === '__esModule' || dest.hasOwnProperty(key)) {
      return;
    }

    Object.defineProperty(dest, key, {
      enumerable: true,
      get: function get() {
        return source[key];
      }
    });
  });

  return dest;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ var $b132ee173e26a273$exports = {};

$parcel$export($b132ee173e26a273$exports, "useToolbar", () => $b132ee173e26a273$export$fa142eb1681c520);
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $b132ee173e26a273$export$fa142eb1681c520(props, ref) {
    const { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, orientation: orientation = "horizontal" } = props;
    let [isInToolbar, setInToolbar] = (0, $8sZuk$react.useState)(false);
    // should be safe because re-calling set state with the same value it already has is a no-op
    // this will allow us to react should a parent re-render and change its role though
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $8sZuk$reactariautils.useLayoutEffect)(()=>{
        var _ref_current_parentElement;
        setInToolbar(!!(ref.current && ((_ref_current_parentElement = ref.current.parentElement) === null || _ref_current_parentElement === void 0 ? void 0 : _ref_current_parentElement.closest('[role="toolbar"]'))));
    });
    const { direction: direction } = (0, $8sZuk$reactariai18n.useLocale)();
    const shouldReverse = direction === "rtl" && orientation === "horizontal";
    let focusManager = (0, $8sZuk$reactariafocus.createFocusManager)(ref);
    const onKeyDown = (e)=>{
        // don't handle portalled events
        if (!e.currentTarget.contains(e.target)) return;
        if (orientation === "horizontal" && e.key === "ArrowRight" || orientation === "vertical" && e.key === "ArrowDown") {
            if (shouldReverse) focusManager.focusPrevious();
            else focusManager.focusNext();
        } else if (orientation === "horizontal" && e.key === "ArrowLeft" || orientation === "vertical" && e.key === "ArrowUp") {
            if (shouldReverse) focusManager.focusNext();
            else focusManager.focusPrevious();
        } else if (e.key === "Tab") {
            // When the tab key is pressed, we want to move focus
            // out of the entire toolbar. To do this, move focus
            // to the first or last focusable child, and let the
            // browser handle the Tab key as usual from there.
            e.stopPropagation();
            lastFocused.current = document.activeElement;
            if (e.shiftKey) focusManager.focusFirst();
            else focusManager.focusLast();
            return;
        } else // if we didn't handle anything, return early so we don't preventDefault
        return;
        // Prevent arrow keys from being handled by nested action groups.
        e.stopPropagation();
        e.preventDefault();
    };
    // Record the last focused child when focus moves out of the toolbar.
    const lastFocused = (0, $8sZuk$react.useRef)(null);
    const onBlur = (e)=>{
        if (!e.currentTarget.contains(e.relatedTarget) && !lastFocused.current) lastFocused.current = e.target;
    };
    // Restore focus to the last focused child when focus returns into the toolbar.
    // If the element was removed, do nothing, either the first item in the first group,
    // or the last item in the last group will be focused, depending on direction.
    const onFocus = (e)=>{
        var _ref_current;
        if (lastFocused.current && !e.currentTarget.contains(e.relatedTarget) && ((_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.contains(e.target))) {
            var _lastFocused_current;
            (_lastFocused_current = lastFocused.current) === null || _lastFocused_current === void 0 ? void 0 : _lastFocused_current.focus();
            lastFocused.current = null;
        }
    };
    return {
        toolbarProps: {
            role: !isInToolbar ? "toolbar" : "group",
            "aria-orientation": orientation,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabel == null ? ariaLabelledBy : undefined,
            onKeyDownCapture: !isInToolbar ? onKeyDown : undefined,
            onFocusCapture: !isInToolbar ? onFocus : undefined,
            onBlurCapture: !isInToolbar ? onBlur : undefined
        }
    };
}


$parcel$exportWildcard(module.exports, $b132ee173e26a273$exports);


//# sourceMappingURL=main.js.map
