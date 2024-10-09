import { Button, Modal } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';

export type AddonActionType = 'install' | 'enable';

type AddonRequiredModalProps = {
	actionType: AddonActionType;
	onDismiss: () => void;
	onInstallAnyway: () => void;
};

const GET_ADONS_URL = 'https://go.rocket.chat/i/get-addons';

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
					{actionType === 'install' && <Button onClick={onInstallAnyway}>{t('Install_anyway')}</Button>}
					<Button primary onClick={() => handleOpenLink(GET_ADONS_URL)}>
						{t('Contact_sales')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AddonRequiredModal;
