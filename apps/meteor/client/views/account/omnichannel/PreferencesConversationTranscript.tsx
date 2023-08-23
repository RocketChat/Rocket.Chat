import { Accordion, Box, Field, FieldGroup, Tag, ToggleSwitch } from '@rocket.chat/fuselage';
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
					<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={omnichannelTranscriptPDF}>
							<Box display='flex' alignItems='center'>
								{t('Omnichannel_transcript_pdf')}
								<Box marginInline={4}>
									{!hasLicense && <Tag variant='featured'>{t('Enterprise')}</Tag>}
									{!canSendTranscriptPDF && hasLicense && <Tag>{t('No_permission')}</Tag>}
								</Box>
							</Box>
						</Field.Label>
						<Field.Row>
							<ToggleSwitch id={omnichannelTranscriptPDF} disabled={cantSendTranscriptPDF} {...register('omnichannelTranscriptPDF')} />
						</Field.Row>
					</Box>
					<Field.Hint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptPDF_Description')}</Field.Hint>
				</Field>
				<Field>
					<Box display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={omnichannelTranscriptEmail}>
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
							<ToggleSwitch
								id={omnichannelTranscriptEmail}
								disabled={!canSendTranscriptEmail}
								{...register('omnichannelTranscriptEmail')}
							/>
						</Field.Row>
					</Box>
					<Field.Hint>{t('Accounts_Default_User_Preferences_omnichannelTranscriptEmail_Description')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesConversationTranscript;
