module.export({useWebRtcServers:()=>useWebRtcServers},true);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);let parseStringToIceServers;module.link('../utils/parseStringToIceServers',{parseStringToIceServers(v){parseStringToIceServers=v}},2);


const useWebRtcServers = () => {
    const servers = useSetting('WebRTC_Servers');
    return useMemo(() => {
        if (typeof servers !== 'string' || !servers.trim()) {
            return [];
        }
        return parseStringToIceServers(servers);
    }, [servers]);
};
//# sourceMappingURL=useWebRtcServers.js.map