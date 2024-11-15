module.export({useUiKitState:()=>useUiKitState},true);let useMutableCallback,useSafely;module.link('@rocket.chat/fuselage-hooks',{useMutableCallback(v){useMutableCallback=v},useSafely(v){useSafely=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let useContext,useMemo,useState;module.link('react',{useContext(v){useContext=v},useMemo(v){useMemo=v},useState(v){useState=v}},2);let UiKitContext;module.link('../contexts/UiKitContext',{UiKitContext(v){UiKitContext=v}},3);let getInitialValue;module.link('../utils/getInitialValue',{getInitialValue(v){getInitialValue=v}},4);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





const getElementValueFromState = (actionId, values, initialValue) => {
    var _a, _b;
    return ((_b = (values &&
        ((_a = values[actionId]) === null || _a === void 0 ? void 0 : _a.value))) !== null && _b !== void 0 ? _b : initialValue);
};
const useUiKitState = (element, context) => {
    var _a;
    const { blockId, actionId, appId, dispatchActionConfig } = element;
    const { action, appId: appIdFromContext = undefined, viewId = undefined, updateState, } = useContext(UiKitContext);
    const initialValue = getInitialValue(element);
    const { values, errors } = useContext(UiKitContext);
    const _value = getElementValueFromState(actionId, values, initialValue);
    const error = Array.isArray(errors)
        ? (_a = errors.find((error) => Object.keys(error).find((key) => key === actionId))) === null || _a === void 0 ? void 0 : _a[actionId]
        : errors === null || errors === void 0 ? void 0 : errors[actionId];
    const [value, setValue] = useSafely(useState(_value));
    const [loading, setLoading] = useSafely(useState(false));
    const actionFunction = useMutableCallback((e) => __awaiter(void 0, void 0, void 0, function* () {
        const { target: { value: elValue }, } = e;
        setLoading(true);
        if (Array.isArray(value)) {
            if (Array.isArray(elValue)) {
                setValue(elValue);
            }
            else {
                const idx = value.findIndex((value) => value === elValue);
                if (idx > -1) {
                    setValue(value.filter((_, i) => i !== idx));
                }
                else {
                    setValue([...value, elValue]);
                }
            }
        }
        else {
            setValue(elValue);
        }
        yield (updateState === null || updateState === void 0 ? void 0 : updateState({ blockId, appId, actionId, value: elValue, viewId }, e));
        yield action({
            blockId,
            appId: appId || appIdFromContext || 'core',
            actionId,
            value: elValue,
            viewId,
        }, e);
        setLoading(false);
    }));
    // Used for triggering actions on text inputs. Removing the load state
    // makes the text input field remain focused after running the action
    const noLoadStateActionFunction = useMutableCallback((e) => __awaiter(void 0, void 0, void 0, function* () {
        const { target: { value }, } = e;
        setValue(value);
        updateState &&
            (yield updateState({ blockId, appId, actionId, value, viewId }, e));
        yield action({
            blockId,
            appId: appId || appIdFromContext || 'core',
            actionId,
            value,
            viewId,
            dispatchActionConfig,
        }, e);
    }));
    const stateFunction = useMutableCallback((e) => __awaiter(void 0, void 0, void 0, function* () {
        const { target: { value }, } = e;
        setValue(value);
        yield (updateState === null || updateState === void 0 ? void 0 : updateState({
            blockId,
            appId: appId || appIdFromContext || 'core',
            actionId,
            value,
            viewId,
        }, e));
    }));
    const result = useMemo(() => ({ loading, setLoading, error, value }), [loading, setLoading, error, value]);
    if (element.type === 'plain_text_input' &&
        Array.isArray(element === null || element === void 0 ? void 0 : element.dispatchActionConfig) &&
        element.dispatchActionConfig.includes('on_character_entered')) {
        return [result, noLoadStateActionFunction];
    }
    if ((context &&
        [UiKit.BlockContext.SECTION, UiKit.BlockContext.ACTION].includes(context)) ||
        (Array.isArray(element === null || element === void 0 ? void 0 : element.dispatchActionConfig) &&
            element.dispatchActionConfig.includes('on_item_selected'))) {
        return [result, actionFunction];
    }
    return [result, stateFunction];
};
//# sourceMappingURL=useUiKitState.js.map