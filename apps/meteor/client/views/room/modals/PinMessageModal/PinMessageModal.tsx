import type { MessageQuoteAttachment, IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { QuoteAttachment } from '../../../../components/message/content/attachments/QuoteAttachment';
import AttachmentProvider from '../../../../providers/AttachmentProvider';

type PinMessageModalProps = { message: IMessage } & ComponentProps<typeof GenericModal>;

const PinMessageModal = ({ message, ...props }: PinMessageModalProps): ReactElement => {
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
		<GenericModal icon='pin' title={t('Pin_Message')} variant='warning' confirmText={t('Yes_pin_message')} {...props}>
			<Box mbe={16} is='p'>
				{t('Are_you_sure_you_want_to_pin_this_message')}
			</Box>
			<AttachmentProvider>
				<QuoteAttachment attachment={attachment} />
			</AttachmentProvider>
			<Box is='p' fontScale='c1' mbs={16}>
				{t('Pinned_messages_are_visible_to_everyone')}
			</Box>
			<Box is='p' fontScale='c1'>
				{t('Starred_messages_are_only_visible_to_you')}
			</Box>
		</GenericModal>
	);
};

export default PinMessageModal;
