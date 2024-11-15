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
const useUsersData_1 = require("./hooks/useUsersData");
const UsersSelectElement = ({ block, context }) => {
    var _a;
    const [{ value, loading }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const [filter, setFilter] = (0, react_1.useState)('');
    const debouncedFilter = (0, fuselage_hooks_1.useDebouncedValue)(filter, 300);
    const data = (0, useUsersData_1.useUsersData)({ filter: debouncedFilter });
    const handleChange = (0, react_1.useCallback)((value) => {
        if (!Array.isArray(value))
            action({ target: { value } });
    }, [action]);
    return ((0, jsx_runtime_1.jsx)(fuselage_1.AutoComplete, { value: value, placeholder: (_a = block.placeholder) === null || _a === void 0 ? void 0 : _a.text, disabled: loading, options: data, onChange: handleChange, filter: filter, setFilter: setFilter, renderSelected: ({ selected: { value, label } }) => ((0, jsx_runtime_1.jsxs)(fuselage_1.Chip, { height: 'x20', value: value, mie: 4, children: [(0, jsx_runtime_1.jsx)(ui_avatar_1.UserAvatar, { size: 'x20', username: value }), (0, jsx_runtime_1.jsx)(fuselage_1.Box, { verticalAlign: 'middle', is: 'span', margin: 'none', mi: 4, children: label })] })), renderItem: (_a) => {
            var { value, label } = _a, props = __rest(_a, ["value", "label"]);
            return ((0, jsx_runtime_1.jsx)(fuselage_1.Option, Object.assign({}, props, { label: label, avatar: (0, jsx_runtime_1.jsx)(ui_avatar_1.UserAvatar, { username: value, size: 'x20' }) }), value));
        } }));
};
exports.default = UsersSelectElement;
//# sourceMappingURL=UsersSelectElement.js.map