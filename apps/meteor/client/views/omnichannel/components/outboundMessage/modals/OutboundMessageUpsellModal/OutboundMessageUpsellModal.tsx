import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getURL } from '../../../../../../../app/utils/client';
import GenericUpsellModal from '../../../../../../components/GenericUpsellModal';
import { useExternalLink } from '../../../../../../hooks/useExternalLink';
import { CONTACT_SALES_LINK, OUTBOUND_DOCS_LINK } from '../../constants';

type OutboundMessageUpsellModalProps = {
	hasModule?: boolean;
	isAdmin?: boolean;
	isCommunity?: boolean;
	onClose: () => void;
};

const OutboundMessageUpsellModal = ({ isCommunity, hasModule, isAdmin, onClose }: OutboundMessageUpsellModalProps) => {
	const { t } = useTranslation();

	const openExternalLink = useExternalLink();

	const props = useMemo(() => {
		if (isAdmin && !hasModule) {
			return {
				cancelText: t('Learn_more'),
				onCancel: () => openExternalLink(OUTBOUND_DOCS_LINK),
				confirmText: isCommunity ? t('Upgrade') : t('Contact_sales'),
				onConfirm: () => openExternalLink(CONTACT_SALES_LINK),
				onClose,
			};
		}

		return {
			cancelText: t('Learn_more'),
			annotation: !isAdmin ? t('Outbound_message_upsell_annotation') : undefined,
			onCancel: () => openExternalLink(OUTBOUND_DOCS_LINK),
			onClose,
		};
	}, [hasModule, isAdmin, isCommunity, onClose, openExternalLink, t]);

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
