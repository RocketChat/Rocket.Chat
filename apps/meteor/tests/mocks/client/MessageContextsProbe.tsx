import { messageRenderersDefaultValue, useMessageDisplay, useMessageRenderers } from '@rocket.chat/ui-message-list';

/** Tells which message contexts a place provides, so specs can prove a message provider is mounted there. */
const MessageContextsProbe = () => {
	const { allowsInteraction } = useMessageDisplay();
	const { Markup } = useMessageRenderers();

	return (
		<span>{`${Markup === messageRenderersDefaultValue.Markup ? 'default' : 'app'} renderers, interaction ${allowsInteraction ? 'on' : 'off'}`}</span>
	);
};

export default MessageContextsProbe;
