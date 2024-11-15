module.export({FocusableProvider:()=>$e6afbd83fe6ebbd2$export$13f3202a3e5ddd5,useFocusable:()=>$e6afbd83fe6ebbd2$export$4c014de7c8940b4c});let $6a99195332edec8b$export$80f3e147d781571c;module.link("./focusSafely.module.js",{focusSafely(v){$6a99195332edec8b$export$80f3e147d781571c=v}},0);let $h8xso$useSyncRef,$h8xso$useObjectRef,$h8xso$mergeProps;module.link("@react-aria/utils",{useSyncRef(v){$h8xso$useSyncRef=v},useObjectRef(v){$h8xso$useObjectRef=v},mergeProps(v){$h8xso$mergeProps=v}},1);let $h8xso$react,$h8xso$useContext,$h8xso$useRef,$h8xso$useEffect;module.link("react",{default(v){$h8xso$react=v},useContext(v){$h8xso$useContext=v},useRef(v){$h8xso$useRef=v},useEffect(v){$h8xso$useEffect=v}},2);let $h8xso$useFocus,$h8xso$useKeyboard;module.link("@react-aria/interactions",{useFocus(v){$h8xso$useFocus=v},useKeyboard(v){$h8xso$useKeyboard=v}},3);




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



let $e6afbd83fe6ebbd2$var$FocusableContext = /*#__PURE__*/ (0, $h8xso$react).createContext(null);
function $e6afbd83fe6ebbd2$var$useFocusableContext(ref) {
    let context = (0, $h8xso$useContext)($e6afbd83fe6ebbd2$var$FocusableContext) || {};
    (0, $h8xso$useSyncRef)(context, ref);
    // eslint-disable-next-line
    let { ref: _, ...otherProps } = context;
    return otherProps;
}
/**
 * Provides DOM props to the nearest focusable child.
 */ function $e6afbd83fe6ebbd2$var$FocusableProvider(props, ref) {
    let { children: children, ...otherProps } = props;
    let objRef = (0, $h8xso$useObjectRef)(ref);
    let context = {
        ...otherProps,
        ref: objRef
    };
    return /*#__PURE__*/ (0, $h8xso$react).createElement($e6afbd83fe6ebbd2$var$FocusableContext.Provider, {
        value: context
    }, children);
}
let $e6afbd83fe6ebbd2$export$13f3202a3e5ddd5 = /*#__PURE__*/ (0, $h8xso$react).forwardRef($e6afbd83fe6ebbd2$var$FocusableProvider);
function $e6afbd83fe6ebbd2$export$4c014de7c8940b4c(props, domRef) {
    let { focusProps: focusProps } = (0, $h8xso$useFocus)(props);
    let { keyboardProps: keyboardProps } = (0, $h8xso$useKeyboard)(props);
    let interactions = (0, $h8xso$mergeProps)(focusProps, keyboardProps);
    let domProps = $e6afbd83fe6ebbd2$var$useFocusableContext(domRef);
    let interactionProps = props.isDisabled ? {} : domProps;
    let autoFocusRef = (0, $h8xso$useRef)(props.autoFocus);
    (0, $h8xso$useEffect)(()=>{
        if (autoFocusRef.current && domRef.current) (0, $6a99195332edec8b$export$80f3e147d781571c)(domRef.current);
        autoFocusRef.current = false;
    }, [
        domRef
    ]);
    return {
        focusableProps: (0, $h8xso$mergeProps)({
            ...interactions,
            tabIndex: props.excludeFromTabOrder && !props.isDisabled ? -1 : undefined
        }, interactionProps)
    };
}



//# sourceMappingURL=useFocusable.module.js.map
