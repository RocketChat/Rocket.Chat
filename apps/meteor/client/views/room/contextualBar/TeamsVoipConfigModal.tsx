import { Modal, Button, Box, Callout, Margins } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { GET_ADDONS_LINK } from '../../admin/subscription/utils/links';

type TeamsVoipConfigModalProps = {
	onClose: () => void;
	onConfirm?: () => void;
	isAdmin: boolean;
	hasModule: boolean;
};

const TeamsVoipConfigModal = ({ onClose, onConfirm, isAdmin, hasModule }: TeamsVoipConfigModalProps): ReactElement => {
	const { t } = useTranslation();
	const openExternalLink = useExternalLink();

	const getCalloutWarning = () => {
		if (isAdmin && !hasModule) {
			return t('Contact_sales_start_using_VoIP');
		}

		if (!isAdmin && !hasModule) {
			return t('Contact_your_workspace_admin_to_start_using_VoIP');
		}

		return t('VoIP_available_setup_freeswitch_server_details');
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{t('VoIP')}</Modal.Tagline>
					<Modal.Title>{t('Team_voice_call')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Modal.HeroImage maxHeight='initial' src='/images/teams-voip-config.svg' />
				<Box paddingBlock={24}>
					{t('Fully_integrated_voip_receive_internal_external_calls_without_switching_between_apps_external_systems')}
				</Box>
				<Box fontScale='h3'>{t('Features')}</Box>
				<Margins block={24}>
					<Box withRichContent>
						<Box is='ul' pis={24}>
							<li>
								<Trans i18nKey='VoIP_TeamCollab_Feature1'>
									<strong>Direct calling:</strong> Instantly start or receive calls with team members within your Rocket.Chat workspace.
								</Trans>
							</li>
							<li>
								<Trans i18nKey='VoIP_TeamCollab_Feature2'>
									<strong>Extension management:</strong> Admins can assign unique extensions to users, enabling quick, direct dialing both
									from inside and outside your organization.
								</Trans>
							</li>
							<li>
								<Trans i18nKey='VoIP_TeamCollab_Feature3'>
									<strong>Call transfers:</strong> Seamlessly transfer active calls to ensure users reach the right team member.
								</Trans>
							</li>
							<li>
								<Trans i18nKey='VoIP_TeamCollab_Feature4'>
									<strong>Availability settings:</strong> Users can control their availability to receive calls, enhancing flexibility.
								</Trans>
							</li>
						</Box>
					</Box>
				</Margins>
				<Box fontScale='h3' mbs={24}>
					{t('Required_action')}
				</Box>
				<Callout mbs={12} mbe={24} title={!hasModule ? t('Subscription_add-on_required') : t('FreeSwitch_setup_required')} type='warning'>
					{getCalloutWarning()}
				</Callout>
			</Modal.Content>
			<Modal.Footer justifyContent={!isAdmin && hasModule ? 'space-between' : 'end'}>
				{!isAdmin && hasModule && <Modal.FooterAnnotation>{t('Only_admins_can_perform_this_setup')}</Modal.FooterAnnotation>}
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					{onConfirm && isAdmin && hasModule && (
						<Button primary onClick={onConfirm}>
							{t('Open_settings')}
						</Button>
					)}
					{isAdmin && !hasModule && (
						<Button primary onClick={() => openExternalLink(GET_ADDONS_LINK)}>
							{t('Contact_sales')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TeamsVoipConfigModal;
