module.export({useVisuallyHidden:()=>$5c3e21d68f1c4674$export$a966af930f325cab,VisuallyHidden:()=>$5c3e21d68f1c4674$export$439d29a4e110a164});let $9BxnE$mergeProps;module.link("@react-aria/utils",{mergeProps(v){$9BxnE$mergeProps=v}},0);let $9BxnE$react,$9BxnE$useState,$9BxnE$useMemo;module.link("react",{default(v){$9BxnE$react=v},useState(v){$9BxnE$useState=v},useMemo(v){$9BxnE$useMemo=v}},1);let $9BxnE$useFocusWithin;module.link("@react-aria/interactions",{useFocusWithin(v){$9BxnE$useFocusWithin=v}},2);



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


const $5c3e21d68f1c4674$var$styles = {
    border: 0,
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    width: "1px",
    whiteSpace: "nowrap"
};
function $5c3e21d68f1c4674$export$a966af930f325cab(props = {}) {
    let { style: style , isFocusable: isFocusable  } = props;
    let [isFocused, setFocused] = (0, $9BxnE$useState)(false);
    let { focusWithinProps: focusWithinProps  } = (0, $9BxnE$useFocusWithin)({
        isDisabled: !isFocusable,
        onFocusWithinChange: (val)=>setFocused(val)
    });
    // If focused, don't hide the element.
    let combinedStyles = (0, $9BxnE$useMemo)(()=>{
        if (isFocused) return style;
        else if (style) return {
            ...$5c3e21d68f1c4674$var$styles,
            ...style
        };
        else return $5c3e21d68f1c4674$var$styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isFocused
    ]);
    return {
        visuallyHiddenProps: {
            ...focusWithinProps,
            style: combinedStyles
        }
    };
}
function $5c3e21d68f1c4674$export$439d29a4e110a164(props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { children: children , elementType: Element = "div" , isFocusable: isFocusable , style: style , ...otherProps } = props;
    let { visuallyHiddenProps: visuallyHiddenProps  } = $5c3e21d68f1c4674$export$a966af930f325cab(props);
    return /*#__PURE__*/ (0, $9BxnE$react).createElement(Element, (0, $9BxnE$mergeProps)(otherProps, visuallyHiddenProps), children);
}





//# sourceMappingURL=module.js.map
