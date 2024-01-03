import { Button, ButtonGroup, Field, FieldHint, Modal } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { QuoteAttachment } from '../../../components/message/content/attachments/QuoteAttachment';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import { IMessage } from '@rocket.chat/core-typings';
import { useTranslation, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { MessageQuoteAttachment } from '@rocket.chat/core-typings';

const PinMessageQuoteAttachment = ({ message }: { message: IMessage }): ReactElement => {
	const t = useTranslation();
	const getUserAvatarPath = useUserAvatarPath();
	const displayName = useUserDisplayName(message.u);

	const avatarUrl = getUserAvatarPath(message.u.username);
	const attachment = {
		author_name: String(displayName),
		author_link: '',
		author_icon: avatarUrl,
		message_link: '',
		text: message.msg,
		attachments: message.attachments as MessageQuoteAttachment[],
		md: message.md,
	};
	return (
		<>
			<Field>
				<FieldHint>{t('Are_you_sure_you_want_to_pin_this_message')}</FieldHint>
				<QuoteAttachment attachment={attachment} />
				<FieldHint>{t('Pinned_messages_are_visible_to_all_room_members')}</FieldHint>
				<FieldHint>{t('Starred_messages_are_only_visible_to_you')}</FieldHint>
			</Field>
		</>
	);
};

export default PinMessageQuoteAttachment;
