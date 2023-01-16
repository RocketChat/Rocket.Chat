import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const UnlimitedAppsUpsellModal = () => {
	const t = useTranslation();
	const authorized = useRole('admin');

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline color='font-annotation'>{t('Enterprise_feature')}</Modal.Tagline>

					<Modal.Title>{t('Enable_unlimited_apps')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage src='images/unlimited-apps-modal.svg' />
				<Box is='h3' fontStyle='h3' fontSize='h3' fontScale='h3' mb='x16'>
					{t('Get_all_apps')}
				</Box>
				<Box is='span' fontStyle='p2'></Box>
				{authorized ? t('Workspaces_on_community_edition_admin') : t('Workspaces_on_community_edition_not_admin')}
			</Modal.Content>
			<Modal.Footer>
				{authorized ? (
					<Modal.FooterControllers>
						<Button>{t('Talk_to_sales')}</Button>
						<Button
							primary
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Start_free_trial')}
						</Button>
					</Modal.FooterControllers>
				) : (
					<Modal.FooterControllers>
						<Button
							primary
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Talk_to_sales')}
						</Button>
					</Modal.FooterControllers>
				)}
			</Modal.Footer>
		</Modal>
	);
};

export default UnlimitedAppsUpsellModal;
