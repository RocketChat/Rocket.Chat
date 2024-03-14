import { MessageBody } from '@rocket.chat/fuselage';
import type { Root } from '@rocket.chat/message-parser';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useContext } from 'react';

import MarkdownText from '../../../../MarkdownText';
import MessageContentBody from '../../../MessageContentBody';
import { AttachmentEncryptionContext } from '../contexts/AttachmentEncryptionContext';

type AttachmentDescriptionProps = {
	descriptionMd?: Root;
	description?: string;
};

const AttachmentDescription = ({ description, descriptionMd }: AttachmentDescriptionProps) => {
	const t = useTranslation();

	const { isMessageEncrypted } = useContext(AttachmentEncryptionContext);

	if (isMessageEncrypted) {
		return <MessageBody>{t('E2E_message_encrypted_placeholder')}</MessageBody>;
	}
	console.log({description, descriptionMd})
	return descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} data-qa-type='ATTACHMENT'/>;
};

export default memo(AttachmentDescription);
