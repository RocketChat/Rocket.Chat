import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const GrandfatheredAppsModal = () => {
	const t = useTranslation();
	// TODO: get app name through context?
	const appName = 'Example-App-Name';

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Title>{t('Uninstall_grandfathered_app', appName)}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close />
				</Modal.Header>
				<Modal.Content>
					<Box fontScale='p2b' mbe='x16' display='flex' flexDirection='column'>
						{t('App_will_lose_grandfathered_status')}
					</Box>
					{t('Workspaces_grandfathered_apps')}
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button>{t('Cancel')}</Button>
						{/* TODO: change button action */}
						<Button
							danger
							onClick={() => {
								console.log('click');
							}}
						>
							{t('Uninstall')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default GrandfatheredAppsModal;
