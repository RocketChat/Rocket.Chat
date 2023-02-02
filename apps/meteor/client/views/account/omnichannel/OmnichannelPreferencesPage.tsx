import { ButtonGroup, Button, Box, Accordion } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import PreferencesConversationTranscript from './PreferencesConversationTranscript';

type CurrentData = {
	omnichannelTranscriptPDF: boolean;
	omnichannelTranscriptEmail: boolean;
};

export type FormSectionProps = {
	register: UseFormRegister<CurrentData>;
};

const OmnichannelPreferencesPage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const omnichannelTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const omnichannelTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;

	const {
		handleSubmit,
		register,
		formState: { isDirty },
		reset,
	} = useForm({
		defaultValues: { omnichannelTranscriptPDF, omnichannelTranscriptEmail },
	});

	const saveFn = useEndpoint('POST', '/v1/users.setPreferences');

	const handleSave = async (data: CurrentData) => {
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
			<Page.Header title={t('Omnichannel')}>
				<ButtonGroup>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Accordion>
						<PreferencesConversationTranscript register={register} />
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default OmnichannelPreferencesPage;
