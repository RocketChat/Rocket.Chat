import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

export type RequiredAttributesRemovalModalProps = {
	attributeKeys: string[];
	entitlementsKnown: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

const RequiredAttributesRemovalModal = ({ attributeKeys, entitlementsKnown, onConfirm, onCancel }: RequiredAttributesRemovalModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			title={t('ABAC_Required_Attributes_Removal_Title')}
			variant='warning'
			confirmText={t('ABAC_Required_Attributes_Removal_Confirm')}
			cancelText={t('Cancel')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
			onDismiss={onCancel}
		>
			<Trans
				i18nKey={entitlementsKnown ? 'ABAC_Required_Attributes_Removal_Content' : 'ABAC_Required_Attributes_Removal_Content_Unknown'}
				values={{ attributes: attributeKeys.join(', ') }}
				components={{ bold: <Box is='span' fontWeight='bold' /> }}
			/>
		</GenericModal>
	);
};

export default RequiredAttributesRemovalModal;
