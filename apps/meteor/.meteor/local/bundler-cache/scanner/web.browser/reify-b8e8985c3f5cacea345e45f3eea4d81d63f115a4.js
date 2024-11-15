module.export({useDialog:()=>$40df3f8667284809$export$d55e7ee900f34e93});let $m1DSs$useSlotId,$m1DSs$filterDOMProps;module.link("@react-aria/utils",{useSlotId(v){$m1DSs$useSlotId=v},filterDOMProps(v){$m1DSs$filterDOMProps=v}},0);let $m1DSs$focusSafely;module.link("@react-aria/focus",{focusSafely(v){$m1DSs$focusSafely=v}},1);let $m1DSs$useRef,$m1DSs$useEffect;module.link("react",{useRef(v){$m1DSs$useRef=v},useEffect(v){$m1DSs$useEffect=v}},2);let $m1DSs$useOverlayFocusContain;module.link("@react-aria/overlays",{useOverlayFocusContain(v){$m1DSs$useOverlayFocusContain=v}},3);




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



function $40df3f8667284809$export$d55e7ee900f34e93(props, ref) {
    let { role: role = "dialog"  } = props;
    let titleId = (0, $m1DSs$useSlotId)();
    titleId = props["aria-label"] ? undefined : titleId;
    let isRefocusing = (0, $m1DSs$useRef)(false);
    // Focus the dialog itself on mount, unless a child element is already focused.
    (0, $m1DSs$useEffect)(()=>{
        if (ref.current && !ref.current.contains(document.activeElement)) {
            (0, $m1DSs$focusSafely)(ref.current);
            // Safari on iOS does not move the VoiceOver cursor to the dialog
            // or announce that it has opened until it has rendered. A workaround
            // is to wait for half a second, then blur and re-focus the dialog.
            let timeout = setTimeout(()=>{
                if (document.activeElement === ref.current) {
                    isRefocusing.current = true;
                    ref.current.blur();
                    (0, $m1DSs$focusSafely)(ref.current);
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
    (0, $m1DSs$useOverlayFocusContain)();
    // We do not use aria-modal due to a Safari bug which forces the first focusable element to be focused
    // on mount when inside an iframe, no matter which element we programmatically focus.
    // See https://bugs.webkit.org/show_bug.cgi?id=211934.
    // useModal sets aria-hidden on all elements outside the dialog, so the dialog will behave as a modal
    // even without aria-modal on the dialog itself.
    return {
        dialogProps: {
            ...(0, $m1DSs$filterDOMProps)(props, {
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





//# sourceMappingURL=module.js.map
