module.export({useVoipClient:function(){return useVoipClient}},true);var useUser,useEndpoint,useSetting;module.link('@rocket.chat/ui-contexts',{useUser:function(v){useUser=v},useEndpoint:function(v){useEndpoint=v},useSetting:function(v){useSetting=v}},0);var useQuery;module.link('@tanstack/react-query',{useQuery:function(v){useQuery=v}},1);var useEffect,useRef;module.link('react',{useEffect:function(v){useEffect=v},useRef:function(v){useRef=v}},2);var VoipClient;module.link('../lib/VoipClient',{default:function(v){VoipClient=v}},3);var useWebRtcServers;module.link('./useWebRtcServers',{useWebRtcServers:function(v){useWebRtcServers=v}},4);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





const useVoipClient = ({ enabled = true, autoRegister = true } = {}) => {
    const { _id: userId } = useUser() || {};
    const isVoipEnabled = useSetting('VoIP_TeamCollab_Enabled');
    const voipClientRef = useRef(null);
    const getRegistrationInfo = useEndpoint('GET', '/v1/voip-freeswitch.extension.getRegistrationInfoByUserId');
    const iceServers = useWebRtcServers();
    const { data: voipClient, error } = useQuery(['voip-client', isVoipEnabled, userId, iceServers], () => __awaiter(void 0, void 0, void 0, function* () {
        if (voipClientRef.current) {
            voipClientRef.current.clear();
        }
        if (!userId) {
            throw Error('error-user-not-found');
        }
        const registrationInfo = yield getRegistrationInfo({ userId })
            .then((registration) => {
            if (!registration) {
                throw Error('error-registration-not-found');
            }
            return registration;
        })
            .catch((e) => {
            throw Error(e.error || 'error-registration-not-found');
        });
        const { extension: { extension }, credentials: { websocketPath, password }, } = registrationInfo;
        const config = {
            iceServers,
            authUserName: extension,
            authPassword: password,
            sipRegistrarHostnameOrIP: new URL(websocketPath).host,
            webSocketURI: websocketPath,
            connectionRetryCount: Number(10), // TODO: get from settings
            enableKeepAliveUsingOptionsForUnstableNetworks: true, // TODO: get from settings
        };
        const voipClient = yield VoipClient.create(config);
        if (autoRegister) {
            voipClient.register();
        }
        return voipClient;
    }), {
        initialData: null,
        enabled,
    });
    useEffect(() => {
        voipClientRef.current = voipClient;
        return () => { var _a; return (_a = voipClientRef.current) === null || _a === void 0 ? void 0 : _a.clear(); };
    }, [voipClient]);
    return { voipClient, error };
};
//# sourceMappingURL=useVoipClient.js.map