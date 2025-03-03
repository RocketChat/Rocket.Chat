import {
	Modal,
	Button,
	Box,
	Callout,
	Margins,
	ModalHeader,
	ModalHeaderText,
	ModalTagline,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalHeroImage,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
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
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline>{t('VoIP')}</ModalTagline>
					<ModalTitle>{t('Team_voice_call')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<ModalHeroImage maxHeight='initial' src='/images/teams-voip-config.svg' />
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
			</ModalContent>
			<ModalFooter justifyContent={!isAdmin && hasModule ? 'space-between' : 'end'}>
				{!isAdmin && hasModule && <ModalFooterAnnotation>{t('Only_admins_can_perform_this_setup')}</ModalFooterAnnotation>}
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					{onConfirm && isAdmin && hasModule && (
						<Button primary onClick={onConfirm}>
							{t('Go_to_settings')}
						</Button>
					)}
					{isAdmin && !hasModule && (
						<Button primary onClick={() => openExternalLink(GET_ADDONS_LINK)}>
							{t('Contact_sales')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TeamsVoipConfigModal;
