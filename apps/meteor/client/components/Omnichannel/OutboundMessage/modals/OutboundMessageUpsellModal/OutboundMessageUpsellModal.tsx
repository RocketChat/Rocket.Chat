import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { getURL } from '../../../../../../app/utils/client';
import { useExternalLink } from '../../../../../hooks/useExternalLink';
import GenericUpsellModal from '../../../../GenericUpsellModal';

type OutboundMessageUpsellModalProps = {
	hasModule?: boolean;
	isAdmin?: boolean;
	onClose: () => void;
};

const OMNICHANNEL_DOCS_LINK = 'https://go.rocket.chat/i/omnichannel-docs';
const CONTACT_SALES_LINK = 'https://go.rocket.chat/i/contact-sales';

const OutboundMessageUpsellModal = ({ hasModule, isAdmin, onClose }: OutboundMessageUpsellModalProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);

	const openExternalLink = useExternalLink();

	useOutsideClick([ref], onClose);

	const props = useMemo(() => {
		if (!hasModule) {
			return {
				cancelText: t('Learn_more'),
				onCancel: () => openExternalLink(OMNICHANNEL_DOCS_LINK),
				confirmText: t('Contact_sales'),
				onConfirm: () => openExternalLink(CONTACT_SALES_LINK),
				onClose,
			};
		}

		return {
			cancelText: t('Learn_more'),
			annotation: !isAdmin ? t('Outbound_message_upsell_annotation') : undefined,
			onCancel: () => openExternalLink(OMNICHANNEL_DOCS_LINK),
			onClose,
		};
	}, [hasModule, isAdmin, onClose, openExternalLink, t]);

	return (
		<GenericUpsellModal
			{...props}
			title={t('Outbound_message_upsell_title')}
			description={t('Outbound_message_upsell_description')}
			img={getURL('images/outbound-message-upsell.svg')}
			imgAlt={t('Outbound_message_upsell_image_alt')}
			imgHeight={255}
		/>
	);
};

export default OutboundMessageUpsellModal;
