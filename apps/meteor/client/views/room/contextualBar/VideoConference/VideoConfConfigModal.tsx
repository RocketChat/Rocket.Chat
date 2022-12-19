import { Modal, Button, Box, Callout, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
					<Modal.Tagline>{isAdmin ? t('Missing_configuration') : t('App_not_enabled')}</Modal.Tagline>
					<Modal.Title>{isAdmin ? t('Configure_video_conference') : t('Video_Conference')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage maxHeight='initial' src='/images/conf-call-config.svg' />
				<Box fontScale='h3'>{t('Enterprise_capabilities')}</Box>
				<Box withRichContent>
					<Box is='ul' pis='x24'>
						<li>{t('Ringtones_and_visual_indicators_notify_people_of_incoming_calls')}</li>
						<li>{t('Call_history_provides_a_record_of_when_calls_took_place_and_who_joined')}</li>
					</Box>
				</Box>
				<Box fontScale='h3'>{t('Conference_call_apps')}</Box>
				<Margins blockStart='x12'>
					<Callout icon='team' title={isAdmin ? t('Jitsi_included_with_Community') : 'Jitsi'}>
						{t('Open-source_conference_call_solution')}
					</Callout>
					<Callout icon='lightning' title={t('Pexip_Enterprise_only')}>
						{t('A_secure_and_highly_private_self-managed_solution_for_conference_calls')}
					</Callout>
					<Callout icon='lightning' title={t('Google_Meet_Enterprise_only')}>
						{t('Secure_SaaS_solution')} {t('A_cloud-based_platform_for_those_needing_a_plug-and-play_app')}
					</Callout>
				</Margins>
				<Box fontScale='h3' mbs='x24'>
					{t('Required_action')}
				</Box>
				<Callout mbs='x12' mbe='x24' title={t('Missing_configuration')} type='warning'>
					{isAdmin
						? t('An_app_needs_to_be_installed_and_configured')
						: t('A_workspace_admin_needs_to_install_and_configure_a_conference_call_app')}
				</Callout>
			</Modal.Content>
			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					{isAdmin
						? t('Configure_video_conference_to_make_it_available_on_this_workspace')
						: t('Talk_to_your_workspace_administrator_about_enabling_video_conferencing')}
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Close')}</Button>
					{onConfirm && isAdmin && (
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
