import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import Page from '../../../components/Page';
import { useAccountPreferencesForm } from '../contexts/AccountPreferencesFormContext';
import PreferencesGlobalSection from './PreferencesGlobalSection';
import PreferencesHighlightsSection from './PreferencesHighlightsSection';
import PreferencesLocalizationSection from './PreferencesLocalizationSection';
import PreferencesMessagesSection from './PreferencesMessagesSection';
import PreferencesMyDataSection from './PreferencesMyDataSection';
import PreferencesNotificationsSection from './PreferencesNotificationsSection';
import PreferencesSoundSection from './PreferencesSoundSection';
import PreferencesUserPresenceSection from './PreferencesUserPresenceSection';

const AccountPreferencesPage: FC = () => {
	const t = useTranslation();
	const dataDownloadEnabled = useSetting('UserData_EnableDownload');
	const { hasAnyChange, handleSave } = useAccountPreferencesForm();

	return (
		<Page>
			<Page.Header title={t('Preferences')}>
				<ButtonGroup>
					<Button primary disabled={!hasAnyChange} onClick={handleSave}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Accordion>
						<PreferencesLocalizationSection defaultExpanded />
						<PreferencesGlobalSection />
						<PreferencesUserPresenceSection />
						<PreferencesNotificationsSection />
						<PreferencesMessagesSection />
						<PreferencesHighlightsSection />
						<PreferencesSoundSection />
						{dataDownloadEnabled && <PreferencesMyDataSection />}
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AccountPreferencesPage;
