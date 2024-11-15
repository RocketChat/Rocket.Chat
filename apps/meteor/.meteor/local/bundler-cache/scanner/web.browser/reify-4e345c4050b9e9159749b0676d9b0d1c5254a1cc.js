module.export({useUsersData:()=>useUsersData},true);let useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v}},0);let useQuery;module.link('@tanstack/react-query',{useQuery(v){useQuery=v}},1);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const useUsersData = ({ filter }) => {
    const getUsers = useEndpoint('GET', '/v1/users.autocomplete');
    const { data } = useQuery(['users.autoComplete', filter], () => __awaiter(void 0, void 0, void 0, function* () {
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
//# sourceMappingURL=useUsersData.js.map