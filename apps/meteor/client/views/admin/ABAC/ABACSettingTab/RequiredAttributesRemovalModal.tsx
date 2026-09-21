import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

export type RequiredAttributesRemovalModalProps = {
	unrestorableKeys: string[];
	onConfirm: () => void;
	onCancel: () => void;
};

const RequiredAttributesRemovalModal = ({ unrestorableKeys, onConfirm, onCancel }: RequiredAttributesRemovalModalProps) => {
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
				i18nKey='ABAC_Required_Attributes_Removal_Content'
				values={{ attributes: unrestorableKeys.join(', ') }}
				components={{ bold: <Box is='span' fontWeight='bold' /> }}
			/>
		</GenericModal>
	);
};

export default RequiredAttributesRemovalModal;
