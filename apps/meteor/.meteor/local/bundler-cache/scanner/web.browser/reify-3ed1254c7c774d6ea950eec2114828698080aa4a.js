module.export({useFormReset:()=>$99facab73266f662$export$5add1d006293d136});let $8ae05eaa5c114e9c$export$7f54fc3180508a52;module.link("./useEffectEvent.module.js",{useEffectEvent(v){$8ae05eaa5c114e9c$export$7f54fc3180508a52=v}},0);let $8rM3G$useRef,$8rM3G$useEffect;module.link("react",{useRef(v){$8rM3G$useRef=v},useEffect(v){$8rM3G$useEffect=v}},1);


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

function $99facab73266f662$export$5add1d006293d136(ref, initialValue, onReset) {
    let resetValue = (0, $8rM3G$useRef)(initialValue);
    let handleReset = (0, $8ae05eaa5c114e9c$export$7f54fc3180508a52)(()=>{
        if (onReset) onReset(resetValue.current);
    });
    (0, $8rM3G$useEffect)(()=>{
        var _ref_current;
        let form = ref === null || ref === void 0 ? void 0 : (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.form;
        form === null || form === void 0 ? void 0 : form.addEventListener('reset', handleReset);
        return ()=>{
            form === null || form === void 0 ? void 0 : form.removeEventListener('reset', handleReset);
        };
    }, [
        ref,
        handleReset
    ]);
}



//# sourceMappingURL=useFormReset.module.js.map
