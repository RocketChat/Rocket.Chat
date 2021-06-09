import { Box, Button, ButtonGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import React from 'react';

import Card from '../../../../components/Card';
import { useRoute } from '../../../../contexts/RouterContext';
import { useSetting, useSettingSetValue } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { CardHeader, Section } from './components';
import { SectionStatus } from './components/Section';

const FederationCard = () => {
	const t = useTranslation();

	const federationEnabled = useSetting('FEDERATION_Enabled') as boolean;
	const setFederationEnabled = useSettingSetValue('FEDERATION_Enabled');

	const federationHealthy = useSetting('FEDERATION_Healthy') as boolean;
	// const setFederationHealthy = useSettingSetValue('FEDERATION_Healthy');

	const settingsRoute = useRoute('admin/Federation');

	// Set status of each section

	// - Enabled
	let federationEnabledStatus = federationEnabled ? SectionStatus.SUCCESS : SectionStatus.UNKNOWN;

	// - Setup
	let federationSetupStatus = federationHealthy ? SectionStatus.SUCCESS : SectionStatus.FAILED;

	// - Adding users
	let federationAddingUsersStatus = SectionStatus.UNKNOWN;

	if (!federationEnabled) {
		federationEnabledStatus = SectionStatus.UNKNOWN;
		federationSetupStatus = SectionStatus.UNKNOWN;
		federationAddingUsersStatus = SectionStatus.UNKNOWN;
	}

	return (
		<Card>
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
						onChange={() => setFederationEnabled(!federationEnabled)}
					/>
				</Box>
			</CardHeader>
			<Card.Body>
				<Card.Col span={2}>
					<Section
						status={federationEnabledStatus}
						title={t('Federation_Enable')}
						subtitle='Federation integration is working correctly.'
					/>
					<Section
						status={federationSetupStatus}
						title={t('Federation_Adding_to_your_server')}
						subtitle='Changes needed on your Server the Domain Name, Target and Port.'
						link={!federationHealthy && 'Fix now!'}
					/>
					<Section
						status={federationAddingUsersStatus}
						title={t('Federation_Adding_users_from_another_server')}
						subtitle='We guide you on how to add your first federated user.'
					/>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<Button small onClick={() => settingsRoute.push()}>
						Settings
					</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default FederationCard;
