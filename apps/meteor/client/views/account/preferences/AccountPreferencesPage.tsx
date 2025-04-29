import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import PreferencesGlobalSection from './PreferencesGlobalSection';
import PreferencesHighlightsSection from './PreferencesHighlightsSection';
import PreferencesLocalizationSection from './PreferencesLocalizationSection';
import PreferencesMessagesSection from './PreferencesMessagesSection';
import PreferencesMyDataSection from './PreferencesMyDataSection';
import PreferencesNotificationsSection from './PreferencesNotificationsSection';
import PreferencesSoundSection from './PreferencesSoundSection';
import PreferencesUserPresenceSection from './PreferencesUserPresenceSection';
import { useAccountPreferencesValues } from './useAccountPreferencesValues';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { useSavePreferences } from '../../../hooks/account/useSavePreferences';

const AccountPreferencesPage = (): ReactElement => {
	const t = useTranslation();
	const dataDownloadEnabled = useSetting('UserData_EnableDownload');
	const preferencesValues = useAccountPreferencesValues();

	const methods = useForm({ defaultValues: preferencesValues });
	const {
		handleSubmit,
		reset,
		watch,
		formState: { isDirty, dirtyFields },
	} = methods;

	const currentData = watch();

	const handleSaveData = useSavePreferences({ dirtyFields, currentData, reset });

	const preferencesFormId = useId();

	return (
		<Page>
			<PageHeader title={t('Preferences')} />
			<PageScrollableContentWithShadow>
				<FormProvider {...methods}>
					<Box id={preferencesFormId} is='form' maxWidth='x600' w='full' alignSelf='center' onSubmit={handleSubmit(handleSaveData)}>
						<Accordion>
							<PreferencesLocalizationSection />
							<PreferencesGlobalSection />
							<PreferencesUserPresenceSection />
							<PreferencesNotificationsSection />
							<PreferencesMessagesSection />
							<PreferencesHighlightsSection />
							<PreferencesSoundSection />
							{dataDownloadEnabled && <PreferencesMyDataSection />}
						</Accordion>
					</Box>
				</FormProvider>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset(preferencesValues)}>{t('Cancel')}</Button>
					<Button form={preferencesFormId} primary type='submit'>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AccountPreferencesPage;
