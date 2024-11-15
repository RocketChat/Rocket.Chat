let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let VideoConferenceStatus;module.link('@rocket.chat/core-typings',{VideoConferenceStatus(v){VideoConferenceStatus=v}},1);let useGoToRoom,useTranslation,useUserId;module.link('@rocket.chat/ui-contexts',{useGoToRoom(v){useGoToRoom=v},useTranslation(v){useTranslation=v},useUserId(v){useUserId=v}},2);let VideoConfMessageSkeleton,VideoConfMessage,VideoConfMessageRow,VideoConfMessageIcon,VideoConfMessageText,VideoConfMessageFooter,VideoConfMessageUserStack,VideoConfMessageFooterText,VideoConfMessageButton,VideoConfMessageContent,VideoConfMessageActions,VideoConfMessageAction;module.link('@rocket.chat/ui-video-conf',{VideoConfMessageSkeleton(v){VideoConfMessageSkeleton=v},VideoConfMessage(v){VideoConfMessage=v},VideoConfMessageRow(v){VideoConfMessageRow=v},VideoConfMessageIcon(v){VideoConfMessageIcon=v},VideoConfMessageText(v){VideoConfMessageText=v},VideoConfMessageFooter(v){VideoConfMessageFooter=v},VideoConfMessageUserStack(v){VideoConfMessageUserStack=v},VideoConfMessageFooterText(v){VideoConfMessageFooterText=v},VideoConfMessageButton(v){VideoConfMessageButton=v},VideoConfMessageContent(v){VideoConfMessageContent=v},VideoConfMessageActions(v){VideoConfMessageActions=v},VideoConfMessageAction(v){VideoConfMessageAction=v}},3);let useContext,memo;module.link('react',{useContext(v){useContext=v},memo(v){memo=v}},4);let UiKitContext;module.link('../..',{UiKitContext(v){UiKitContext=v}},5);let useSurfaceType;module.link('../../hooks/useSurfaceType',{useSurfaceType(v){useSurfaceType=v}},6);let useVideoConfDataStream;module.link('./hooks/useVideoConfDataStream',{useVideoConfDataStream(v){useVideoConfDataStream=v}},7);







const MAX_USERS = 3;
const VideoConferenceBlock = ({ block, }) => {
    const t = useTranslation();
    const { callId, appId = 'videoconf-core' } = block;
    const surfaceType = useSurfaceType();
    const userId = useUserId();
    const goToRoom = useGoToRoom();
    const { action, viewId = undefined, rid } = useContext(UiKitContext);
    if (surfaceType !== 'message') {
        throw new Error('VideoConferenceBlock cannot be rendered outside message');
    }
    if (!rid) {
        throw new Error('VideoConferenceBlock cannot be rendered without rid');
    }
    const result = useVideoConfDataStream({ rid, callId });
    const joinHandler = (e) => {
        action({
            blockId: block.blockId || '',
            appId,
            actionId: 'join',
            value: block.blockId || '',
            viewId,
        }, e);
    };
    const callAgainHandler = (e) => {
        action({
            blockId: rid || '',
            appId,
            actionId: 'callBack',
            value: rid || '',
            viewId,
        }, e);
    };
    const openCallInfo = (e) => {
        action({
            blockId: callId,
            appId,
            actionId: 'info',
            value: rid,
            viewId,
        }, e);
    };
    const openDiscussion = (_e) => {
        if (data.discussionRid) {
            goToRoom(data.discussionRid);
        }
    };
    if (result.isLoading || result.isError) {
        // TODO: error handling
        return _jsx(VideoConfMessageSkeleton, {});
    }
    const { data } = result;
    const isUserCaller = data.createdBy._id === userId;
    const actions = (_jsxs(VideoConfMessageActions, { children: [data.discussionRid && (_jsx(VideoConfMessageAction, { icon: 'discussion', title: t('Join_discussion'), onClick: openDiscussion })), _jsx(VideoConfMessageAction, { icon: 'info', onClick: openCallInfo })] }));
    if ('endedAt' in data) {
        return (_jsxs(VideoConfMessage, { children: [_jsxs(VideoConfMessageRow, { children: [_jsxs(VideoConfMessageContent, { children: [_jsx(VideoConfMessageIcon, {}), _jsx(VideoConfMessageText, { children: t('Call_ended') })] }), actions] }), _jsxs(VideoConfMessageFooter, { children: [data.type === 'direct' && (_jsxs(_Fragment, { children: [_jsx(VideoConfMessageButton, { onClick: callAgainHandler, children: isUserCaller ? t('Call_again') : t('Call_back') }), [
                                    VideoConferenceStatus.EXPIRED,
                                    VideoConferenceStatus.DECLINED,
                                ].includes(data.status) && (_jsx(VideoConfMessageFooterText, { children: t('Call_was_not_answered') }))] })), data.type !== 'direct' &&
                            (data.users.length ? (_jsxs(_Fragment, { children: [_jsx(VideoConfMessageUserStack, { users: data.users }), _jsx(VideoConfMessageFooterText, { children: data.users.length > MAX_USERS
                                            ? t('__usersCount__member_joined', {
                                                usersCount: data.users.length - MAX_USERS,
                                            })
                                            : t('joined') })] })) : ([
                                VideoConferenceStatus.EXPIRED,
                                VideoConferenceStatus.DECLINED,
                            ].includes(data.status) && (_jsx(VideoConfMessageFooterText, { children: t('Call_was_not_answered') }))))] })] }));
    }
    if (data.type === 'direct' && data.status === VideoConferenceStatus.CALLING) {
        return (_jsxs(VideoConfMessage, { children: [_jsxs(VideoConfMessageRow, { children: [_jsxs(VideoConfMessageContent, { children: [_jsx(VideoConfMessageIcon, { variant: 'incoming' }), _jsx(VideoConfMessageText, { children: t('Calling') })] }), actions] }), _jsx(VideoConfMessageFooter, { children: _jsx(VideoConfMessageFooterText, { children: t('Waiting_for_answer') }) })] }));
    }
    return (_jsxs(VideoConfMessage, { children: [_jsxs(VideoConfMessageRow, { children: [_jsxs(VideoConfMessageContent, { children: [_jsx(VideoConfMessageIcon, { variant: 'outgoing' }), _jsx(VideoConfMessageText, { children: t('Call_ongoing') })] }), actions] }), _jsxs(VideoConfMessageFooter, { children: [_jsx(VideoConfMessageButton, { primary: true, onClick: joinHandler, children: t('Join') }), Boolean(data.users.length) && (_jsxs(_Fragment, { children: [_jsx(VideoConfMessageUserStack, { users: data.users }), _jsx(VideoConfMessageFooterText, { children: data.users.length > MAX_USERS
                                    ? t('__usersCount__member_joined', {
                                        count: data.users.length - MAX_USERS,
                                    })
                                    : t('joined') })] }))] })] }));
};
module.exportDefault(memo(VideoConferenceBlock));
//# sourceMappingURL=VideoConferenceBlock.js.map