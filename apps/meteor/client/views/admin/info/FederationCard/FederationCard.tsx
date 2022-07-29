import { Box, Button, ButtonGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, useSettingSetValue, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import Card from '../../../../components/Card';
import SettingsProvider from '../../../../providers/SettingsProvider';
import { CardHeader, Section } from './components';
import { FederationModal } from './components/FederationModal';
import { SectionStatus } from './components/Section';

const FederationCard: FC = () => {
	const t = useTranslation();

	const setModal = useSetModal();

	const federationEnabled = useSetting('FEDERATION_Enabled') as boolean;
	const setFederationEnabled = useSettingSetValue('FEDERATION_Enabled');

	const federationHealthy = useSetting('FEDERATION_Healthy') as boolean;

	const federationPopulated = useSetting('FEDERATION_Populated') as boolean;

	// Set status of each section

	// - Enabled
	let federationEnabledStatus = federationEnabled ? SectionStatus.SUCCESS : SectionStatus.UNKNOWN;

	// - Setup
	let federationSetupStatus = federationHealthy ? SectionStatus.SUCCESS : SectionStatus.FAILED;

	// - Adding users
	let federationAddingUsersStatus;

	if (federationPopulated) {
		federationAddingUsersStatus = SectionStatus.SUCCESS;
	} else if (federationHealthy) {
		federationAddingUsersStatus = SectionStatus.FAILED;
	} else {
		federationAddingUsersStatus = SectionStatus.UNKNOWN;
	}

	if (!federationEnabled) {
		federationEnabledStatus = SectionStatus.UNKNOWN;
		federationSetupStatus = SectionStatus.UNKNOWN;
		federationAddingUsersStatus = SectionStatus.UNKNOWN;
	}

	// Handle modal

	const handleModal = useMutableCallback(() =>
		setModal(
			<SettingsProvider privileged>
				<FederationModal
					onClose={(): void => {
						setModal();
					}}
				/>
			</SettingsProvider>,
		),
	);

	return (
		<Card data-qa-id='federation-card'>
			<CardHeader>
				<Card.Title>{t('Federation')}</Card.Title>
				<Box display='flex'>
					<Box mb='x8' fontScale='c1' display='flex'>
						{t('Enabled')}
					</Box>
					<ToggleSwitch
						mb='x6'
						mis='x6'
						checked={federationEnabled}
						onChange={(): Promise<void> => setFederationEnabled(!federationEnabled)}
					/>
				</Box>
			</CardHeader>
			<Card.Body>
				<Card.Col>
					<Section status={federationEnabledStatus} title={t('Federation_Enable')} subtitle={t('Federation_Is_working_correctly')} />
					<Section status={federationSetupStatus} title={t('Federation_Adding_to_your_server')} subtitle={t('Federation_Changes_needed')}>
						{!federationHealthy && <a onClick={handleModal}>{t('Federation_Fix_now')}</a>}
					</Section>
					<Section
						status={federationAddingUsersStatus}
						title={t('Federation_Adding_Federated_Users')}
						subtitle={t('Federation_Guide_adding_users')}
					/>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<Button small onClick={handleModal}>
						{t('Settings')}
					</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default FederationCard;
