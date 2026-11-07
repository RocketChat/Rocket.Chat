import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter, getDirtyFields } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import PreferencesGlobalSection from './PreferencesGlobalSection.js';
import PreferencesHighlightsSection from './PreferencesHighlightsSection.js';
import PreferencesLocalizationSection from './PreferencesLocalizationSection.js';
import PreferencesMessagesSection from './PreferencesMessagesSection.js';
import PreferencesMyDataSection from './PreferencesMyDataSection.js';
import PreferencesNotificationsSection from './PreferencesNotificationsSection.js';
import PreferencesSoundSection from './PreferencesSoundSection.js';
import PreferencesUserPresenceSection from './PreferencesUserPresenceSection.js';
import type { AccountPreferencesData, PreferencesViewModel } from '../logic/usePreferences.js';

export type PreferencesViewProps = {
	vm: PreferencesViewModel;
};

const PreferencesView = ({ vm }: PreferencesViewProps) => {
	const t = useTranslation();

	const methods = useForm({ defaultValues: vm.values });

	const {
		handleSubmit,
		reset,
		watch,
		formState: { isDirty, dirtyFields },
	} = methods;

	const currentData = watch();

	const handleSaveData = async (formData: AccountPreferencesData) => {
		await vm.save(getDirtyFields(formData, dirtyFields));
		reset(currentData);
	};

	const preferencesFormId = useId();

	return (
		<Page>
			<PageHeader title={t('Preferences')} />
			<PageScrollableContentWithShadow>
				<FormProvider {...methods}>
					<Box id={preferencesFormId} is='form' maxWidth='x600' width='full' alignSelf='center' onSubmit={handleSubmit(handleSaveData)}>
						<Accordion>
							<PreferencesLocalizationSection languages={vm.languages} />
							<PreferencesGlobalSection dontAskAgainItems={vm.dontAskAgainItems} />
							<PreferencesUserPresenceSection />
							<PreferencesNotificationsSection notifications={vm.notifications} onSendTestNotification={vm.sendTestNotification} />
							<PreferencesMessagesSection />
							<PreferencesHighlightsSection />
							<PreferencesSoundSection sounds={vm.sounds} />
							{vm.dataDownloadEnabled && (
								<PreferencesMyDataSection
									dialog={vm.dataDownloadDialog}
									onRequestDataDownload={vm.requestDataDownload}
									onDismissDialog={vm.dismissDataDownloadDialog}
								/>
							)}
						</Accordion>
					</Box>
				</FormProvider>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset(vm.values)}>{t('Cancel')}</Button>
					<Button form={preferencesFormId} variant='primary' type='submit'>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default PreferencesView;
