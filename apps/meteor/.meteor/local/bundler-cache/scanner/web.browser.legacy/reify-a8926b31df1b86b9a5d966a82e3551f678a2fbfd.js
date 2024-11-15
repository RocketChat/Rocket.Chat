module.export({useWebRtcServers:function(){return useWebRtcServers}},true);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);var parseStringToIceServers;module.link('../utils/parseStringToIceServers',{parseStringToIceServers:function(v){parseStringToIceServers=v}},2);


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