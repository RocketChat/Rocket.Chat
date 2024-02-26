import {
	MESSAGE_TYPE_COMMAND,
	MESSAGE_TYPE_LIVECHAT_NAVIGATION_HISTORY,
	MESSAGE_TYPE_PRIORITY_CHANGE,
	MESSAGE_TYPE_SLA_CHANGE,
	MESSAGE_VIDEO_CALL,
} from '../components/Messages/constants';
import type { LivechatSytemMessageType } from '../store';
import store from '../store';

const msgTypesNotRendered = [
	MESSAGE_VIDEO_CALL,
	MESSAGE_TYPE_LIVECHAT_NAVIGATION_HISTORY,
	MESSAGE_TYPE_COMMAND,
	MESSAGE_TYPE_PRIORITY_CHANGE,
	MESSAGE_TYPE_SLA_CHANGE,
];

export const canRenderSystemMessage = (message: { t: string }) => {
	const { config, iframe } = store.state;
	const configHiddenSystemMessages = config.settings.hiddenSystemMessages || [];
	const localHiddenSystemMessages = iframe.hiddenSystemMessages || [];
	const hiddenSystemMessages = [...configHiddenSystemMessages, ...localHiddenSystemMessages];

	return !hiddenSystemMessages.includes(message.t as LivechatSytemMessageType);
};

export const canRenderMessage = ({ t }: { t: string }) => !msgTypesNotRendered.includes(t) && canRenderSystemMessage({ t });
