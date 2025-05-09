/**
 * Usually, normal messages won't have a type, but system messages will, end those are the types that are available.
 */
export type MessageType =
    /** Sent when a voip call has started  */
    | 'voip-call-started'
    /** Sent when a voip call has been declined */
    | 'voip-call-declined'
    /** Sent when a voip call is put on hold */
    | 'voip-call-on-hold'
    /** Sent when a voip call is unhold */
    | 'voip-call-unhold'
    /** Sent when a voip call is paused */
    | 'voip-call-ended'
    /** Sent when a voip call is over, contains the duration of the call */
    | 'voip-call-duration'
    /** Sent when a voip call is ended */
    | 'voip-call-wrapup'
    /** Sent when a voip call is ended unexpectedly */
    | 'voip-call-ended-unexpectedly'
    /** Sent when a user is removed from main room of a team */
    | 'removed-user-from-team'
    /** Sent when a user is added to a team */
    | 'added-user-to-team'
    /** Sent when a user leaves a team  */
    | 'ult'
    /** Sent when a user converts a room into a team */
    | 'user-converted-to-team'
    /** Sent when a user converts a room into a channel */
    | 'user-converted-to-channel'
    /** Sent when a user removes a room from a team */
    | 'user-removed-room-from-team'
    /** Sent when a user deletes a room inside a team */
    | 'user-deleted-room-from-team'
    /** Sent when a user adds a room to a team */
    | 'user-added-room-to-team'
    /** Sent when a user joins a team */
    | 'ujt'
    /** Sent when the navigation history of a livechat conversation is requested */
    | 'livechat_navigation_history'
    /** Sent when the conversation is transferred */
    | 'livechat_transfer_history'
    /** Sent when the transcript is requested */
    | 'livechat_transcript_history'
    /** Sent when a video call is requested */
    | 'livechat_video_call'
    /** Sent when there is a history fallback */
    | 'livechat_transfer_history_fallback'
    /** Sent when a livechat conversation is closed */
    | 'livechat-close'
    /** Sent when a livechat conversation is started */
    | 'livechat_webrtc_video_call'
    /** Sent when a livechat conversation is started */
    | 'livechat-started'
    /** Sent when the priority of omnichannel is changed */
    | 'omnichannel_priority_change_history'
    /** Sent when the sla of omnichannel is changed */
    | 'omnichannel_sla_change_history'
    /** Sent when a chat is placed on hold */
    | 'omnichannel_placed_chat_on_hold'
    /** Sent when a chat is resumed */
    | 'omnichannel_on_hold_chat_resumed'
    | 'otr'
    | 'otr-ack'
    | 'user_joined_otr'
    | 'user_requested_otr_key_refresh'
    | 'user_key_refreshed_successfully'
    /** Sent when the message came through e2e */
    | 'e2e'
    /** Sent when a user has joined a room */
    | 'uj'
    /** Sent when a user has left a room */
    | 'ul'
    /** Sent when a user was removed */
    | 'ru'
    /** Sent when a user was added */
    | 'au'
    /** Sent when system messages were muted */
    | 'mute_unmute'
    /** Sent when a room name was changed */
    | 'r'
    /** Sent when a user joined a conversation */
    | 'ut'
    /** Welcome message */
    | 'wm'
    /** Sent when a message was removed */
    | 'rm'
    /** Sent when the role of a subscription has added */
    | 'subscription-role-added'
    /** Sent when the role of a subscription has removed */
    | 'subscription-role-removed'
    /** Sent when the room was archived */
    | 'room-archived'
    /** Sent when the room was unarchived */
    | 'room-unarchived'
    /** Sent when the privacy of the room has changed */
    | 'room_changed_privacy'
    /** Sent when the description of a room was changed */
    | 'room_changed_description'
    /** Sent when the announcement of a room was changed */
    | 'room_changed_announcement'
    /** Sent when the avatar of a room was changed */
    | 'room_changed_avatar'
    /** Sent when the topic of a room was changed */
    | 'room_changed_topic'
    /** Sent when e2e was enabled in a room */
    | 'room_e2e_enabled'
    /** Sent when e2e was disabled in a room */
    | 'room_e2e_disabled'
    /** Sent when a user was muted */
    | 'user-muted'
    /** Sent when a user was unmuted */
    | 'user-unmuted'
    /** Sent when a room is not readonly anymore */
    | 'room-removed-read-only'
    /** Sent when a room is set to readonly */
    | 'room-set-read-only'
    /** Sent when a room is set to allow reacting */
    | 'room-allowed-reacting'
    /** Sent when a room is set to disallow reacting */
    | 'room-disallowed-reacting'
    /** Sent on several instances when, such as when a livechat room is started */
    | 'command'
    /** Sent when a message is the start of a videoconf */
    | 'videoconf'
    /** Sent when a message was pinned */
    | 'message_pinned'
    /** Sent when an e2e message was pinned */
    | 'message_pinned_e2e'
    /** Sent when the room has a new moderator */
    | 'new-moderator'
    /** Sent when a moderator was removed */
    | 'moderator-removed'
    /** Sent when a room has a new owner */
    | 'new-owner'
    /** Sent when an owner was removed */
    | 'owner-removed'
    /** Sent when a room has a new leader */
    | 'new-leader'
    /** Sent when a leader was removed */
    | 'leader-removed'
    /** Sent when a user was added to a room */
    | 'discussion-created';
