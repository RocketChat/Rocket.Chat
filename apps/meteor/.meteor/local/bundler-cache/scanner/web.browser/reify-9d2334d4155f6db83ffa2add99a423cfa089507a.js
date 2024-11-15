module.export({useValueEffect:()=>$1dbecbe27a04f9af$export$14d238f342723f25});let $8ae05eaa5c114e9c$export$7f54fc3180508a52;module.link("./useEffectEvent.module.js",{useEffectEvent(v){$8ae05eaa5c114e9c$export$7f54fc3180508a52=v}},0);let $f0a04ccd8dbdd83b$export$e5c5a5f917a5871c;module.link("./useLayoutEffect.module.js",{useLayoutEffect(v){$f0a04ccd8dbdd83b$export$e5c5a5f917a5871c=v}},1);let $fCAlL$useState,$fCAlL$useRef;module.link("react",{useState(v){$fCAlL$useState=v},useRef(v){$fCAlL$useRef=v}},2);



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

function $1dbecbe27a04f9af$export$14d238f342723f25(defaultValue) {
    let [value, setValue] = (0, $fCAlL$useState)(defaultValue);
    let effect = (0, $fCAlL$useRef)(null);
    // Store the function in a ref so we can always access the current version
    // which has the proper `value` in scope.
    let nextRef = (0, $8ae05eaa5c114e9c$export$7f54fc3180508a52)(()=>{
        if (!effect.current) return;
        // Run the generator to the next yield.
        let newValue = effect.current.next();
        // If the generator is done, reset the effect.
        if (newValue.done) {
            effect.current = null;
            return;
        }
        // If the value is the same as the current value,
        // then continue to the next yield. Otherwise,
        // set the value in state and wait for the next layout effect.
        if (value === newValue.value) nextRef();
        else setValue(newValue.value);
    });
    (0, $f0a04ccd8dbdd83b$export$e5c5a5f917a5871c)(()=>{
        // If there is an effect currently running, continue to the next yield.
        if (effect.current) nextRef();
    });
    let queue = (0, $8ae05eaa5c114e9c$export$7f54fc3180508a52)((fn)=>{
        effect.current = fn(value);
        nextRef();
    });
    return [
        value,
        queue
    ];
}



//# sourceMappingURL=useValueEffect.module.js.map
