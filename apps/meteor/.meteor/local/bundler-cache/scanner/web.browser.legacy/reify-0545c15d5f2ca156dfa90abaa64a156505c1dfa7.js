"use strict";
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
exports.useUsersData = void 0;
const ui_contexts_1 = require("@rocket.chat/ui-contexts");
const react_query_1 = require("@tanstack/react-query");
const useUsersData = ({ filter }) => {
    const getUsers = (0, ui_contexts_1.useEndpoint)('GET', '/v1/users.autocomplete');
    const { data } = (0, react_query_1.useQuery)(['users.autoComplete', filter], () => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield getUsers({
            selector: JSON.stringify({ term: filter }),
        });
        const options = users.items.map((item) => ({
            value: item.username,
            label: item.name || item.username,
        }));
        return options || [];
    }), { keepPreviousData: true });
    return data;
};
exports.useUsersData = useUsersData;
//# sourceMappingURL=useUsersData.js.map