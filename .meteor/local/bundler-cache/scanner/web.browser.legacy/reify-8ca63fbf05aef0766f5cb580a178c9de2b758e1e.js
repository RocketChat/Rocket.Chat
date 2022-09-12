"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUiKitState = void 0;
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = require("react");
var kitContext_1 = require("../contexts/kitContext");
var hasInitialValue = function (element) {
    return 'initialValue' in element;
};
var hasInitialOption = function (element) {
    return 'initialOption' in element;
};
var useUiKitState = function (rest, context) {
    var blockId = rest.blockId, actionId = rest.actionId, appId = rest.appId, dispatchActionConfig = rest.dispatchActionConfig;
    var _a = react_1.useContext(kitContext_1.kitContext), action = _a.action, appIdFromContext = _a.appId, viewId = _a.viewId, state = _a.state;
    var initialValue = (hasInitialValue(rest) && rest.initialValue) ||
        (hasInitialOption(rest) && rest.initialOption.value) ||
        undefined;
    var _b = kitContext_1.useUiKitStateValue(actionId, initialValue), _value = _b.value, error = _b.error;
    var _c = fuselage_hooks_1.useSafely(react_1.useState(_value)), value = _c[0], setValue = _c[1];
    var _d = fuselage_hooks_1.useSafely(react_1.useState(false)), loading = _d[0], setLoading = _d[1];
    var actionFunction = fuselage_hooks_1.useMutableCallback(function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var value, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    value = e.target.value;
                    setLoading(true);
                    setValue(value);
                    _a = state;
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, state({ blockId: blockId, appId: appId, actionId: actionId, value: value, viewId: viewId }, e)];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    _a;
                    return [4 /*yield*/, action({
                            blockId: blockId,
                            appId: appId || appIdFromContext,
                            actionId: actionId,
                            value: value,
                            viewId: viewId,
                        }, e)];
                case 3:
                    _b.sent();
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); });
    // Used for triggering actions on text inputs. Removing the load state
    // makes the text input field remain focused after running the action
    var noLoadStateActionFunction = fuselage_hooks_1.useMutableCallback(function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var value, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    value = e.target.value;
                    setValue(value);
                    _a = state;
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, state({ blockId: blockId, appId: appId, actionId: actionId, value: value, viewId: viewId }, e)];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    _a;
                    return [4 /*yield*/, action({
                            blockId: blockId,
                            appId: appId || appIdFromContext,
                            actionId: actionId,
                            value: value,
                            viewId: viewId,
                            dispatchActionConfig: dispatchActionConfig,
                        }, e)];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var stateFunction = fuselage_hooks_1.useMutableCallback(function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var value;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    value = e.target.value;
                    setValue(value);
                    return [4 /*yield*/, state({
                            blockId: blockId,
                            appId: appId || appIdFromContext,
                            actionId: actionId,
                            value: value,
                            viewId: viewId,
                        }, e)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var result = react_1.useMemo(function () { return ({ loading: loading, setLoading: setLoading, error: error, value: value }); }, [loading, setLoading, error, value]);
    if (rest.type === 'plain_text_input' &&
        Array.isArray(rest === null || rest === void 0 ? void 0 : rest.dispatchActionConfig) &&
        rest.dispatchActionConfig.includes('on_character_entered')) {
        return [result, noLoadStateActionFunction];
    }
    if ((context &&
        [UiKit.BlockContext.SECTION, UiKit.BlockContext.ACTION].includes(context)) ||
        (Array.isArray(rest === null || rest === void 0 ? void 0 : rest.dispatchActionConfig) &&
            rest.dispatchActionConfig.includes('on_item_selected'))) {
        return [result, actionFunction];
    }
    return [result, stateFunction];
};
exports.useUiKitState = useUiKitState;
//# sourceMappingURL=useUiKitState.js.map