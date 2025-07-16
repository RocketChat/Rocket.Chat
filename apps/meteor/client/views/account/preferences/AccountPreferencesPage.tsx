import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useSetting, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
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
import type { AccountPreferencesData } from './useAccountPreferencesValues';
import { useAccountPreferencesValues } from './useAccountPreferencesValues';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { getDirtyFields } from '../../../lib/getDirtyFields';

const AccountPreferencesPage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
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

	const setPreferencesEndpoint = useEndpoint('POST', '/v1/users.setPreferences');
	const setPreferencesAction = useMutation({
		mutationFn: setPreferencesEndpoint,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => reset(currentData),
	});

	const handleSaveData = async (formData: AccountPreferencesData) => {
		const { highlights, dontAskAgainList, ...data } = getDirtyFields(formData, dirtyFields);
		if (highlights || highlights === '') {
			Object.assign(data, {
				highlights:
					typeof highlights === 'string' &&
					highlights
						.split(/,|\n/)
						.map((val) => val.trim())
						.filter(Boolean),
			});
		}

		if (dontAskAgainList) {
			const list =
				Array.isArray(dontAskAgainList) && dontAskAgainList.length > 0
					? dontAskAgainList.map(([action, label]) => ({ action, label }))
					: [];
			Object.assign(data, { dontAskAgainList: list });
		}

		setPreferencesAction.mutateAsync({ data });
	};

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
