import { Accordion, Box, Field, FieldGroup, FieldLabel, FieldRow, FieldHint, Tag, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';

const PreferencesConversationTranscript = () => {
	const t = useTranslation();

	const { register } = useFormContext();

	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const canSendTranscriptPDF = usePermission('request-pdf-transcript');
	const canSendTranscriptEmail = usePermission('send-omnichannel-chat-transcript');
	const cantSendTranscriptPDF = !canSendTranscriptPDF || !hasLicense;

	const omnichannelTranscriptPDF = useUniqueId();
	const omnichannelTranscriptEmail = useUniqueId();

	return (
		<Accordion.Item defaultExpanded title={t('Conversational_transcript')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={omnichannelTranscriptPDF}>
							<Box display='flex' alignItems='center'>
								{t('Omnichannel_transcript_pdf')}
								<Box marginInline={4}>
									{!hasLicense && <Tag variant='featured'>{t('Premium')}</Tag>}
									{!canSendTranscriptPDF && hasLicense && <Tag>{t('No_permission')}</Tag>}
								</Box>
							</Box>
						</FieldLabel>
						<ToggleSwitch id={omnichannelTranscriptPDF} disabled={cantSendTranscriptPDF} {...register('omnichannelTranscriptPDF')} />
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={omnichannelTranscriptEmail}>
							<Box display='flex' alignItems='center'>
								{t('Omnichannel_transcript_email')}
								{!canSendTranscriptEmail && (
									<Box marginInline={4}>
										<Tag>{t('No_permission')}</Tag>
									</Box>
								)}
							</Box>
						</FieldLabel>
						<ToggleSwitch id={omnichannelTranscriptEmail} disabled={!canSendTranscriptEmail} {...register('omnichannelTranscriptEmail')} />
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesConversationTranscript;
