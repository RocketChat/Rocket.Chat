import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { GET_ADDONS_LINK } from '../../admin/subscription/utils/links';

export type AddonActionType = 'install' | 'enable' | 'update';

type AddonRequiredModalProps = {
	actionType: AddonActionType;
	onDismiss: () => void;
	onInstallAnyway: () => void;
};

const AddonRequiredModal = ({ actionType, onDismiss, onInstallAnyway }: AddonRequiredModalProps) => {
	const { t } = useTranslation();

	const handleOpenLink = useExternalLink();

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Add-on_required')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onDismiss} />
			</ModalHeader>
			<ModalContent>{t('Add-on_required_modal_enable_content')}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					{['install', 'update'].includes(actionType) && (
						<Button onClick={onInstallAnyway}>{actionType === 'install' ? t('Install_anyway') : t('Update_anyway')}</Button>
					)}
					<Button primary onClick={() => handleOpenLink(GET_ADDONS_LINK)}>
						{t('Contact_sales')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AddonRequiredModal;
