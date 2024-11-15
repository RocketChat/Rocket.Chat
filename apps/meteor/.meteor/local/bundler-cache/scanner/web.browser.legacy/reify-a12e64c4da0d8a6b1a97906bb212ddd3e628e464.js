"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAccountsCustomFields = void 0;
const react_1 = require("react");
const useSetting_1 = require("./useSetting");
const useAccountsCustomFields = () => {
    const accountsCustomFieldsJSON = (0, useSetting_1.useSetting)('Accounts_CustomFields');
    return (0, react_1.useMemo)(() => {
        if (typeof accountsCustomFieldsJSON !== 'string' || accountsCustomFieldsJSON.trim() === '') {
            return [];
        }
        try {
            return Object.entries(JSON.parse(accountsCustomFieldsJSON)).map(([fieldName, fieldData]) => {
                return Object.assign(Object.assign({}, fieldData), { name: fieldName });
            });
        }
        catch (_a) {
            console.error('Invalid JSON for Accounts_CustomFields');
        }
        return [];
    }, [accountsCustomFieldsJSON]);
};
exports.useAccountsCustomFields = useAccountsCustomFields;
//# sourceMappingURL=useAccountsCustomFields.js.map