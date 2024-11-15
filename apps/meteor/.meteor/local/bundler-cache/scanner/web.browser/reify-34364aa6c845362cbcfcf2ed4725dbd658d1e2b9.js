module.export({useVideoConfData:()=>useVideoConfData},true);let useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v}},0);let useQuery;module.link('@tanstack/react-query',{useQuery(v){useQuery=v}},1);

const useVideoConfData = ({ callId }) => {
    const getVideoConfInfo = useEndpoint('GET', '/v1/video-conference.info');
    return useQuery(['video-conference', callId], () => getVideoConfInfo({ callId }), {
        staleTime: Infinity,
        refetchOnMount: (query) => {
            var _a;
            if ((_a = query.state.data) === null || _a === void 0 ? void 0 : _a.endedAt) {
                return false;
            }
            return 'always';
        },
    });
};
//# sourceMappingURL=useVideoConfData.js.map