var $eeQ2i$reactariautils = require("@react-aria/utils");
var $eeQ2i$reactariafocus = require("@react-aria/focus");
var $eeQ2i$reactariainteractions = require("@react-aria/interactions");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useButton", () => $988353faa005faf8$export$ea18c227d4417cc3);
$parcel$export(module.exports, "useToggleButton", () => $c49208f7d2aac50b$export$51e84d46ca0bc451);
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



function $988353faa005faf8$export$ea18c227d4417cc3(props, ref) {
    let { elementType: elementType = "button" , isDisabled: isDisabled , onPress: onPress , onPressStart: onPressStart , onPressEnd: onPressEnd , onPressChange: onPressChange , preventFocusOnPress: // @ts-ignore - undocumented
    preventFocusOnPress , allowFocusWhenDisabled: // @ts-ignore - undocumented
    allowFocusWhenDisabled , // @ts-ignore
    onClick: deprecatedOnClick , href: href , target: target , rel: rel , type: type = "button"  } = props;
    let additionalProps;
    if (elementType === "button") additionalProps = {
        type: type,
        disabled: isDisabled
    };
    else additionalProps = {
        role: "button",
        tabIndex: isDisabled ? undefined : 0,
        href: elementType === "a" && isDisabled ? undefined : href,
        target: elementType === "a" ? target : undefined,
        type: elementType === "input" ? type : undefined,
        disabled: elementType === "input" ? isDisabled : undefined,
        "aria-disabled": !isDisabled || elementType === "input" ? undefined : isDisabled,
        rel: elementType === "a" ? rel : undefined
    };
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $eeQ2i$reactariainteractions.usePress)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPress: onPress,
        isDisabled: isDisabled,
        preventFocusOnPress: preventFocusOnPress,
        ref: ref
    });
    let { focusableProps: focusableProps  } = (0, $eeQ2i$reactariafocus.useFocusable)(props, ref);
    if (allowFocusWhenDisabled) focusableProps.tabIndex = isDisabled ? -1 : focusableProps.tabIndex;
    let buttonProps = (0, $eeQ2i$reactariautils.mergeProps)(focusableProps, pressProps, (0, $eeQ2i$reactariautils.filterDOMProps)(props, {
        labelable: true
    }));
    return {
        isPressed: isPressed,
        buttonProps: (0, $eeQ2i$reactariautils.mergeProps)(additionalProps, buttonProps, {
            "aria-haspopup": props["aria-haspopup"],
            "aria-expanded": props["aria-expanded"],
            "aria-controls": props["aria-controls"],
            "aria-pressed": props["aria-pressed"],
            onClick: (e)=>{
                if (deprecatedOnClick) {
                    deprecatedOnClick(e);
                    console.warn("onClick is deprecated, please use onPress");
                }
            }
        })
    };
}


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


function $c49208f7d2aac50b$export$51e84d46ca0bc451(props, state, ref) {
    const { isSelected: isSelected  } = state;
    const { isPressed: isPressed , buttonProps: buttonProps  } = (0, $988353faa005faf8$export$ea18c227d4417cc3)({
        ...props,
        onPress: (0, $eeQ2i$reactariautils.chain)(state.toggle, props.onPress)
    }, ref);
    return {
        isPressed: isPressed,
        buttonProps: (0, $eeQ2i$reactariautils.mergeProps)(buttonProps, {
            "aria-pressed": isSelected
        })
    };
}




//# sourceMappingURL=main.js.map
