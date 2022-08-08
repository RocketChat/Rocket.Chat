/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RoomsController } from './v2/roomsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './v2/usersController';
import type { RequestHandler } from 'express';
import * as express from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "RoomID": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RoomType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["c"]},{"dataType":"enum","enums":["d"]},{"dataType":"enum","enums":["p"]},{"dataType":"enum","enums":["l"]},{"dataType":"enum","enums":["v"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUser._id-or-username-or-name_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true},"name":{"dataType":"string"},"username":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CallStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ringing"]},{"dataType":"enum","enums":["ended"]},{"dataType":"enum","enums":["declined"]},{"dataType":"enum","enums":["ongoing"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IRoom.Exclude_keyofIRoom.lastMessage__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"ref":"RoomID","required":true},"t":{"ref":"RoomType","required":true},"name":{"dataType":"string"},"fname":{"dataType":"string"},"msgs":{"dataType":"double","required":true},"default":{"dataType":"enum","enums":[true]},"broadcast":{"dataType":"enum","enums":[true]},"featured":{"dataType":"enum","enums":[true]},"announcement":{"dataType":"string"},"encrypted":{"dataType":"boolean"},"topic":{"dataType":"string"},"reactWhenReadOnly":{"dataType":"boolean"},"sysMes":{"dataType":"array","array":{"dataType":"string"}},"u":{"ref":"Pick_IUser._id-or-username-or-name_","required":true},"uids":{"dataType":"array","array":{"dataType":"string"}},"lm":{"dataType":"datetime"},"usersCount":{"dataType":"double","required":true},"callStatus":{"ref":"CallStatus"},"webRtcCallStartTime":{"dataType":"datetime"},"servedBy":{"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true}}},"streamingOptions":{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"dataType":"string","required":true},"id":{"dataType":"string"}}},"prid":{"dataType":"string"},"avatarETag":{"dataType":"string"},"teamMain":{"dataType":"boolean"},"teamId":{"dataType":"string"},"teamDefault":{"dataType":"boolean"},"open":{"dataType":"boolean"},"autoTranslateLanguage":{"dataType":"string","required":true},"autoTranslate":{"dataType":"boolean"},"unread":{"dataType":"double"},"alert":{"dataType":"boolean"},"hideUnreadStatus":{"dataType":"boolean"},"hideMentionStatus":{"dataType":"boolean"},"muted":{"dataType":"array","array":{"dataType":"string"}},"unmuted":{"dataType":"array","array":{"dataType":"string"}},"usernames":{"dataType":"array","array":{"dataType":"string"}},"ts":{"dataType":"datetime"},"cl":{"dataType":"boolean"},"ro":{"dataType":"boolean"},"favorite":{"dataType":"boolean"},"archived":{"dataType":"boolean"},"description":{"dataType":"string"},"createdOTR":{"dataType":"boolean"},"e2eKeyId":{"dataType":"string"},"federated":{"dataType":"boolean"},"channel":{"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true}}},"_updatedAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_IRoom.lastMessage_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_IRoom.Exclude_keyofIRoom.lastMessage__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RoomWithoutMessage": {
        "dataType": "refAlias",
        "type": {"ref":"Omit_IRoom.lastMessage_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LivechatMessageTypes": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["livechat_navigation_history"]},{"dataType":"enum","enums":["livechat_transfer_history"]},{"dataType":"enum","enums":["livechat_transcript_history"]},{"dataType":"enum","enums":["livechat_video_call"]},{"dataType":"enum","enums":["livechat_webrtc_video_call"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TeamMessageTypes": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["removed-user-from-team"]},{"dataType":"enum","enums":["added-user-to-team"]},{"dataType":"enum","enums":["ult"]},{"dataType":"enum","enums":["user-converted-to-team"]},{"dataType":"enum","enums":["user-converted-to-channel"]},{"dataType":"enum","enums":["user-removed-room-from-team"]},{"dataType":"enum","enums":["user-deleted-room-from-team"]},{"dataType":"enum","enums":["user-added-room-to-team"]},{"dataType":"enum","enums":["ujt"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VoipMessageTypesValues": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["voip-call-started"]},{"dataType":"enum","enums":["voip-call-declined"]},{"dataType":"enum","enums":["voip-call-on-hold"]},{"dataType":"enum","enums":["voip-call-unhold"]},{"dataType":"enum","enums":["voip-call-ended"]},{"dataType":"enum","enums":["voip-call-duration"]},{"dataType":"enum","enums":["voip-call-wrapup"]},{"dataType":"enum","enums":["voip-call-ended-unexpectedly"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OmnichannelTypesValues": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["livechat_transfer_history_fallback"]},{"dataType":"enum","enums":["livechat-close"]},{"dataType":"enum","enums":["omnichannel_placed_chat_on_hold"]},{"dataType":"enum","enums":["omnichannel_on_hold_chat_resumed"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OtrSystemMessages": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user_joined_otr"]},{"dataType":"enum","enums":["user_requested_otr_key_refresh"]},{"dataType":"enum","enums":["user_key_refreshed_successfully"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageTypesValues": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["e2e"]},{"dataType":"enum","enums":["otr"]},{"dataType":"enum","enums":["otr-ack"]},{"dataType":"enum","enums":["uj"]},{"dataType":"enum","enums":["ul"]},{"dataType":"enum","enums":["ru"]},{"dataType":"enum","enums":["au"]},{"dataType":"enum","enums":["mute_unmute"]},{"dataType":"enum","enums":["r"]},{"dataType":"enum","enums":["ut"]},{"dataType":"enum","enums":["wm"]},{"dataType":"enum","enums":["rm"]},{"dataType":"enum","enums":["subscription-role-added"]},{"dataType":"enum","enums":["subscription-role-removed"]},{"dataType":"enum","enums":["room-archived"]},{"dataType":"enum","enums":["room-unarchived"]},{"dataType":"enum","enums":["room_changed_privacy"]},{"dataType":"enum","enums":["room_changed_description"]},{"dataType":"enum","enums":["room_changed_announcement"]},{"dataType":"enum","enums":["room_changed_avatar"]},{"dataType":"enum","enums":["room_changed_topic"]},{"dataType":"enum","enums":["room_e2e_enabled"]},{"dataType":"enum","enums":["room_e2e_disabled"]},{"dataType":"enum","enums":["user-muted"]},{"dataType":"enum","enums":["user-unmuted"]},{"dataType":"enum","enums":["room-removed-read-only"]},{"dataType":"enum","enums":["room-set-read-only"]},{"dataType":"enum","enums":["room-allowed-reacting"]},{"dataType":"enum","enums":["room-disallowed-reacting"]},{"ref":"LivechatMessageTypes"},{"ref":"TeamMessageTypes"},{"ref":"VoipMessageTypesValues"},{"ref":"OmnichannelTypesValues"},{"ref":"OtrSystemMessages"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Required_Pick_IUser._id-or-username-or-name__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"username":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MentionType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["team"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IRoom._id-or-name_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"ref":"RoomID","required":true},"name":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Exclude_Markup.Markup_": {
        "dataType": "refAlias",
        "type": {"ref":"MarkupExcluding_Bold_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkupExcluding_Bold_": {
        "dataType": "refAlias",
        "type": {"ref":"Exclude_Markup.Bold_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Exclude_Markup.Bold_": {
        "dataType": "refAlias",
        "type": {"ref":"MarkupExcluding_Bold_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Plain": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"type":{"dataType":"enum","enums":["PLAIN_TEXT"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkupExcluding_Italic_": {
        "dataType": "refAlias",
        "type": {"ref":"Exclude_Markup.Italic_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Exclude_Markup.Italic_": {
        "dataType": "refAlias",
        "type": {"ref":"MarkupExcluding_Italic_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Link": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"ref":"Markup","required":true},"src":{"ref":"Plain","required":true}},"required":true},"type":{"dataType":"enum","enums":["LINK"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Italic": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"MarkupExcluding_Italic_"},{"ref":"Link"}]},"required":true},"type":{"dataType":"enum","enums":["ITALIC"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkupExcluding_Strike_": {
        "dataType": "refAlias",
        "type": {"ref":"Exclude_Markup.Strike_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Exclude_Markup.Strike_": {
        "dataType": "refAlias",
        "type": {"ref":"MarkupExcluding_Strike_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Strike": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"MarkupExcluding_Strike_"},{"ref":"Link"}]},"required":true},"type":{"dataType":"enum","enums":["STRIKE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Bold": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"MarkupExcluding_Bold_"},{"ref":"Link"}]},"required":true},"type":{"dataType":"enum","enums":["BOLD"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Markup": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"Italic"},{"ref":"Strike"},{"ref":"Bold"},{"ref":"Plain"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InlineCode": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"ref":"Plain","required":true},"type":{"dataType":"enum","enums":["INLINE_CODE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Image": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"ref":"Markup","required":true},"src":{"ref":"Plain","required":true}},"required":true},"type":{"dataType":"enum","enums":["IMAGE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserMention": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"ref":"Plain","required":true},"type":{"dataType":"enum","enums":["MENTION_USER"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChannelMention": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"ref":"Plain","required":true},"type":{"dataType":"enum","enums":["MENTION_CHANNEL"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Emoji": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"shortCode":{"dataType":"string","required":true},"value":{"ref":"Plain","required":true},"type":{"dataType":"enum","enums":["EMOJI"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"unicode":{"dataType":"string","required":true},"value":{"dataType":"undefined","required":true},"type":{"dataType":"enum","enums":["EMOJI"],"required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Color": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"a":{"dataType":"double","required":true},"b":{"dataType":"double","required":true},"g":{"dataType":"double","required":true},"r":{"dataType":"double","required":true}},"required":true},"type":{"dataType":"enum","enums":["COLOR"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InlineKaTeX": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"type":{"dataType":"enum","enums":["INLINE_KATEX"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Inlines": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"Bold"},{"ref":"Plain"},{"ref":"Italic"},{"ref":"Strike"},{"ref":"InlineCode"},{"ref":"Image"},{"ref":"Link"},{"ref":"UserMention"},{"ref":"ChannelMention"},{"ref":"Emoji"},{"ref":"Color"},{"ref":"InlineKaTeX"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Exclude_Inlines.Paragraph_": {
        "dataType": "refAlias",
        "type": {"ref":"Inlines","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Paragraph": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Exclude_Inlines.Paragraph_"},"required":true},"type":{"dataType":"enum","enums":["PARAGRAPH"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CodeLine": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"ref":"Plain","required":true},"type":{"dataType":"enum","enums":["CODE_LINE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Code": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"CodeLine"},"required":true},"language":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},"type":{"dataType":"enum","enums":["CODE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Heading": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Plain"},"required":true},"level":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":[1]},{"dataType":"enum","enums":[2]},{"dataType":"enum","enums":[3]},{"dataType":"enum","enums":[4]}],"required":true},"type":{"dataType":"enum","enums":["HEADING"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Quote": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Paragraph"},"required":true},"type":{"dataType":"enum","enums":["QUOTE"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ListItem": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"number":{"dataType":"double"},"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Inlines"},"required":true},"type":{"dataType":"enum","enums":["LIST_ITEM"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Task": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Inlines"},"required":true},"status":{"dataType":"boolean","required":true},"type":{"dataType":"enum","enums":["TASK"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Tasks": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Task"},"required":true},"type":{"dataType":"enum","enums":["TASKS"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrderedList": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"ListItem"},"required":true},"type":{"dataType":"enum","enums":["ORDERED_LIST"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UnorderedList": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"ListItem"},"required":true},"type":{"dataType":"enum","enums":["UNORDERED_LIST"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LineBreak": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"undefined","required":true},"type":{"dataType":"enum","enums":["LINE_BREAK"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KaTeX": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"type":{"dataType":"enum","enums":["KATEX"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Blocks": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"Code"},{"ref":"Heading"},{"ref":"Quote"},{"ref":"ListItem"},{"ref":"Tasks"},{"ref":"OrderedList"},{"ref":"UnorderedList"},{"ref":"LineBreak"},{"ref":"KaTeX"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BigEmoji": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"array","array":{"dataType":"refAlias","ref":"Emoji"},"required":true},"type":{"dataType":"enum","enums":["BIG_EMOJI"],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Root": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"Paragraph"},{"ref":"Blocks"},{"ref":"BigEmoji"}]},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReturnType_typeofparser_": {
        "dataType": "refAlias",
        "type": {"ref":"Root","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FileProp": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"size":{"dataType":"double","required":true},"format":{"dataType":"string","required":true},"type":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"_id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Action": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"msg_processing_type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["sendMessage"]},{"dataType":"enum","enums":["respondWithMessage"]},{"dataType":"enum","enums":["respondWithQuotedMessage"]}]},"msg_in_chat_window":{"dataType":"enum","enums":[true]},"is_webview":{"dataType":"enum","enums":[true]},"image_url":{"dataType":"string"},"url":{"dataType":"string"},"msg":{"dataType":"string"},"text":{"dataType":"string","required":true},"type":{"dataType":"enum","enums":["button"],"required":true},"msgId":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageAttachmentBase": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"title_link_download":{"dataType":"boolean"},"title_link":{"dataType":"string"},"text":{"dataType":"string"},"description":{"dataType":"string"},"collapsed":{"dataType":"boolean"},"ts":{"dataType":"datetime"},"title":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageAttachmentAction": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"actions":{"dataType":"array","array":{"dataType":"refAlias","ref":"Action"},"required":true},"button_alignment":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["horizontal"]},{"dataType":"enum","enums":["vertical"]}]}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FieldProps": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"title":{"dataType":"string","required":true},"short":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Dimensions": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"height":{"dataType":"double","required":true},"width":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkdownFields": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text"]},{"dataType":"enum","enums":["pretext"]},{"dataType":"enum","enums":["fields"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageAttachmentDefault": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"translations":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"}},"color":{"dataType":"string"},"thumb_url":{"dataType":"string"},"text":{"dataType":"string"},"pretext":{"dataType":"string"},"mrkdwn_in":{"dataType":"array","array":{"dataType":"refAlias","ref":"MarkdownFields"}},"image_dimensions":{"ref":"Dimensions"},"image_url":{"dataType":"string"},"fields":{"dataType":"array","array":{"dataType":"refAlias","ref":"FieldProps"}},"author_name":{"dataType":"string"},"author_link":{"dataType":"string"},"author_icon":{"dataType":"string"}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VideoAttachmentProps": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"file":{"ref":"FileProp"},"video_size":{"dataType":"double","required":true},"video_type":{"dataType":"string","required":true},"video_url":{"dataType":"string","required":true}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImageAttachmentProps": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"file":{"ref":"FileProp"},"image_size":{"dataType":"double"},"image_type":{"dataType":"string","required":true},"image_url":{"dataType":"string","required":true},"image_preview":{"dataType":"string"},"image_dimensions":{"ref":"Dimensions"}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioAttachmentProps": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"file":{"ref":"FileProp"},"audio_size":{"dataType":"double"},"audio_type":{"dataType":"string","required":true},"audio_url":{"dataType":"string","required":true}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FileAttachmentProps": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"file":{"ref":"FileProp"},"type":{"dataType":"enum","enums":["file"],"required":true}}},{"dataType":"union","subSchemas":[{"ref":"VideoAttachmentProps"},{"ref":"ImageAttachmentProps"},{"ref":"AudioAttachmentProps"}]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageQuoteAttachment": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"attachments":{"dataType":"array","array":{"dataType":"refAlias","ref":"MessageQuoteAttachment"}},"text":{"dataType":"string","required":true},"message_link":{"dataType":"string"},"author_icon":{"dataType":"string","required":true},"author_link":{"dataType":"string","required":true},"author_name":{"dataType":"string","required":true}}},{"ref":"MessageAttachmentBase"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageAttachment": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"MessageAttachmentAction"},{"ref":"MessageAttachmentDefault"},{"ref":"FileAttachmentProps"},{"ref":"MessageQuoteAttachment"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["code"]},{"dataType":"enum","enums":["inlinecode"]},{"dataType":"enum","enums":["bold"]},{"dataType":"enum","enums":["italic"]},{"dataType":"enum","enums":["strike"]},{"dataType":"enum","enums":["link"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenExtra": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"noHtml":{"dataType":"string"},"highlight":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Token": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"noHtml":{"dataType":"string"},"type":{"ref":"TokenType"},"text":{"dataType":"string","required":true},"token":{"dataType":"string","required":true}}},{"ref":"TokenExtra"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IMessage.Exclude_keyofIMessage.MessageFieldsIgnored__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true},"t":{"ref":"MessageTypesValues"},"u":{"ref":"Required_Pick_IUser._id-or-username-or-name__","required":true},"unread":{"dataType":"boolean"},"ts":{"dataType":"datetime","required":true},"_updatedAt":{"dataType":"datetime","required":true},"rid":{"ref":"RoomID","required":true},"msg":{"dataType":"string","required":true},"tmid":{"dataType":"string"},"mentions":{"dataType":"array","array":{"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"ref":"MentionType","required":true}}},{"ref":"Pick_IUser._id-or-username-or-name_"}]}},"groupable":{"dataType":"enum","enums":[false]},"channels":{"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_IRoom._id-or-name_"}},"alias":{"dataType":"string"},"md":{"ref":"ReturnType_typeofparser_"},"ignored":{"dataType":"boolean"},"_hidden":{"dataType":"boolean"},"imported":{"dataType":"boolean"},"replies":{"dataType":"array","array":{"dataType":"string"}},"starred":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"_id":{"dataType":"string","required":true}}}},"pinned":{"dataType":"boolean"},"temp":{"dataType":"boolean"},"drid":{"ref":"RoomID"},"tlm":{"dataType":"datetime"},"dcount":{"dataType":"double"},"tcount":{"dataType":"double"},"e2e":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["done"]}]},"actionLinks":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"params":{"dataType":"string","required":true},"method_id":{"dataType":"string","required":true},"label":{"dataType":"string","required":true},"i18nLabel":{"dataType":"any","required":true},"icon":{"dataType":"enum","enums":["file","avatar","emoji","user","team","address-book","arrow-back","arrow-collapse","arrow-down","arrow-down-box","arrow-expand","arrow-fall","arrow-forward","arrow-jump","arrow-loop","arrow-return","arrow-rise","arrow-stack-up","arrow-up-box","at","backspace","bag","ball","balloon","balloon-arrow-left","balloon-arrow-top-right","balloon-close-top-right","balloon-ellipsis","balloon-exclamation","balloon-off","balloons","balloon-text","ban","bell","bell-off","bold","book","brush","burger","burger-arrow-left","business","calendar","camera","card","check","chevron-down","chevron-expand","chevron-left","chevron-right","chevron-up","circle-arrow-down","circle-check","circle-cross","circle-exclamation","circle-half","circle-quarter","circle-three-quarters","clip","clipboard","clock","cloud-arrow-up","cloud-plus","code","cog","condensed-view","copy","crop","cross","cross-small","cube","customize","desktop","dialpad","doc","document-eye","doner","emoji-neutral","emoji-plus","eraser","error-circle","exit","extended-view","eye","eye-off","fingerprint","flag","folder","globe","globe-cross","globe-off","group-by-type","hash","hashtag-lock","h-bar","headphone","headphone-off","headset","help","history","home","image","info","italic","joystick","kebab","key","keyboard","language","link","list-bullets","list-numbers","live","lock","login","magnifier","mail","mail-arrow-top-right","meatballs","medium-view","members","mic","mic-off","mobile","mobile-check","mobile-exclamation","moon","musical-note","new-window","notebook-hashtag","notebook-hashtag-crossed","pause","pause-unfilled","pencil","pencil-box","phone","phone-disabled","phone-in","phone-issue","phone-off","phone-out","pin","pin-map","play","plus","plus-small","podcast","quote","rec","refresh","send","send-filled","sheet","shield","shield-blank","shield-check","signal","sms","sort","sort-az","squares","stack","star","star-filled","stopwatch","strike","success-circle","sun","team-arrow-right","team-lock","text-decrease","text-increase","trash","underline","undo","user-arrow-right","user-plus","video","video-disabled","video-filled","video-off","volume","volume-disabled","volume-lock","volume-off","warning","zip","add-reaction","add-user","attachment","audio","back","baloon-arrow-left","baloon-arrow-top-right","baloon-close-top-right","baloon-ellipsis","baloon-exclamation","baloons","baloon-text","cancel","canned-response","chat","checkmark-circled","circled-arrow-down","computer","contact","discover","discussion","download","edit","edit-rounded","file-document","file-generic","file-google-drive","file-pdf","files-audio","file-sheets","files-video","files-zip","game","hashtag","import","info-circled","jump","jump-to-message","map-pin","menu","message","message-disabled","modal-warning","multiline","omnichannel","permalink","post","queue","reload","reply-directly","report","send-active","share","shield-alt","sign-out","sort-amount-down","th-list","thread","upload","user-rounded","circle","file-keynote","hand-pointer","list","list-alt","livechat","loading","play-solid","reply","adobe","facebook","github","gitlab","google","google-drive","hubot","linkedin","twitter"],"required":true}}}},"file":{"ref":"FileProp"},"files":{"dataType":"array","array":{"dataType":"refAlias","ref":"FileProp"}},"attachments":{"dataType":"array","array":{"dataType":"refAlias","ref":"MessageAttachment"}},"reactions":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"nestedObjectLiteral","nestedProperties":{"usernames":{"dataType":"array","array":{"dataType":"string"},"required":true},"names":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}}}}},"private":{"dataType":"boolean"},"bot":{"dataType":"boolean"},"sentByEmail":{"dataType":"boolean"},"webRtcCallEndTs":{"dataType":"datetime"},"role":{"dataType":"string"},"avatar":{"dataType":"string"},"emoji":{"dataType":"string"},"tokens":{"dataType":"array","array":{"dataType":"refAlias","ref":"Token"}},"html":{"dataType":"string"},"token":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_IMessage.MessageFieldsIgnored_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_IMessage.Exclude_keyofIMessage.MessageFieldsIgnored__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MessageCompatible": {
        "dataType": "refAlias",
        "type": {"ref":"Omit_IMessage.MessageFieldsIgnored_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserEmailVerificationToken": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
            "address": {"dataType":"string","required":true},
            "when": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IMeteorLoginToken": {
        "dataType": "refObject",
        "properties": {
            "hashedToken": {"dataType":"string","required":true},
            "twoFactorAuthorizedUntil": {"dataType":"datetime"},
            "twoFactorAuthorizedHash": {"dataType":"string"},
            "when": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IPersonalAccessToken": {
        "dataType": "refObject",
        "properties": {
            "hashedToken": {"dataType":"string","required":true},
            "twoFactorAuthorizedUntil": {"dataType":"datetime"},
            "twoFactorAuthorizedHash": {"dataType":"string"},
            "type": {"dataType":"enum","enums":["personalAccessToken"],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "lastTokenPart": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "bypassTwoFactor": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginToken": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"IMeteorLoginToken"},{"ref":"IPersonalAccessToken"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserEmailCode": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "expire": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserServices": {
        "dataType": "refObject",
        "properties": {
            "password": {"dataType":"nestedObjectLiteral","nestedProperties":{"bcrypt":{"dataType":"string","required":true}}},
            "passwordHistory": {"dataType":"array","array":{"dataType":"string"}},
            "email": {"dataType":"nestedObjectLiteral","nestedProperties":{"verificationTokens":{"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmailVerificationToken"}}}},
            "resume": {"dataType":"nestedObjectLiteral","nestedProperties":{"loginTokens":{"dataType":"array","array":{"dataType":"refAlias","ref":"LoginToken"}}}},
            "cloud": {"dataType":"any"},
            "google": {"dataType":"any"},
            "facebook": {"dataType":"any"},
            "github": {"dataType":"any"},
            "totp": {"dataType":"nestedObjectLiteral","nestedProperties":{"secret":{"dataType":"string","required":true},"hashedBackup":{"dataType":"array","array":{"dataType":"string"},"required":true},"enabled":{"dataType":"boolean","required":true}}},
            "email2fa": {"dataType":"nestedObjectLiteral","nestedProperties":{"changedAt":{"dataType":"datetime","required":true},"enabled":{"dataType":"boolean","required":true}}},
            "emailCode": {"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmailCode"},"required":true},
            "saml": {"dataType":"nestedObjectLiteral","nestedProperties":{"nameID":{"dataType":"string"},"idpSession":{"dataType":"string"},"idp":{"dataType":"string"},"provider":{"dataType":"string"},"inResponseTo":{"dataType":"string"}}},
            "ldap": {"dataType":"nestedObjectLiteral","nestedProperties":{"idAttribute":{"dataType":"string"},"id":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserEmail": {
        "dataType": "refObject",
        "properties": {
            "address": {"dataType":"string","required":true},
            "verified": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserStatus": {
        "dataType": "refEnum",
        "enums": ["online","away","offline","busy"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserSettings": {
        "dataType": "refObject",
        "properties": {
            "profile": {"dataType":"any","required":true},
            "preferences": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUser": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "_updatedAt": {"dataType":"datetime","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "roles": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "type": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
            "username": {"dataType":"string"},
            "nickname": {"dataType":"string"},
            "name": {"dataType":"string"},
            "services": {"ref":"IUserServices"},
            "emails": {"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmail"}},
            "status": {"ref":"UserStatus"},
            "statusConnection": {"dataType":"string"},
            "lastLogin": {"dataType":"datetime"},
            "bio": {"dataType":"string"},
            "avatarOrigin": {"dataType":"string"},
            "avatarETag": {"dataType":"string"},
            "avatarUrl": {"dataType":"string"},
            "utcOffset": {"dataType":"double"},
            "language": {"dataType":"string"},
            "statusDefault": {"ref":"UserStatus"},
            "statusText": {"dataType":"string"},
            "oauth": {"dataType":"nestedObjectLiteral","nestedProperties":{"authorizedClients":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
            "statusLivechat": {"dataType":"string"},
            "e2e": {"dataType":"nestedObjectLiteral","nestedProperties":{"public_key":{"dataType":"string","required":true},"private_key":{"dataType":"string","required":true}}},
            "requirePasswordChange": {"dataType":"boolean"},
            "customFields": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"}},
            "settings": {"ref":"IUserSettings"},
            "defaultRoom": {"dataType":"string"},
            "ldap": {"dataType":"boolean"},
            "extension": {"dataType":"string"},
            "inviteToken": {"dataType":"string"},
            "federated": {"dataType":"boolean"},
            "canViewAllInfo": {"dataType":"boolean"},
            "phone": {"dataType":"string"},
            "reason": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUser.username_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"username":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserCreationParams": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_IUser.username_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: express.Router, rcDI: any) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.get('/rooms',
            ...(fetchMiddlewares<RequestHandler>(RoomsController)),
            ...(fetchMiddlewares<RequestHandler>(RoomsController.prototype.getRooms)),

            function RoomsController_getRooms(request: any, response: any, next: any) {
            const args = {
                    name: {"in":"query","name":"name","dataType":"string"},
                    limit: {"in":"query","name":"limit","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new RoomsController(rcDI);


              const promise = controller.getRooms.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/rooms/:roomId/messages',
            ...(fetchMiddlewares<RequestHandler>(RoomsController)),
            ...(fetchMiddlewares<RequestHandler>(RoomsController.prototype.getRoomMessages)),

            function RoomsController_getRoomMessages(request: any, response: any, next: any) {
            const args = {
                    roomId: {"in":"path","name":"roomId","required":true,"dataType":"string"},
                    limit: {"in":"query","name":"limit","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new RoomsController(rcDI);


              const promise = controller.getRoomMessages.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/:userId',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUser)),

            function UsersController_getUser(request: any, response: any, next: any) {
            const args = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController(rcDI);


              const promise = controller.getUser.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUsers)),

            function UsersController_getUsers(request: any, response: any, next: any) {
            const args = {
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController(rcDI);


              const promise = controller.getUsers.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/users',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.createUser)),

            function UsersController_createUser(request: any, response: any, next: any) {
            const args = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserCreationParams"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController(rcDI);


              const promise = controller.createUser.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, 201, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;
                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                returnHandler(response, statusCode, data, headers)
            })
            .catch((error: any) => next(error));
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
        if (response.headersSent) {
            return;
        }
        Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
        });
        if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
            data.pipe(response);
        } else if (data !== null && data !== undefined) {
            response.status(statusCode || 200).json(data);
        } else {
            response.status(statusCode || 204).end();
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
            returnHandler(response, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, response: any): any[] {
        const fieldErrors: FieldErrors  = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.', {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'formData':
                    if (args[key].dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else if (args[key].dataType === 'array' && args[key].array.dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else {
                        return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    }
                case 'res':
                    return responder(response);
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
