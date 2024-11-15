module.export({useCheckRegistrationSecret:function(){return useCheckRegistrationSecret}},true);var useMethod;module.link('@rocket.chat/ui-contexts',{useMethod:function(v){useMethod=v}},0);var useQuery;module.link('@tanstack/react-query',{useQuery:function(v){useQuery=v}},1);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const useCheckRegistrationSecret = (hash) => {
    const checkRegistrationSecretURL = useMethod('checkRegistrationSecretURL');
    return useQuery(['secretURL', hash], () => __awaiter(void 0, void 0, void 0, function* () {
        if (!hash) {
            return false;
        }
        return checkRegistrationSecretURL(hash);
    }));
};
//# sourceMappingURL=useCheckRegistrationSecret.js.map