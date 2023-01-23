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
				{canSendTranscriptEmail && (
					<Field>
						<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Send_conversation_transcript_via_email')}</Field.Label>
							<Field.Row>
								<ToggleSwitch {...register('omnichannelTranscriptEmail')} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Always_send_the_transcript_to_contacts_at_the_end_of_the_conversations')}</Field.Hint>
					</Field>
				)}

				{canSendTranscriptPDF && hasLicense && (
					<Field>
						<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Export_conversation_transcript_as_PDF')}</Field.Label>
							<Field.Row>
								<ToggleSwitch {...register('omnichannelTranscriptPDF')} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Always_export_the_transcript_as_PDF_at_the_end_of_conversations')}</Field.Hint>
					</Field>
				)}
			</FieldGroup>
		</Accordion.Item>
	) : null;
};

export default PreferencesConversationTranscript;
