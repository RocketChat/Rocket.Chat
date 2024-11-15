module.export({useChannelsData:()=>useChannelsData},true);let useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v}},0);let useQuery;module.link('@tanstack/react-query',{useQuery(v){useQuery=v}},1);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const generateQuery = (term = '') => ({ selector: JSON.stringify({ name: term }) });
const useChannelsData = ({ filter }) => {
    const getRooms = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');
    const { data } = useQuery(['rooms.autocomplete.channelAndPrivate', filter], () => __awaiter(void 0, void 0, void 0, function* () {
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
//# sourceMappingURL=useChannelsData.js.map