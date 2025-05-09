import type { IIncomingIntegration, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
	IconButton,
	Accordion,
	AccordionItem,
	Field,
	TextInput,
	Box,
	ToggleSwitch,
	Icon,
	TextAreaInput,
	FieldGroup,
	Select,
	FieldLabel,
	FieldRow,
	FieldHint,
} from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useId, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { EditIncomingWebhookFormData } from './EditIncomingWebhook';
import useClipboardWithToast from '../../../../hooks/useClipboardWithToast';
import { useHighlightedCode } from '../../../../hooks/useHighlightedCode';
import { useExampleData } from '../hooks/useExampleIncomingData';

const IncomingWebhookForm = ({ webhookData }: { webhookData?: Serialized<IIncomingIntegration> }) => {
	const { t } = useTranslation();
	const absoluteUrl = useAbsoluteUrl();

	const {
		control,
		watch,
		formState: { errors },
	} = useFormContext<EditIncomingWebhookFormData>();
	const { alias, emoji, avatar } = watch();

	const url = absoluteUrl(`hooks/${webhookData?._id}/${webhookData?.token}`);

	const additionalFields = useMemo(
		() => ({
			...(alias && { alias }),
			...(emoji && { emoji }),
			...(avatar && { avatar }),
		}),
		[alias, avatar, emoji],
	);

	const [exampleData, curlData] = useExampleData({
		additionalFields,
		url,
	});

	const { copy: copyWebhookUrl } = useClipboardWithToast(url);
	const { copy: copyToken } = useClipboardWithToast(`${webhookData?._id}/${webhookData?.token}`);
	const { copy: copyCurlData } = useClipboardWithToast(curlData);

	const scriptEngineOptions: SelectOption[] = useMemo(() => [['isolated-vm', t('Script_Engine_isolated_vm')]], [t]);

	const hilightedExampleJson = useHighlightedCode('json', JSON.stringify(exampleData, null, 2));

	const enabledField = useId();
	const nameField = useId();
	const channelField = useId();
	const usernameField = useId();
	const aliasField = useId();
	const avatarField = useId();
	const emojiField = useId();
	const overrideDestinationChannelEnabledField = useId();
	const scriptEnabledField = useId();
	const scriptEngineField = useId();
	const scriptField = useId();
	const webhookUrlField = useId();
	const tokenField = useId();
	const curlField = useId();

	return (
		<Box maxWidth='x600' alignSelf='center' w='full'>
			<Accordion>
				<AccordionItem defaultExpanded={Boolean(webhookData?._id)} title={t('Instructions')}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={webhookUrlField}>{t('Webhook_URL')}</FieldLabel>
							<FieldRow>
								<TextInput
									id={webhookUrlField}
									value={webhookData?._id ? url : t('Will_be_available_here_after_saving')}
									readOnly
									addon={webhookData?._id ? <IconButton mini onClick={() => copyWebhookUrl()} title={t('Copy')} icon='copy' /> : undefined}
									aria-describedby={`${webhookUrlField}-hint`}
								/>
							</FieldRow>
							<FieldHint id={`${webhookUrlField}-hint`}>{t('Send_your_JSON_payloads_to_this_URL')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={tokenField}>{t('Token')}</FieldLabel>
							<FieldRow>
								<TextInput
									id={tokenField}
									value={webhookData?._id ? `${webhookData?._id}/${webhookData?.token}` : t('Will_be_available_here_after_saving')}
									readOnly
									addon={webhookData?._id ? <IconButton mini onClick={() => copyToken()} title={t('Copy')} icon='copy' /> : undefined}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Example_payload')}</FieldLabel>
							<FieldRow>
								<Box fontScale='p2' withRichContent flexGrow={1}>
									<pre>
										<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hilightedExampleJson) }}></code>
									</pre>
								</Box>
							</FieldRow>
						</Field>
						{webhookData?._id && (
							<Field>
								<FieldLabel htmlFor={curlField}>Curl</FieldLabel>
								<FieldRow>
									<TextInput
										id={curlField}
										value={curlData}
										readOnly
										addon={webhookData?._id ? <IconButton mini onClick={() => copyCurlData()} title={t('Copy')} icon='copy' /> : undefined}
									/>
								</FieldRow>
							</Field>
						)}
					</FieldGroup>
				</AccordionItem>
				<AccordionItem title={t('Settings')} defaultExpanded>
					<FieldGroup>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={enabledField}>{t('Enabled')}</FieldLabel>
								<Controller
									name='enabled'
									control={control}
									render={({ field: { value, ...field } }) => <ToggleSwitch id={enabledField} {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={nameField}>{t('Name')}</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									render={({ field }) => <TextInput id={nameField} {...field} aria-describedby={`${nameField}-hint`} />}
								/>
							</FieldRow>
							<FieldHint id={`${nameField}-hint`}>{t('You_should_name_it_to_easily_manage_your_integrations')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={channelField} required>
								{t('Post_to_Channel')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='channel'
									control={control}
									rules={{ required: t('Required_field', { field: t('Post_to_Channel') }) }}
									render={({ field }) => (
										<TextInput
											id={channelField}
											{...field}
											addon={<Icon name='at' size='x20' />}
											aria-describedby={`${channelField}-hint-1 ${channelField}-hint-2 ${channelField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.channel)}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${channelField}-hint-1`}>{t('Messages_that_are_sent_to_the_Incoming_WebHook_will_be_posted_here')}</FieldHint>
							<FieldHint
								id={`${channelField}-hint-2`}
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(
										t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', {
											postProcess: 'sprintf',
											sprintf: ['@', '#', '@john', '#general'],
										}),
									),
								}}
							/>
							{errors?.channel && (
								<FieldError aria-live='assertive' id={`${channelField}-error`}>
									{errors?.channel.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={usernameField} required>
								{t('Post_as')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='username'
									control={control}
									rules={{ required: t('Required_field', { field: t('Post_to_Channel') }) }}
									render={({ field }) => (
										<TextInput
											id={usernameField}
											{...field}
											addon={<Icon name='user' size='x20' />}
											aria-describedby={`${usernameField}-hint-1 ${usernameField}-hint-2 ${usernameField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.username)}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${usernameField}-hint-1`}>{t('Choose_the_username_that_this_integration_will_post_as')}</FieldHint>
							<FieldHint id={`${usernameField}-hint-2`}>{t('Should_exists_a_user_with_this_username')}</FieldHint>
							{errors?.username && (
								<FieldError aria-live='assertive' id={`${usernameField}-error`}>
									{errors.username.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={aliasField}>{t('Alias')}</FieldLabel>
							<FieldRow>
								<Controller
									name='alias'
									control={control}
									render={({ field }) => (
										<TextInput id={aliasField} {...field} aria-describedby={`${aliasField}-hint`} addon={<Icon name='edit' size='x20' />} />
									)}
								/>
							</FieldRow>
							<FieldHint id={`${aliasField}-hint`}>{t('Choose_the_alias_that_will_appear_before_the_username_in_messages')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={avatarField}>{t('Avatar_URL')}</FieldLabel>
							<FieldRow>
								<Controller
									name='avatar'
									control={control}
									render={({ field }) => (
										<TextInput
											id={avatarField}
											{...field}
											aria-describedby={`${avatarField}-hint-1 ${avatarField}-hint-2`}
											addon={<Icon name='user-rounded' size='x20' alignSelf='center' />}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${avatarField}-hint-1`}>{t('You_can_change_a_different_avatar_too')}</FieldHint>
							<FieldHint id={`${avatarField}-hint-2`}>{t('Should_be_a_URL_of_an_image')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={emojiField}>{t('Emoji')}</FieldLabel>
							<FieldRow>
								<Controller
									name='emoji'
									control={control}
									render={({ field }) => (
										<TextInput
											id={emojiField}
											{...field}
											aria-describedby={`${emojiField}-hint-1 ${emojiField}-hint-2`}
											addon={<Icon name='emoji' size='x20' alignSelf='center' />}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${emojiField}-hint-1`}>{t('You_can_use_an_emoji_as_avatar')}</FieldHint>
							<FieldHint
								id={`${emojiField}-hint-2`}
								dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Example_s', { postProcess: 'sprintf', sprintf: [':ghost:'] })) }}
							/>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={overrideDestinationChannelEnabledField}>{t('Override_Destination_Channel')}</FieldLabel>
								<Controller
									name='overrideDestinationChannelEnabled'
									control={control}
									render={({ field: { value, ...field } }) => (
										<ToggleSwitch id={overrideDestinationChannelEnabledField} {...field} checked={value} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={scriptEnabledField}>{t('Script_Enabled')}</FieldLabel>
								<Controller
									name='scriptEnabled'
									control={control}
									render={({ field: { value, ...field } }) => <ToggleSwitch id={scriptEnabledField} {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={scriptEngineField}>{t('Script_Engine')}</FieldLabel>
							<FieldRow>
								<Controller
									name='scriptEngine'
									control={control}
									render={({ field }) => (
										<Select
											id={scriptEngineField}
											aria-describedby={`${scriptEngineField}-hint`}
											{...field}
											options={scriptEngineOptions}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${scriptEngineField}-hint`}>{t('Script_Engine_Description')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={scriptField}>{t('Script')}</FieldLabel>
							<FieldRow>
								<Controller
									name='script'
									control={control}
									render={({ field }) => (
										<TextAreaInput id={scriptField} {...field} rows={10} addon={<Icon name='code' size='x20' alignSelf='center' />} />
									)}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</AccordionItem>
			</Accordion>
		</Box>
	);
};

export default IncomingWebhookForm;
