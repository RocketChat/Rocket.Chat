import type { MessageAttachmentAction } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';

import ActionAttachmentButton from './ActionAttachmentButton';
import { useExternalLink } from '../../../../../hooks/useExternalLink';

type ActionAttachmentProps = MessageAttachmentAction;

export const ActionAttachment = ({ actions }: ActionAttachmentProps) => {
	const handleLinkClick = useExternalLink();

	return (
		<Box mb={4}>
			<ButtonGroup small>
				{actions
					.filter(
						({ type, msg_in_chat_window: msgInChatWindow, url, image_url: image, text }) =>
							type === 'button' && (image || text) && (url || msgInChatWindow),
					)
					.map(({ text, url, msgId, msg, msg_processing_type: processingType = 'sendMessage', image_url: image }, index) => {
						const content = image ? <Box is='img' src={image} maxHeight={200} /> : text;
						if (url) {
							return (
								<Button role='link' onClick={() => handleLinkClick(url)} key={index} small>
									{content}
								</Button>
							);
						}
						return (
							<ActionAttachmentButton key={index} processingType={processingType} msg={msg} mid={msgId}>
								{content}
							</ActionAttachmentButton>
						);
					})}
			</ButtonGroup>
		</Box>
	);
};
