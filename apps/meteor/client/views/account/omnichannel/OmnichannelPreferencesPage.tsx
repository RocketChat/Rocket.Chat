import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useEndpoint, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import PreferencesConversationTranscript from './PreferencesConversationTranscript';
import { PreferencesGeneral } from './PreferencesGeneral';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';

type FormData = {
	omnichannelTranscriptPDF: boolean;
	omnichannelTranscriptEmail: boolean;
};

const OmnichannelPreferencesPage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const alwaysSendEmailTranscript = useSetting('Livechat_transcript_send_always', false);
	const omnichannelTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const omnichannelTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;
	const omnichannelHideConversationAfterClosing = useUserPreference<boolean>('omnichannelHideConversationAfterClosing') ?? true;

	const methods = useForm({
		defaultValues: {
			omnichannelTranscriptPDF,
			omnichannelTranscriptEmail: alwaysSendEmailTranscript || omnichannelTranscriptEmail,
			omnichannelHideConversationAfterClosing,
		},
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
			<PageHeader title={t('Omnichannel')} />
			<PageScrollableContentWithShadow is='form' onSubmit={handleSubmit(handleSave)}>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Accordion>
						<FormProvider {...methods}>
							<PreferencesGeneral />
							<PreferencesConversationTranscript />
						</FormProvider>
					</Accordion>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset({ omnichannelTranscriptPDF, omnichannelTranscriptEmail })}>{t('Cancel')}</Button>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default OmnichannelPreferencesPage;
