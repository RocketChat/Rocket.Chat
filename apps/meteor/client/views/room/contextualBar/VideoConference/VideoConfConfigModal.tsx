import {
	Button,
	Callout,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalHeroImage,
	ModalTagline,
	ModalTitle,
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ConfigModalFeatureList from './layout/ConfigModalFeatureList';
import ConfigModalRequiredAction from './layout/ConfigModalRequiredAction';

export type VideoConfConfigModalProps = {
	onClose: () => void;
	onConfirm?: () => void;
	isAdmin: boolean;
};

const VideoConfConfigModal = ({ onClose, onConfirm, isAdmin }: VideoConfConfigModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline>{isAdmin ? t('Missing_configuration') : t('App_not_enabled')}</ModalTagline>
					<ModalTitle>{isAdmin ? t('Configure_video_conference') : t('Video_Conference')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<ModalHeroImage src='/images/conf-call-config.svg' />
				<Text fontScale='h3'>{t('Premium_capabilities')}</Text>
				<ConfigModalFeatureList>
					<li>{t('Ringtones_and_visual_indicators_notify_people_of_incoming_calls')}</li>
					<li>{t('Call_history_provides_a_record_of_when_calls_took_place_and_who_joined')}</li>
				</ConfigModalFeatureList>
				<Stack gap={12}>
					<Text fontScale='h3'>{t('Conference_call_apps')}</Text>
					<Callout icon='team' title={isAdmin ? t('Jitsi_included_with_Community') : 'Jitsi'}>
						{t('Open-source_conference_call_solution')}
					</Callout>
					<Callout icon='lightning' title={t('Pexip_Premium_only')}>
						{t('A_secure_and_highly_private_self-managed_solution_for_conference_calls')}
					</Callout>
					<Callout icon='lightning' title={t('Google_Meet_Premium_only')}>
						{t('Secure_SaaS_solution')} {t('A_cloud-based_platform_for_those_needing_a_plug-and-play_app')}
					</Callout>
				</Stack>
				<ConfigModalRequiredAction>
					<Text fontScale='h3'>{t('Required_action')}</Text>
					<Callout title={t('Missing_configuration')} type='warning'>
						{isAdmin
							? t('An_app_needs_to_be_installed_and_configured')
							: t('A_workspace_admin_needs_to_install_and_configure_a_conference_call_app')}
					</Callout>
				</ConfigModalRequiredAction>
			</ModalContent>
			<ModalFooter justify='space-between'>
				<ModalFooterAnnotation>
					{isAdmin
						? t('Configure_video_conference_to_make_it_available_on_this_workspace')
						: t('Talk_to_your_workspace_administrator_about_enabling_video_conferencing')}
				</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Close')}</Button>
					{onConfirm && isAdmin && (
						<Button variant='primary' onClick={onConfirm}>
							{t('Open_settings')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default VideoConfConfigModal;
