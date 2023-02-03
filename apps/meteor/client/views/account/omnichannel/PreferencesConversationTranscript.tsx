import { Accordion, Box, Field, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import type { FormSectionProps } from './OmnichannelPreferencesPage';

const PreferencesConversationTranscript = ({ register }: FormSectionProps): ReactElement | null => {
	const t = useTranslation();

	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const canSendTranscriptPDF = usePermission('request-pdf-transcript');
	const canSendTranscriptEmail = usePermission('send-omnichannel-chat-transcript');

	return canSendTranscriptEmail || (canSendTranscriptPDF && hasLicense) ? (
		<Accordion.Item title={t('Conversational_transcript')}>
			<FieldGroup>
				{canSendTranscriptPDF && hasLicense && (
					<Field>
						<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Omnichannel_transcript_pdf')}</Field.Label>
							<Field.Row>
								<ToggleSwitch {...register('omnichannelTranscriptPDF')} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}</Field.Hint>
					</Field>
				)}
				{canSendTranscriptEmail && (
					<Field>
						<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Omnichannel_transcript_email')}</Field.Label>
							<Field.Row>
								<ToggleSwitch {...register('omnichannelTranscriptEmail')} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}</Field.Hint>
					</Field>
				)}
			</FieldGroup>
		</Accordion.Item>
	) : null;
};

export default PreferencesConversationTranscript;
