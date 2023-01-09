import type { MessageAttachmentAction } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import ActionAttachmentButton from './ActionAttachmentButton';

export const ActionAttachment: FC<MessageAttachmentAction> = ({ actions }) => (
	<ButtonGroup mb='x4' {...({ small: true } as any)}>
		{actions
			.filter(
				({ type, msg_in_chat_window: msgInChatWindow, url, image_url: image, text }) =>
					type === 'button' && (image || text) && (url || msgInChatWindow),
			)
			.map(({ text, url, msgId, msg, msg_processing_type: processingType = 'sendMessage', image_url: image }, index) => {
				const content = image ? <Box is='img' src={image} maxHeight={200} /> : text;
				if (url) {
					return (
						<Button is='a' href={url} target='_blank' rel='noopener noreferrer' key={index} small>
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
);
