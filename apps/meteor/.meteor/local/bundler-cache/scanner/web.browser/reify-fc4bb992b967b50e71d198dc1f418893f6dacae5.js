"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMessageFromVisitor = exports.isVideoConfMessage = exports.isOTRAckMessage = exports.isOTRMessage = exports.isE2EEPinnedMessage = exports.isE2EEMessage = exports.isVoipMessage = exports.isIMessageInbox = exports.isMessageDiscussion = exports.isPrivateMessage = exports.isDiscussionMessage = exports.isThreadMessage = exports.isThreadMainMessage = exports.isTranslatedMessage = exports.isMessageFromMatrixFederation = exports.isDeletedMessage = exports.isSystemMessage = exports.isEditedMessage = void 0;
const VoipMessageTypesValues = [
    'voip-call-started',
    'voip-call-declined',
    'voip-call-on-hold',
    'voip-call-unhold',
    'voip-call-ended',
    'voip-call-duration',
    'voip-call-wrapup',
    'voip-call-ended-unexpectedly',
];
const TeamMessageTypesValues = [
    'removed-user-from-team',
    'added-user-to-team',
    'ult',
    'user-converted-to-team',
    'user-converted-to-channel',
    'user-removed-room-from-team',
    'user-deleted-room-from-team',
    'user-added-room-to-team',
    'ujt',
];
const LivechatMessageTypesValues = [
    'livechat_navigation_history',
    'livechat_transfer_history',
    'livechat_transcript_history',
    'livechat_video_call',
    'livechat_transfer_history_fallback',
    'livechat-close',
    'livechat_webrtc_video_call',
    'livechat-started',
    'omnichannel_priority_change_history',
    'omnichannel_sla_change_history',
    'omnichannel_placed_chat_on_hold',
    'omnichannel_on_hold_chat_resumed',
];
const OtrMessageTypeValues = ['otr', 'otr-ack'];
const OtrSystemMessagesValues = ['user_joined_otr', 'user_requested_otr_key_refresh', 'user_key_refreshed_successfully'];
const MessageTypes = [
    'e2e',
    'uj',
    'ul',
    'ru',
    'au',
    'mute_unmute',
    'r',
    'ut',
    'wm',
    'rm',
    'subscription-role-added',
    'subscription-role-removed',
    'room-archived',
    'room-unarchived',
    'room_changed_privacy',
    'room_changed_description',
    'room_changed_announcement',
    'room_changed_avatar',
    'room_changed_topic',
    'room_e2e_enabled',
    'room_e2e_disabled',
    'user-muted',
    'user-unmuted',
    'room-removed-read-only',
    'room-set-read-only',
    'room-allowed-reacting',
    'room-disallowed-reacting',
    'command',
    'videoconf',
    'message_pinned',
    'message_pinned_e2e',
    'new-moderator',
    'moderator-removed',
    'new-owner',
    'owner-removed',
    'new-leader',
    'leader-removed',
    'discussion-created',
    ...TeamMessageTypesValues,
    ...LivechatMessageTypesValues,
    ...VoipMessageTypesValues,
    ...OtrMessageTypeValues,
    ...OtrSystemMessagesValues,
];
const isEditedMessage = (message) => 'editedAt' in message &&
    message.editedAt instanceof Date &&
    'editedBy' in message &&
    typeof message.editedBy === 'object' &&
    message.editedBy !== null &&
    '_id' in message.editedBy &&
    typeof message.editedBy._id === 'string';
exports.isEditedMessage = isEditedMessage;
const isSystemMessage = (message) => message.t !== undefined && MessageTypes.includes(message.t);
exports.isSystemMessage = isSystemMessage;
const isDeletedMessage = (message) => (0, exports.isEditedMessage)(message) && message.t === 'rm';
exports.isDeletedMessage = isDeletedMessage;
const isMessageFromMatrixFederation = (message) => 'federation' in message && Boolean(message.federation?.eventId);
exports.isMessageFromMatrixFederation = isMessageFromMatrixFederation;
const isTranslatedMessage = (message) => 'translations' in message;
exports.isTranslatedMessage = isTranslatedMessage;
const isThreadMainMessage = (message) => 'tcount' in message && 'tlm' in message;
exports.isThreadMainMessage = isThreadMainMessage;
const isThreadMessage = (message) => !!message.tmid;
exports.isThreadMessage = isThreadMessage;
const isDiscussionMessage = (message) => !!message.drid;
exports.isDiscussionMessage = isDiscussionMessage;
const isPrivateMessage = (message) => !!message.private;
exports.isPrivateMessage = isPrivateMessage;
const isMessageDiscussion = (message) => {
    return 'drid' in message;
};
exports.isMessageDiscussion = isMessageDiscussion;
const isIMessageInbox = (message) => 'email' in message;
exports.isIMessageInbox = isIMessageInbox;
const isVoipMessage = (message) => 'voipData' in message;
exports.isVoipMessage = isVoipMessage;
const isE2EEMessage = (message) => message.t === 'e2e';
exports.isE2EEMessage = isE2EEMessage;
const isE2EEPinnedMessage = (message) => message.t === 'message_pinned_e2e';
exports.isE2EEPinnedMessage = isE2EEPinnedMessage;
const isOTRMessage = (message) => message.t === 'otr';
exports.isOTRMessage = isOTRMessage;
const isOTRAckMessage = (message) => message.t === 'otr-ack';
exports.isOTRAckMessage = isOTRAckMessage;
const isVideoConfMessage = (message) => message.t === 'videoconf';
exports.isVideoConfMessage = isVideoConfMessage;
const isMessageFromVisitor = (message) => 'token' in message;
exports.isMessageFromVisitor = isMessageFromVisitor;
//# sourceMappingURL=IMessage.js.map