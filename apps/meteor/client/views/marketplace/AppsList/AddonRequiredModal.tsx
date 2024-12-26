import { Button, Modal } from '@rocket.chat/fuselage';
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
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Add-on_required')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onDismiss} />
			</Modal.Header>
			<Modal.Content>{t('Add-on_required_modal_enable_content')}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					{['install', 'update'].includes(actionType) && (
						<Button onClick={onInstallAnyway}>{actionType === 'install' ? t('Install_anyway') : t('Update_anyway')}</Button>
					)}
					<Button primary onClick={() => handleOpenLink(GET_ADDONS_LINK)}>
						{t('Contact_sales')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AddonRequiredModal;
