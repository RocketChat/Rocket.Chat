module.export({useRegisterMethod:()=>useRegisterMethod},true);let useEndpoint,useRouteParameter,useLoginWithPassword;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v},useRouteParameter(v){useRouteParameter=v},useLoginWithPassword(v){useLoginWithPassword=v}},0);let useMutation;module.link('@tanstack/react-query',{useMutation(v){useMutation=v}},1);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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


const useRegisterMethod = () => {
    const register = useEndpoint('POST', '/v1/users.register');
    const secret = useRouteParameter('hash');
    const login = useLoginWithPassword();
    return useMutation({
        mutationFn: (_a) => __awaiter(void 0, void 0, void 0, function* () {
            var props = __rest(_a, []);
            const result = yield register(Object.assign(Object.assign({}, props), { secret }));
            yield login(props.username, props.pass);
            return result;
        }),
    });
};
//# sourceMappingURL=useRegisterMethod.js.map