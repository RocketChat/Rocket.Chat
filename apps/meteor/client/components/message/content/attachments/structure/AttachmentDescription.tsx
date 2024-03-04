import { MessageBody } from '@rocket.chat/fuselage';
import type { Root } from '@rocket.chat/message-parser';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import MarkdownText from '../../../../MarkdownText';
import MessageContentBody from '../../../MessageContentBody';

type AttachmentDescriptionProps = {
	descriptionMd?: Root;
	description?: string;
	isMessageEncrypted?: boolean;
};

const AttachmentDescription = ({ description, descriptionMd, isMessageEncrypted }: AttachmentDescriptionProps) => {
	const t = useTranslation();

	if (isMessageEncrypted) {
		return <MessageBody>{t('E2E_message_encrypted_placeholder')}</MessageBody>;
	}

	return descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />;
};

export default memo(AttachmentDescription);
