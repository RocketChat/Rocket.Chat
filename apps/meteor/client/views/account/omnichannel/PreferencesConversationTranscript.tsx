import { AccordionItem, Tag } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldHint, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { useTranslation, usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useFormContext } from 'react-hook-form';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const PreferencesConversationTranscript = () => {
	const t = useTranslation();

	const { register } = useFormContext();

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
						<ToggleSwitch disabled={cantSendTranscriptPDF} {...register('omnichannelTranscriptPDF')} />
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>
							{t('Omnichannel_transcript_email')}
							{!canSendTranscriptEmailPermission && <Tag mi={4}>{t('No_permission')}</Tag>}
						</FieldLabel>
						<ToggleSwitch disabled={!canSendTranscriptEmail} {...register('omnichannelTranscriptEmail')} />
					</FieldRow>
					<FieldHint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesConversationTranscript;
