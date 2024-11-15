var $6vrKB$reactariautils = require("@react-aria/utils");
var $6vrKB$reactariafocus = require("@react-aria/focus");
var $6vrKB$react = require("react");
var $6vrKB$reactariaoverlays = require("@react-aria/overlays");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDialog", () => $e7b76b4fae4e4c55$export$d55e7ee900f34e93);
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



function $e7b76b4fae4e4c55$export$d55e7ee900f34e93(props, ref) {
    let { role: role = "dialog"  } = props;
    let titleId = (0, $6vrKB$reactariautils.useSlotId)();
    titleId = props["aria-label"] ? undefined : titleId;
    let isRefocusing = (0, $6vrKB$react.useRef)(false);
    // Focus the dialog itself on mount, unless a child element is already focused.
    (0, $6vrKB$react.useEffect)(()=>{
        if (ref.current && !ref.current.contains(document.activeElement)) {
            (0, $6vrKB$reactariafocus.focusSafely)(ref.current);
            // Safari on iOS does not move the VoiceOver cursor to the dialog
            // or announce that it has opened until it has rendered. A workaround
            // is to wait for half a second, then blur and re-focus the dialog.
            let timeout = setTimeout(()=>{
                if (document.activeElement === ref.current) {
                    isRefocusing.current = true;
                    ref.current.blur();
                    (0, $6vrKB$reactariafocus.focusSafely)(ref.current);
                    isRefocusing.current = false;
                }
            }, 500);
            return ()=>{
                clearTimeout(timeout);
            };
        }
    }, [
        ref
    ]);
    (0, $6vrKB$reactariaoverlays.useOverlayFocusContain)();
    // We do not use aria-modal due to a Safari bug which forces the first focusable element to be focused
    // on mount when inside an iframe, no matter which element we programmatically focus.
    // See https://bugs.webkit.org/show_bug.cgi?id=211934.
    // useModal sets aria-hidden on all elements outside the dialog, so the dialog will behave as a modal
    // even without aria-modal on the dialog itself.
    return {
        dialogProps: {
            ...(0, $6vrKB$reactariautils.filterDOMProps)(props, {
                labelable: true
            }),
            role: role,
            tabIndex: -1,
            "aria-labelledby": props["aria-labelledby"] || titleId,
            // Prevent blur events from reaching useOverlay, which may cause
            // popovers to close. Since focus is contained within the dialog,
            // we don't want this to occur due to the above useEffect.
            onBlur: (e)=>{
                if (isRefocusing.current) e.stopPropagation();
            }
        },
        titleProps: {
            id: titleId
        }
    };
}




//# sourceMappingURL=main.js.map
