import { Modal, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

import GenericModal from '../../../components/GenericModal';

type CustomRoleUpsellModalProps = {
	onClose: () => void;
};

const CustomRoleUpsellModal: VFC<CustomRoleUpsellModalProps> = ({ onClose }) => {
	const t = useTranslation();
	return (
		<GenericModal
			id='custom-roles'
			tagline={t('Enterprise_feature')}
			title={t('Custom_roles')}
			onCancel={onClose}
			cancelText={t('Close')}
			confirmText={t('Talk_to_sales')}
			onConfirm={() => window.open('https://go.rocket.chat/i/ce-custom-roles')}
			variant='warning'
			icon={null}
		>
			<Modal.HeroImage maxHeight='initial' src={'images/custom-role-upsell-modal.png'} />
			<Box is='h3' fontScale='h3'>
				{t('Custom_roles_upsell_add_custom_roles_workspace')}
			</Box>
			<br />
			<p>{t('Custom_roles_upsell_add_custom_roles_workspace_description')}</p>
		</GenericModal>
	);
};

export default CustomRoleUpsellModal;
