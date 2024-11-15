"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const core_typings_1 = require("@rocket.chat/core-typings");
const ui_contexts_1 = require("@rocket.chat/ui-contexts");
const ui_video_conf_1 = require("@rocket.chat/ui-video-conf");
const react_1 = require("react");
const __1 = require("../..");
const useSurfaceType_1 = require("../../hooks/useSurfaceType");
const useVideoConfDataStream_1 = require("./hooks/useVideoConfDataStream");
const MAX_USERS = 3;
const VideoConferenceBlock = ({ block, }) => {
    const t = (0, ui_contexts_1.useTranslation)();
    const { callId, appId = 'videoconf-core' } = block;
    const surfaceType = (0, useSurfaceType_1.useSurfaceType)();
    const userId = (0, ui_contexts_1.useUserId)();
    const goToRoom = (0, ui_contexts_1.useGoToRoom)();
    const { action, viewId = undefined, rid } = (0, react_1.useContext)(__1.UiKitContext);
    if (surfaceType !== 'message') {
        throw new Error('VideoConferenceBlock cannot be rendered outside message');
    }
    if (!rid) {
        throw new Error('VideoConferenceBlock cannot be rendered without rid');
    }
    const result = (0, useVideoConfDataStream_1.useVideoConfDataStream)({ rid, callId });
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
        return (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageSkeleton, {});
    }
    const { data } = result;
    const isUserCaller = data.createdBy._id === userId;
    const actions = ((0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageActions, { children: [data.discussionRid && ((0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageAction, { icon: 'discussion', title: t('Join_discussion'), onClick: openDiscussion })), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageAction, { icon: 'info', onClick: openCallInfo })] }));
    if ('endedAt' in data) {
        return ((0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessage, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageRow, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageContent, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageIcon, {}), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageText, { children: t('Call_ended') })] }), actions] }), (0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageFooter, { children: [data.type === 'direct' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageButton, { onClick: callAgainHandler, children: isUserCaller ? t('Call_again') : t('Call_back') }), [
                                    core_typings_1.VideoConferenceStatus.EXPIRED,
                                    core_typings_1.VideoConferenceStatus.DECLINED,
                                ].includes(data.status) && ((0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooterText, { children: t('Call_was_not_answered') }))] })), data.type !== 'direct' &&
                            (data.users.length ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageUserStack, { users: data.users }), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooterText, { children: data.users.length > MAX_USERS
                                            ? t('__usersCount__member_joined', {
                                                usersCount: data.users.length - MAX_USERS,
                                            })
                                            : t('joined') })] })) : ([
                                core_typings_1.VideoConferenceStatus.EXPIRED,
                                core_typings_1.VideoConferenceStatus.DECLINED,
                            ].includes(data.status) && ((0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooterText, { children: t('Call_was_not_answered') }))))] })] }));
    }
    if (data.type === 'direct' && data.status === core_typings_1.VideoConferenceStatus.CALLING) {
        return ((0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessage, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageRow, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageContent, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageIcon, { variant: 'incoming' }), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageText, { children: t('Calling') })] }), actions] }), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooter, { children: (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooterText, { children: t('Waiting_for_answer') }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessage, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageRow, { children: [(0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageContent, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageIcon, { variant: 'outgoing' }), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageText, { children: t('Call_ongoing') })] }), actions] }), (0, jsx_runtime_1.jsxs)(ui_video_conf_1.VideoConfMessageFooter, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageButton, { primary: true, onClick: joinHandler, children: t('Join') }), Boolean(data.users.length) && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageUserStack, { users: data.users }), (0, jsx_runtime_1.jsx)(ui_video_conf_1.VideoConfMessageFooterText, { children: data.users.length > MAX_USERS
                                    ? t('__usersCount__member_joined', {
                                        count: data.users.length - MAX_USERS,
                                    })
                                    : t('joined') })] }))] })] }));
};
exports.default = (0, react_1.memo)(VideoConferenceBlock);
//# sourceMappingURL=VideoConferenceBlock.js.map