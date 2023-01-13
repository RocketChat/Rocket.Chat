import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
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
				{/* TODO: change image */}
				<Modal.HeroImage src='images/logo/logo.svg?v=3' />
				<Box is='h3' fontStyle='h3' fontSize='h3' fontScale='h3' mb='x16'>
					{t('Get_all_apps')}
				</Box>
				<Box is='span' fontStyle='p2'></Box>
				{t('Workspaces_on_community_edition')}
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
