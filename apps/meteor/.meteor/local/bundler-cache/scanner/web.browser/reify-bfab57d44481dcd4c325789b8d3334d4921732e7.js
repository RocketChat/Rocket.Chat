module.export({useVideoConfDataStream:()=>useVideoConfDataStream},true);let useStream;module.link('@rocket.chat/ui-contexts',{useStream(v){useStream=v}},0);let useQueryClient;module.link('@tanstack/react-query',{useQueryClient(v){useQueryClient=v}},1);let useEffect;module.link('react',{useEffect(v){useEffect=v}},2);let useVideoConfData;module.link('./useVideoConfData',{useVideoConfData(v){useVideoConfData=v}},3);



const useVideoConfDataStream = ({ rid, callId, }) => {
    const queryClient = useQueryClient();
    const subscribeNotifyRoom = useStream('notify-room');
    useEffect(() => {
        return subscribeNotifyRoom(`${rid}/videoconf`, (id) => id === callId &&
            queryClient.invalidateQueries(['video-conference', callId]));
    }, [rid, callId, subscribeNotifyRoom, queryClient]);
    return useVideoConfData({ callId });
};
//# sourceMappingURL=useVideoConfDataStream.js.map