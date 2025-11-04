import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useOutboundMessageAccess } from '../../../../../components/Omnichannel/OutboundMessage/hooks';
import type { OutboundMessageModalProps } from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';
import { useOutboundMessageModal } from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';

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
