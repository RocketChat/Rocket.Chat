import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useOutboundMessageAccess } from '../../../components/outboundMessage/hooks';
import type { OutboundMessageModalProps } from '../../../components/outboundMessage/modals/OutboundMessageModal';
import { useOutboundMessageModal } from '../../../components/outboundMessage/modals/OutboundMessageModal';

type ContactInfoOutboundMessageButtonProps = {
	title?: string;
	disabled?: boolean;
	defaultValues?: OutboundMessageModalProps['defaultValues'];
};

const ContactInfoOutboundMessageButton = ({ defaultValues, disabled, title }: ContactInfoOutboundMessageButtonProps) => {
	const { t } = useTranslation();
	const outboundMessageModal = useOutboundMessageModal();
	const canSendOutboundMessage = useOutboundMessageAccess();

	if (!canSendOutboundMessage) {
		return null;
	}

	return (
		<IconButton
			disabled={disabled}
			onClick={() => outboundMessageModal.open(defaultValues)}
			tiny
			icon='send'
			title={`${t('Outbound_message')} ${title ? `(${title})` : ''}`}
		/>
	);
};

export default ContactInfoOutboundMessageButton;
