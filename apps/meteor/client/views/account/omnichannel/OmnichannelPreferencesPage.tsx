import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import Page from '../../../components/Page';
import PreferencesConversationTranscript from './PreferencesConversationTranscript';
import { PreferencesGeneral } from './PreferencesGeneral';

type FormData = {
	omnichannelTranscriptPDF: boolean;
	omnichannelTranscriptEmail: boolean;
};

const OmnichannelPreferencesPage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const omnichannelTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const omnichannelTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;
	const omnichannelHideConversationAfterClosing = useUserPreference<boolean>('omnichannelHideConversationAfterClosing') ?? true;

	const methods = useForm({
		defaultValues: { omnichannelTranscriptPDF, omnichannelTranscriptEmail, omnichannelHideConversationAfterClosing },
	});

	const {
		handleSubmit,
		formState: { isDirty },
		reset,
	} = methods;

	const saveFn = useEndpoint('POST', '/v1/users.setPreferences');

	const handleSave = async (data: FormData) => {
		try {
			await saveFn({ data });
			reset(data);
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Page>
			<Page.Header title={t('Omnichannel')} />
			<Page.ScrollableContentWithShadow is='form' onSubmit={handleSubmit(handleSave)}>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Accordion>
						<FormProvider {...methods}>
							<PreferencesGeneral />
							<PreferencesConversationTranscript />
						</FormProvider>
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset({ omnichannelTranscriptPDF, omnichannelTranscriptEmail })}>{t('Cancel')}</Button>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default OmnichannelPreferencesPage;
