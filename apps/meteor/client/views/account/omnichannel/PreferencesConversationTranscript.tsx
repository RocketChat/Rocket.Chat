import { AccordionItem, Tag } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldHint, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { useTranslation, usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const PreferencesConversationTranscript = () => {
	const t = useTranslation();
	const { control } = useFormContext();

	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');
	const alwaysSendEmailTranscript = useSetting('Livechat_transcript_send_always');
	const canSendTranscriptPDF = usePermission('request-pdf-transcript');
	const canSendTranscriptEmailPermission = usePermission('send-omnichannel-chat-transcript');
	const canSendTranscriptEmail = canSendTranscriptEmailPermission && !alwaysSendEmailTranscript;
	const cantSendTranscriptPDF = !canSendTranscriptPDF || !hasLicense;

	return (
		<AccordionItem defaultExpanded title={t('Conversational_transcript')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel>
							{t('Omnichannel_transcript_pdf')}
							{!hasLicense && (
								<Tag mi={4} variant='featured'>
									{t('Premium')}
								</Tag>
							)}
							{!canSendTranscriptPDF && hasLicense && <Tag mi={4}>{t('No_permission')}</Tag>}
						</FieldLabel>
						<Controller
							control={control}
							name='omnichannelTranscriptPDF'
							render={({ field: { value, ...field } }) => <ToggleSwitch disabled={cantSendTranscriptPDF} {...field} checked={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>
							{t('Omnichannel_transcript_email')}
							{!canSendTranscriptEmailPermission && <Tag mi={4}>{t('No_permission')}</Tag>}
						</FieldLabel>
						<Controller
							control={control}
							name='omnichannelTranscriptEmail'
							render={({ field: { value, ...field } }) => <ToggleSwitch disabled={!canSendTranscriptEmail} {...field} checked={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesConversationTranscript;
