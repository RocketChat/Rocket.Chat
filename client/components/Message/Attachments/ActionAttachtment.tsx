import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { AttachmentProps } from '.';
// DEPRECATED

type Action = {
	msgId?: string;
	type: 'button';
	text: string;
	msg?: string;
	url?: string;
	image_url?: string;
	is_webview?: true;
	msg_in_chat_window?: true;
	msg_processing_type?: 'sendMessage' | 'respondWithMessage' | 'respondWithQuotedMessage';
};

export type ActionAttachmentProps = {
	button_alignment: 'horizontal'| 'vertical';
	actions: Array<Action>;
} & AttachmentProps;

export const ActionAttachment: FC<ActionAttachmentProps> = ({ actions }) => <ButtonGroup mb='x4' {...{ small: true }}>{
	actions.filter(({ type, msg_in_chat_window: msgInChatWindow, url, image_url: image, text }) => type === 'button' && (image || text) && (url || msgInChatWindow)).map(({ text, url, msgId, msg, msg_processing_type: processingType = 'sendMessage', image_url: image }, index) => {
		const content = image ? <Box is='img' src={image} maxHeight={200}/> : text;
		if (url) {
			return <Button is='a' href={url} target='_blank' rel='noopener noreferrer' key={index} small>{content}</Button>;
		}
		return <Button className={`js-actionButton-${ processingType }`} key={index} small value={msg} id={msgId}>{content}</Button>;
	})}</ButtonGroup>;
