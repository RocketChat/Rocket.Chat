import { Modal, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

type CustomRoleUpsellModalProps = {
	onClose: () => void;
};

const CustomRoleUpsellModal: VFC<CustomRoleUpsellModalProps> = ({ onClose }) => {
	const t = useTranslation();
	return (
		<Modal id='custom-roles'>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{t('Enterprise_feature')}</Modal.Tagline>
					<Modal.Title>{t('Custom_roles')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage maxHeight='initial' src={'images/custom-role-upsell-modal.png'} />
				<Box is='h3' fontScale='h3'>
					{t('Custom_roles_upsell_add_custom_roles_workspace')}
				</Box>
				<br />
				<p>{t('Custom_roles_upsell_add_custom_roles_workspace_description')}</p>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button secondary onClick={onClose}>
						{t('Close')}
					</Button>
					<ExternalLink to={'https://go.rocket.chat/i/custom-role-community-edition'}>
						<Button primary>{t('Talk_to_sales')}</Button>
					</ExternalLink>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomRoleUpsellModal;
