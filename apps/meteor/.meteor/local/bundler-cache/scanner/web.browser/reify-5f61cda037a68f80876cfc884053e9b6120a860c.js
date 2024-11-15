module.export({Pressable:()=>$3b117e43dc0ca95d$export$27c701ed9e449e99});let $f6c31cce2adf654f$export$45712eceda6fad21;module.link("./usePress.module.js",{usePress(v){$f6c31cce2adf654f$export$45712eceda6fad21=v}},0);let $hhDyF$useObjectRef,$hhDyF$mergeProps;module.link("@react-aria/utils",{useObjectRef(v){$hhDyF$useObjectRef=v},mergeProps(v){$hhDyF$mergeProps=v}},1);let $hhDyF$react;module.link("react",{default(v){$hhDyF$react=v}},2);



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


const $3b117e43dc0ca95d$export$27c701ed9e449e99 = /*#__PURE__*/ (0, $hhDyF$react).forwardRef(({ children: children, ...props }, ref)=>{
    ref = (0, $hhDyF$useObjectRef)(ref);
    let { pressProps: pressProps } = (0, $f6c31cce2adf654f$export$45712eceda6fad21)({
        ...props,
        ref: ref
    });
    let child = (0, $hhDyF$react).Children.only(children);
    return /*#__PURE__*/ (0, $hhDyF$react).cloneElement(child, // @ts-ignore
    {
        ref: ref,
        ...(0, $hhDyF$mergeProps)(child.props, pressProps)
    });
});



//# sourceMappingURL=Pressable.module.js.map
