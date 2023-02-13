import { Accordion, Box, Field, FieldGroup, Tag, ToggleSwitch } from '@rocket.chat/fuselage';
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
	const cantSendTranscriptPDF = !canSendTranscriptPDF || !hasLicense;

	return (
		<Accordion.Item defaultExpanded title={t('Conversational_transcript')}>
			<FieldGroup>
				<Field>
					<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label color={cantSendTranscriptPDF ? 'disabled' : undefined}>
							<Box display='flex' alignItems='center'>
								{t('Omnichannel_transcript_pdf')}
								<Box marginInline={4}>
									{!hasLicense && <Tag variant='featured'>{t('Enterprise')}</Tag>}
									{!canSendTranscriptPDF && hasLicense && <Tag>{t('No_permission')}</Tag>}
								</Box>
							</Box>
						</Field.Label>
						<Field.Row>
							<ToggleSwitch disabled={cantSendTranscriptPDF} {...register('omnichannelTranscriptPDF')} />
						</Field.Row>
					</Box>
					<Field.Hint color={cantSendTranscriptPDF ? 'disabled' : undefined}>
						{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}
					</Field.Hint>
				</Field>
				<Field>
					<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label color={!canSendTranscriptEmail ? 'disabled' : undefined}>
							<Box display='flex' alignItems='center'>
								{t('Omnichannel_transcript_email')}
								{!canSendTranscriptEmail && (
									<Box marginInline={4}>
										<Tag>{t('No_permission')}</Tag>
									</Box>
								)}
							</Box>
						</Field.Label>
						<Field.Row>
							<ToggleSwitch disabled={!canSendTranscriptEmail} {...register('omnichannelTranscriptEmail')} />
						</Field.Row>
					</Box>
					<Field.Hint color={!canSendTranscriptEmail ? 'disabled' : undefined}>
						{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}
					</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesConversationTranscript;
