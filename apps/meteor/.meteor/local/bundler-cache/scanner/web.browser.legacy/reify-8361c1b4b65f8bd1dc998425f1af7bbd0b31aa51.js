"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
const ui_avatar_1 = require("@rocket.chat/ui-avatar");
const react_1 = require("react");
const useUiKitState_1 = require("../../hooks/useUiKitState");
const useChannelsData_1 = require("./hooks/useChannelsData");
const ChannelsSelectElement = ({ block, context, }) => {
    const [{ value, loading }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const [filter, setFilter] = (0, react_1.useState)('');
    const filterDebounced = (0, fuselage_hooks_1.useDebouncedValue)(filter, 300);
    const options = (0, useChannelsData_1.useChannelsData)({ filter: filterDebounced });
    const handleChange = (0, react_1.useCallback)((value) => {
        if (!Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return ((0, jsx_runtime_1.jsx)(fuselage_1.AutoComplete, { value: value, onChange: handleChange, disabled: loading, filter: filter, setFilter: setFilter, renderSelected: ({ selected: { value, label } }) => ((0, jsx_runtime_1.jsxs)(fuselage_1.Chip, { height: 'x20', value: value, mie: 4, children: [(0, jsx_runtime_1.jsx)(ui_avatar_1.RoomAvatar, { size: 'x20', room: Object.assign({ type: (label === null || label === void 0 ? void 0 : label.type) || 'c', _id: value }, label) }), (0, jsx_runtime_1.jsx)(fuselage_1.Box, { verticalAlign: 'middle', is: 'span', margin: 'none', mi: 4, children: label.name })] })), renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return ((0, jsx_runtime_1.jsx)(fuselage_1.Option, Object.assign({}, props, { label: label.name, avatar: (0, jsx_runtime_1.jsx)(ui_avatar_1.RoomAvatar, Object.assign({ size: 'x20', room: {
                        type: label.type,
                        _id: value,
                        avatarETag: label.avatarETag,
                    } }, props)) }), value));
        }, options: options }));
};
exports.default = (0, react_1.memo)(ChannelsSelectElement);
//# sourceMappingURL=ChannelsSelectElement.js.map