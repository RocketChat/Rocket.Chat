"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUiKitState = void 0;
const fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const react_1 = require("react");
const UiKitContext_1 = require("../contexts/UiKitContext");
const getInitialValue_1 = require("../utils/getInitialValue");
const getElementValueFromState = (actionId, values, initialValue) => {
    var _a, _b;
    return ((_b = (values &&
        ((_a = values[actionId]) === null || _a === void 0 ? void 0 : _a.value))) !== null && _b !== void 0 ? _b : initialValue);
};
const useUiKitState = (element, context) => {
    var _a;
    const { blockId, actionId, appId, dispatchActionConfig } = element;
    const { action, appId: appIdFromContext = undefined, viewId = undefined, updateState, } = (0, react_1.useContext)(UiKitContext_1.UiKitContext);
    const initialValue = (0, getInitialValue_1.getInitialValue)(element);
    const { values, errors } = (0, react_1.useContext)(UiKitContext_1.UiKitContext);
    const _value = getElementValueFromState(actionId, values, initialValue);
    const error = Array.isArray(errors)
        ? (_a = errors.find((error) => Object.keys(error).find((key) => key === actionId))) === null || _a === void 0 ? void 0 : _a[actionId]
        : errors === null || errors === void 0 ? void 0 : errors[actionId];
    const [value, setValue] = (0, fuselage_hooks_1.useSafely)((0, react_1.useState)(_value));
    const [loading, setLoading] = (0, fuselage_hooks_1.useSafely)((0, react_1.useState)(false));
    const actionFunction = (0, fuselage_hooks_1.useMutableCallback)((e) => __awaiter(void 0, void 0, void 0, function* () {
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
    const noLoadStateActionFunction = (0, fuselage_hooks_1.useMutableCallback)((e) => __awaiter(void 0, void 0, void 0, function* () {
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
    const stateFunction = (0, fuselage_hooks_1.useMutableCallback)((e) => __awaiter(void 0, void 0, void 0, function* () {
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
    const result = (0, react_1.useMemo)(() => ({ loading, setLoading, error, value }), [loading, setLoading, error, value]);
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
exports.useUiKitState = useUiKitState;
//# sourceMappingURL=useUiKitState.js.map