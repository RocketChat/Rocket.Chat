var $2Agrv$reactariautils = require("@react-aria/utils");
var $2Agrv$react = require("react");
var $2Agrv$reactariainteractions = require("@react-aria/interactions");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "useVisuallyHidden", () => $b5c81b25cdf7a43c$export$a966af930f325cab);
$parcel$export(module.exports, "VisuallyHidden", () => $b5c81b25cdf7a43c$export$439d29a4e110a164);
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


const $b5c81b25cdf7a43c$var$styles = {
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
function $b5c81b25cdf7a43c$export$a966af930f325cab(props = {}) {
    let { style: style , isFocusable: isFocusable  } = props;
    let [isFocused, setFocused] = (0, $2Agrv$react.useState)(false);
    let { focusWithinProps: focusWithinProps  } = (0, $2Agrv$reactariainteractions.useFocusWithin)({
        isDisabled: !isFocusable,
        onFocusWithinChange: (val)=>setFocused(val)
    });
    // If focused, don't hide the element.
    let combinedStyles = (0, $2Agrv$react.useMemo)(()=>{
        if (isFocused) return style;
        else if (style) return {
            ...$b5c81b25cdf7a43c$var$styles,
            ...style
        };
        else return $b5c81b25cdf7a43c$var$styles;
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
function $b5c81b25cdf7a43c$export$439d29a4e110a164(props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { children: children , elementType: Element = "div" , isFocusable: isFocusable , style: style , ...otherProps } = props;
    let { visuallyHiddenProps: visuallyHiddenProps  } = $b5c81b25cdf7a43c$export$a966af930f325cab(props);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($2Agrv$react))).createElement(Element, (0, $2Agrv$reactariautils.mergeProps)(otherProps, visuallyHiddenProps), children);
}




//# sourceMappingURL=main.js.map
