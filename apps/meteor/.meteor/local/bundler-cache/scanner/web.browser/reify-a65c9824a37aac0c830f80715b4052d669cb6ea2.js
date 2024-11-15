module.export({useButton:()=>$701a24aa0da5b062$export$ea18c227d4417cc3,useToggleButton:()=>$55f54f7887471b58$export$51e84d46ca0bc451});let $cE0pI$mergeProps,$cE0pI$filterDOMProps,$cE0pI$chain;module.link("@react-aria/utils",{mergeProps(v){$cE0pI$mergeProps=v},filterDOMProps(v){$cE0pI$filterDOMProps=v},chain(v){$cE0pI$chain=v}},0);let $cE0pI$useFocusable;module.link("@react-aria/focus",{useFocusable(v){$cE0pI$useFocusable=v}},1);let $cE0pI$usePress;module.link("@react-aria/interactions",{usePress(v){$cE0pI$usePress=v}},2);



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



function $701a24aa0da5b062$export$ea18c227d4417cc3(props, ref) {
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
    let { pressProps: pressProps , isPressed: isPressed  } = (0, $cE0pI$usePress)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPress: onPress,
        isDisabled: isDisabled,
        preventFocusOnPress: preventFocusOnPress,
        ref: ref
    });
    let { focusableProps: focusableProps  } = (0, $cE0pI$useFocusable)(props, ref);
    if (allowFocusWhenDisabled) focusableProps.tabIndex = isDisabled ? -1 : focusableProps.tabIndex;
    let buttonProps = (0, $cE0pI$mergeProps)(focusableProps, pressProps, (0, $cE0pI$filterDOMProps)(props, {
        labelable: true
    }));
    return {
        isPressed: isPressed,
        buttonProps: (0, $cE0pI$mergeProps)(additionalProps, buttonProps, {
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


function $55f54f7887471b58$export$51e84d46ca0bc451(props, state, ref) {
    const { isSelected: isSelected  } = state;
    const { isPressed: isPressed , buttonProps: buttonProps  } = (0, $701a24aa0da5b062$export$ea18c227d4417cc3)({
        ...props,
        onPress: (0, $cE0pI$chain)(state.toggle, props.onPress)
    }, ref);
    return {
        isPressed: isPressed,
        buttonProps: (0, $cE0pI$mergeProps)(buttonProps, {
            "aria-pressed": isSelected
        })
    };
}





//# sourceMappingURL=module.js.map
