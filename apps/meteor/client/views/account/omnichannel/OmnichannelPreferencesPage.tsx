import { ButtonGroup, Button, Accordion, Stack } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useTranslation, useEndpoint, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useForm, FormProvider } from 'react-hook-form';

import PreferencesConversationTranscript from './PreferencesConversationTranscript';
import { PreferencesGeneral } from './PreferencesGeneral';
import ContentColumn from '../../../components/ContentColumn';

type FormData = {
	omnichannelTranscriptPDF: boolean;
	omnichannelTranscriptEmail: boolean;
};

const OmnichannelPreferencesPage = () => {
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
				<ContentColumn>
					<FormProvider {...methods}>
						<Stack gap='x24'>
							<PreferencesGeneral />
							<Accordion>
								<PreferencesConversationTranscript />
							</Accordion>
						</Stack>
					</FormProvider>
				</ContentColumn>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset({ omnichannelTranscriptPDF, omnichannelTranscriptEmail })}>{t('Cancel')}</Button>
					<Button variant='primary' disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default OmnichannelPreferencesPage;
