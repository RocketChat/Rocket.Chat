module.export({useFocusRing:()=>$f7dceffc5ad7768b$export$4e328f61c538687f});let $isWE5$isFocusVisible,$isWE5$useFocusVisibleListener,$isWE5$useFocus,$isWE5$useFocusWithin;module.link("@react-aria/interactions",{isFocusVisible(v){$isWE5$isFocusVisible=v},useFocusVisibleListener(v){$isWE5$useFocusVisibleListener=v},useFocus(v){$isWE5$useFocus=v},useFocusWithin(v){$isWE5$useFocusWithin=v}},0);let $isWE5$useRef,$isWE5$useState,$isWE5$useCallback;module.link("react",{useRef(v){$isWE5$useRef=v},useState(v){$isWE5$useState=v},useCallback(v){$isWE5$useCallback=v}},1);




function $f7dceffc5ad7768b$export$4e328f61c538687f(props = {}) {
    let { autoFocus: autoFocus = false, isTextInput: isTextInput, within: within } = props;
    let state = (0, $isWE5$useRef)({
        isFocused: false,
        isFocusVisible: autoFocus || (0, $isWE5$isFocusVisible)()
    });
    let [isFocused, setFocused] = (0, $isWE5$useState)(false);
    let [isFocusVisibleState, setFocusVisible] = (0, $isWE5$useState)(()=>state.current.isFocused && state.current.isFocusVisible);
    let updateState = (0, $isWE5$useCallback)(()=>setFocusVisible(state.current.isFocused && state.current.isFocusVisible), []);
    let onFocusChange = (0, $isWE5$useCallback)((isFocused)=>{
        state.current.isFocused = isFocused;
        setFocused(isFocused);
        updateState();
    }, [
        updateState
    ]);
    (0, $isWE5$useFocusVisibleListener)((isFocusVisible)=>{
        state.current.isFocusVisible = isFocusVisible;
        updateState();
    }, [], {
        isTextInput: isTextInput
    });
    let { focusProps: focusProps } = (0, $isWE5$useFocus)({
        isDisabled: within,
        onFocusChange: onFocusChange
    });
    let { focusWithinProps: focusWithinProps } = (0, $isWE5$useFocusWithin)({
        isDisabled: !within,
        onFocusWithinChange: onFocusChange
    });
    return {
        isFocused: isFocused,
        isFocusVisible: isFocusVisibleState,
        focusProps: within ? focusWithinProps : focusProps
    };
}



//# sourceMappingURL=useFocusRing.module.js.map
