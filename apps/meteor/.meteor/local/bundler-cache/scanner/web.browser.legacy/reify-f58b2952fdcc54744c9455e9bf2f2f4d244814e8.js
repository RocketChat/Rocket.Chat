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
exports.useChannelsData = void 0;
const ui_contexts_1 = require("@rocket.chat/ui-contexts");
const react_query_1 = require("@tanstack/react-query");
const generateQuery = (term = '') => ({ selector: JSON.stringify({ name: term }) });
const useChannelsData = ({ filter }) => {
    const getRooms = (0, ui_contexts_1.useEndpoint)('GET', '/v1/rooms.autocomplete.channelAndPrivate');
    const { data } = (0, react_query_1.useQuery)(['rooms.autocomplete.channelAndPrivate', filter], () => __awaiter(void 0, void 0, void 0, function* () {
        const channels = yield getRooms(generateQuery(filter));
        const options = channels.items.map(({ fname, name, _id, avatarETag, t }) => ({
            value: _id,
            label: { name: name || fname, avatarETag, type: t },
        }));
        return options || [];
    }), {
        keepPreviousData: true,
    });
    return data;
};
exports.useChannelsData = useChannelsData;
//# sourceMappingURL=useChannelsData.js.map