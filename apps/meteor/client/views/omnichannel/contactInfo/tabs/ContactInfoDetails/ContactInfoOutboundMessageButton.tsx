import { IconButton } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { OutboundMessageModalProps } from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';
import { useOutboundMessageModal } from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';

type ContactInfoOutboundMessageButtonProps = {
	title?: string;
	disabled?: boolean;
	defaultValues?: OutboundMessageModalProps['defaultValues'];
};

const ContactInfoOutboundMessageButton = ({ defaultValues, disabled, title }: ContactInfoOutboundMessageButtonProps) => {
	const { t } = useTranslation();
	const outboundMessageModal = useOutboundMessageModal();

	const hasLicense = useHasLicenseModule('livechat-enterprise') === true;
	const hasPermission = usePermission('outbound.send-messages');

	if (!hasLicense || !hasPermission) {
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
