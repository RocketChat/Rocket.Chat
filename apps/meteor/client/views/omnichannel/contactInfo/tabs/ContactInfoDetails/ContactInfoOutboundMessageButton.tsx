import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import type OutboundMessageModal from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';
import { useOutboundMessageModal } from '../../../../../components/Omnichannel/OutboundMessage/modals/OutboundMessageModal';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';

type ContactInfoOutboundMessageButtonProps = {
	defaultValues?: ComponentProps<typeof OutboundMessageModal>['defaultValues'];
};

const ContactInfoOutboundMessageButton = ({ defaultValues }: ContactInfoOutboundMessageButtonProps) => {
	const { t } = useTranslation();
	const outboundMessageModal = useOutboundMessageModal();

	const hasLicense = useHasLicenseModule('livechat-enterprise') === true;

	if (!hasLicense) {
		return null;
	}

	return <IconButton onClick={() => outboundMessageModal.open(defaultValues)} tiny icon='send' title={t('Send_message')} />;
};

export default ContactInfoOutboundMessageButton;
