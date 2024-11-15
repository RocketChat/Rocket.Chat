var $3NNeN$reactariautils = require("@react-aria/utils");
var $3NNeN$reactariafocus = require("@react-aria/focus");
var $3NNeN$reactariainteractions = require("@react-aria/interactions");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLink", () => $fbe6b19572273b2f$export$dcf14c9974fe2767);
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


function $fbe6b19572273b2f$export$dcf14c9974fe2767(props, ref) {
    let { elementType: elementType = "a" , onPress: onPress , onPressStart: onPressStart , onPressEnd: onPressEnd , // @ts-ignore
    onClick: deprecatedOnClick , isDisabled: isDisabled , ...otherProps } = props;
    let linkProps = {};
    if (elementType !== "a") linkProps = {
        role: "link",
        tabIndex: !isDisabled ? 0 : undefined
    };
    let { focusableProps: focusableProps  } = (0, $3NNeN$reactariafocus.useFocusable)(props, ref);
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $3NNeN$reactariainteractions.usePress)({
        onPress: onPress,
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        isDisabled: isDisabled,
        ref: ref
    });
    let domProps = (0, $3NNeN$reactariautils.filterDOMProps)(otherProps, {
        labelable: true
    });
    let interactionHandlers = (0, $3NNeN$reactariautils.mergeProps)(focusableProps, pressProps);
    return {
        isPressed: isPressed,
        linkProps: (0, $3NNeN$reactariautils.mergeProps)(domProps, {
            ...interactionHandlers,
            ...linkProps,
            "aria-disabled": isDisabled || undefined,
            "aria-current": props["aria-current"],
            onClick: (e)=>{
                var _pressProps_onClick;
                (_pressProps_onClick = pressProps.onClick) === null || _pressProps_onClick === void 0 ? void 0 : _pressProps_onClick.call(pressProps, e);
                if (deprecatedOnClick) {
                    deprecatedOnClick(e);
                    console.warn("onClick is deprecated, please use onPress");
                }
            }
        })
    };
}




//# sourceMappingURL=main.js.map
