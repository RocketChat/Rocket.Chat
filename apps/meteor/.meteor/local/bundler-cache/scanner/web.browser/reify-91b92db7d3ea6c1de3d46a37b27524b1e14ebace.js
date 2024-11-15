module.export({PressResponder:()=>$f1ab8c75478c6f73$export$3351871ee4b288b8,ClearPressResponder:()=>$f1ab8c75478c6f73$export$cf75428e0b9ed1ea});let $ae1eeba8b9eafd08$export$5165eccb35aaadb5;module.link("./context.module.js",{PressResponderContext(v){$ae1eeba8b9eafd08$export$5165eccb35aaadb5=v}},0);let $87RPk$useObjectRef,$87RPk$mergeProps,$87RPk$useSyncRef;module.link("@react-aria/utils",{useObjectRef(v){$87RPk$useObjectRef=v},mergeProps(v){$87RPk$mergeProps=v},useSyncRef(v){$87RPk$useSyncRef=v}},1);let $87RPk$react,$87RPk$useRef,$87RPk$useContext,$87RPk$useEffect,$87RPk$useMemo;module.link("react",{default(v){$87RPk$react=v},useRef(v){$87RPk$useRef=v},useContext(v){$87RPk$useContext=v},useEffect(v){$87RPk$useEffect=v},useMemo(v){$87RPk$useMemo=v}},2);



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


const $f1ab8c75478c6f73$export$3351871ee4b288b8 = /*#__PURE__*/ (0, $87RPk$react).forwardRef(({ children: children, ...props }, ref)=>{
    let isRegistered = (0, $87RPk$useRef)(false);
    let prevContext = (0, $87RPk$useContext)((0, $ae1eeba8b9eafd08$export$5165eccb35aaadb5));
    ref = (0, $87RPk$useObjectRef)(ref || (prevContext === null || prevContext === void 0 ? void 0 : prevContext.ref));
    let context = (0, $87RPk$mergeProps)(prevContext || {}, {
        ...props,
        ref: ref,
        register () {
            isRegistered.current = true;
            if (prevContext) prevContext.register();
        }
    });
    (0, $87RPk$useSyncRef)(prevContext, ref);
    (0, $87RPk$useEffect)(()=>{
        if (!isRegistered.current) {
            console.warn("A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.");
            isRegistered.current = true; // only warn once in strict mode.
        }
    }, []);
    return /*#__PURE__*/ (0, $87RPk$react).createElement((0, $ae1eeba8b9eafd08$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
});
function $f1ab8c75478c6f73$export$cf75428e0b9ed1ea({ children: children }) {
    let context = (0, $87RPk$useMemo)(()=>({
            register: ()=>{}
        }), []);
    return /*#__PURE__*/ (0, $87RPk$react).createElement((0, $ae1eeba8b9eafd08$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
}



//# sourceMappingURL=PressResponder.module.js.map
