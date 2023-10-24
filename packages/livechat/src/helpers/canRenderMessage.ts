import {
	MESSAGE_TYPE_COMMAND,
	MESSAGE_TYPE_LIVECHAT_CLOSED,
	MESSAGE_TYPE_LIVECHAT_NAVIGATION_HISTORY,
	MESSAGE_TYPE_PRIORITY_CHANGE,
	MESSAGE_TYPE_SLA_CHANGE,
	MESSAGE_TYPE_USER_ADDED,
	MESSAGE_TYPE_USER_JOINED,
	MESSAGE_TYPE_USER_LEFT,
	MESSAGE_VIDEO_CALL,
	MESSAGE_WEBRTC_CALL,
} from '../components/Messages/constants';

const msgTypesNotRendered = [
	MESSAGE_VIDEO_CALL,
	MESSAGE_WEBRTC_CALL,
	MESSAGE_TYPE_LIVECHAT_NAVIGATION_HISTORY,
	MESSAGE_TYPE_USER_ADDED,
	MESSAGE_TYPE_COMMAND,
	MESSAGE_TYPE_USER_JOINED,
	MESSAGE_TYPE_USER_LEFT,
	MESSAGE_TYPE_LIVECHAT_CLOSED,
	MESSAGE_TYPE_PRIORITY_CHANGE,
	MESSAGE_TYPE_SLA_CHANGE,
];

export const canRenderMessage = ({ t }: { t: string }) => !msgTypesNotRendered.includes(t);

export const canRenderTriggerMessage = (user: { token: string }) => (message: { trigger?: boolean; triggerAfterRegistration?: boolean }) =>
	!message.trigger || (!user && !message.triggerAfterRegistration) || (user && message.triggerAfterRegistration);
