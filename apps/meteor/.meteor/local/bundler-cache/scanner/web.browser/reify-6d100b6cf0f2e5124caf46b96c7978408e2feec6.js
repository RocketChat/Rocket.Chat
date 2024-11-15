module.export({FocusRing:()=>$907718708eab68af$export$1a38b4ad7f578e1d});let $f7dceffc5ad7768b$export$4e328f61c538687f;module.link("./useFocusRing.module.js",{useFocusRing(v){$f7dceffc5ad7768b$export$4e328f61c538687f=v}},0);let $hAmeg$clsx;module.link("clsx",{default(v){$hAmeg$clsx=v}},1);let $hAmeg$mergeProps;module.link("@react-aria/utils",{mergeProps(v){$hAmeg$mergeProps=v}},2);let $hAmeg$react;module.link("react",{default(v){$hAmeg$react=v}},3);




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



function $907718708eab68af$export$1a38b4ad7f578e1d(props) {
    let { children: children, focusClass: focusClass, focusRingClass: focusRingClass } = props;
    let { isFocused: isFocused, isFocusVisible: isFocusVisible, focusProps: focusProps } = (0, $f7dceffc5ad7768b$export$4e328f61c538687f)(props);
    let child = (0, $hAmeg$react).Children.only(children);
    return /*#__PURE__*/ (0, $hAmeg$react).cloneElement(child, (0, $hAmeg$mergeProps)(child.props, {
        ...focusProps,
        className: (0, $hAmeg$clsx)({
            [focusClass || '']: isFocused,
            [focusRingClass || '']: isFocusVisible
        })
    }));
}



//# sourceMappingURL=FocusRing.module.js.map
