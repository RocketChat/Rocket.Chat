import { Modal, Button, Box, Callout, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type VideoConfConfigModalProps = {
	onClose: () => void;
	onConfirm?: () => void;
	isAdmin: boolean;
};

const VideoConfConfigModal = ({ onClose, onConfirm, isAdmin }: VideoConfConfigModalProps): ReactElement => {
	const t = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{isAdmin ? t('Missing_configuration') : 'App not enabled'}</Modal.Tagline>
					<Modal.Title>Configure conference call</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage maxHeight='initial' src='/images/conf-call-config.svg' />
				<Box fontScale='h3'>Enterprise capabilities</Box>
				<Box withRichContent>
					<Box is='ul' pis='x24'>
						<li>Ringtones and visual indicators notify people of incoming calls.</li>
						<li>Call history provides a record of when calls took place and who joined.</li>
					</Box>
				</Box>
				<Box fontScale='h3'>Conference call apps</Box>
				<Margins blockStart='x12'>
					<Callout title='Pexip (Enterprise only)'>A secure and highly private self-managed solution for conference calls.</Callout>
					<Callout title='Google Meet (Enterprise only)'>
						Secure SaaS solution. A cloud-based platform for those needing a plug-and-play app.
					</Callout>
					<Callout title='Jitsi, included with Community'>Open-souce conference call solution.</Callout>
				</Margins>

				<Box fontScale='h3' mbs='x24'>
					{t('Required_action')}
				</Box>
				<Callout mbs='x12' mbe='x24' title={t('Missing_configuration')} type='warning'>
					{isAdmin
						? 'An app needs to be installed and configured.'
						: 'A workspace admin needs to be install and configure a conference call app.'}
				</Callout>
			</Modal.Content>
			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					{isAdmin
						? 'Configure video conference to make it available on this workspace'
						: 'Talk to your workspace administrator about enabling video conferencing'}
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Close')}</Button>
					{onConfirm && (
						<Button primary onClick={onConfirm}>
							{t('Open_settings')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default VideoConfConfigModal;
