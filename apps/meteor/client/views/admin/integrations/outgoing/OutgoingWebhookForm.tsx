import type { IOutgoingIntegration } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
	AccordionItem,
	FieldHint,
	FieldLabel,
	FieldRow,
	Field,
	TextInput,
	Box,
	ToggleSwitch,
	Icon,
	TextAreaInput,
	FieldGroup,
	Select,
	Accordion,
} from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useId, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { outgoingEvents } from '../../../../../app/integrations/lib/outgoingEvents';
import { useHighlightedCode } from '../../../../hooks/useHighlightedCode';
import { useExampleData } from '../hooks/useExampleIncomingData';

type EditOutgoingWebhookPayload = Pick<
	IOutgoingIntegration,
	| 'enabled'
	| 'impersonateUser'
	| 'event'
	| 'urls'
	| 'token'
	| 'triggerWords'
	| 'targetRoom'
	| 'channel'
	| 'username'
	| 'name'
	| 'alias'
	| 'avatar'
	| 'emoji'
	| 'scriptEnabled'
	| 'scriptEngine'
	| 'script'
	| 'retryFailedCalls'
	| 'retryCount'
	| 'retryDelay'
	| 'triggerWordAnywhere'
	| 'runOnEdits'
>;

const OutgoingWebhookForm = () => {
	const { t } = useTranslation();

	const {
		control,
		watch,
		formState: { errors },
	} = useFormContext<EditOutgoingWebhookPayload>();
	const { event, alias, emoji, avatar } = watch();

	const retryDelayOptions: SelectOption[] = useMemo(
		() => [
			['powers-of-ten', t('powers-of-ten')],
			['powers-of-two', t('powers-of-two')],
			['increments-of-two', t('increments-of-two')],
		],
		[t],
	);

	const eventOptions: SelectOption[] = useMemo(
		() => Object.entries(outgoingEvents).map(([key, val]) => [key, t(val.label as TranslationKey)]),
		[t],
	);

	const scriptEngineOptions: SelectOption[] = useMemo(() => [['isolated-vm', t('Script_Engine_isolated_vm')]], [t]);

	const showChannel = useMemo(() => outgoingEvents[event].use.channel, [event]);
	const showTriggerWords = useMemo(() => outgoingEvents[event].use.triggerWords, [event]);
	const showTargetRoom = useMemo(() => outgoingEvents[event].use.targetRoom, [event]);

	const additionalFields = useMemo(
		() => ({
			...(alias && { alias }),
			...(emoji && { emoji }),
			...(avatar && { avatar }),
		}),
		[alias, avatar, emoji],
	);

	const [exampleData] = useExampleData({
		additionalFields,
		url: '',
	});

	const hilightedExampleJson = useHighlightedCode('json', JSON.stringify(exampleData, null, 2));

	const eventField = useId();
	const enabledField = useId();
	const nameField = useId();
	const channelField = useId();
	const triggerWordsField = useId();
	const targetRoomField = useId();
	const urlsField = useId();
	const impersonateUserField = useId();
	const usernameField = useId();
	const aliasField = useId();
	const avatarField = useId();
	const emojiField = useId();
	const tokenField = useId();
	const scriptEnabledField = useId();
	const scriptEngineField = useId();
	const scriptField = useId();
	const retryFailedCallsField = useId();
	const retryCountField = useId();
	const retryDelayField = useId();
	const triggerWordAnywhereField = useId();
	const runOnEditsField = useId();

	return (
		<Box maxWidth='x600' alignSelf='center' w='full'>
			<Accordion>
				<AccordionItem defaultExpanded title={t('Settings')}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={eventField}>{t('Event_Trigger')}</FieldLabel>
							<FieldRow>
								<Controller
									name='event'
									control={control}
									render={({ field }) => (
										<Select id={eventField} {...field} options={eventOptions} aria-description={`${eventField}-hint`} />
									)}
								/>
							</FieldRow>
							<FieldHint id={`${eventField}-hint`}>{t('Event_Trigger_Description')}</FieldHint>
						</Field>
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
						{showChannel && (
							<Field>
								<FieldLabel htmlFor={channelField}>{t('Channel')}</FieldLabel>
								<FieldRow>
									<Controller
										name='channel'
										control={control}
										render={({ field }) => (
											<TextInput
												id={channelField}
												{...field}
												addon={<Icon name='at' size='x20' />}
												aria-describedby={`${channelField}-hint-1 ${channelField}-hint-2 ${channelField}-hint-3`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${channelField}-hint-1`}>{t('Channel_to_listen_on')}</FieldHint>
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
								<FieldHint
									id={`${channelField}-hint-3`}
									dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Integrations_for_all_channels')) }}
								/>
							</Field>
						)}
						{showTriggerWords && (
							<Field>
								<FieldLabel htmlFor={triggerWordsField}>{t('Trigger_Words')}</FieldLabel>
								<FieldRow>
									<Controller
										name='triggerWords'
										control={control}
										render={({ field }) => (
											<TextInput
												id={triggerWordsField}
												{...field}
												aria-describedby={`${triggerWordsField}-hint-1 ${triggerWordsField}-hint-2`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${triggerWordsField}-hint-1`}>
									{t('When_a_line_starts_with_one_of_there_words_post_to_the_URLs_below')}
								</FieldHint>
								<FieldHint id={`${triggerWordsField}-hint-2`}>{t('Separate_multiple_words_with_commas')}</FieldHint>
							</Field>
						)}
						{showTargetRoom && (
							<Field>
								<FieldLabel htmlFor={targetRoomField}>{t('TargetRoom')}</FieldLabel>
								<FieldRow>
									<Controller
										name='targetRoom'
										control={control}
										render={({ field }) => (
											<TextInput id={targetRoomField} {...field} aria-describedby={`${targetRoomField}-hint-1 ${targetRoomField}-hint-2`} />
										)}
									/>
								</FieldRow>
								<FieldHint id={`${targetRoomField}-hint-1`}>{t('TargetRoom_Description')}</FieldHint>
								<FieldHint
									id={`${targetRoomField}-hint-2`}
									dangerouslySetInnerHTML={{
										__html: DOMPurify.sanitize(
											t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', {
												postProcess: 'sprintf',
												sprintf: ['@', '#', '@john', '#general'],
											}),
										),
									}}
								/>
							</Field>
						)}
						<Field>
							<FieldLabel htmlFor={urlsField} required>
								{t('URLs')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='urls'
									control={control}
									rules={{ required: t('Required_field', { field: t('URLs') }) }}
									render={({ field }) => (
										<TextAreaInput
											id={urlsField}
											{...field}
											rows={10}
											addon={<Icon name='permalink' size='x20' />}
											aria-describedby={`${urlsField}-error`}
											aria-required={true}
											aria-invalid={Boolean(errors?.urls)}
										/>
									)}
								/>
							</FieldRow>
							{errors?.urls && (
								<FieldError aria-live='assertive' id={`${urlsField}-error`}>
									{errors?.urls.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={impersonateUserField}>{t('Impersonate_user')}</FieldLabel>
								<Controller
									name='impersonateUser'
									control={control}
									render={({ field: { value, ...field } }) => <ToggleSwitch id={impersonateUserField} {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={usernameField} required>
								{t('Post_as')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='username'
									control={control}
									rules={{ required: t('Required_field', { field: t('Post_as') }) }}
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
									{errors?.username.message}
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
										<TextInput id={aliasField} {...field} addon={<Icon name='edit' size='x20' />} aria-describedby={`${aliasField}-hint`} />
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
											addon={
												<Icon
													name='user-rounded'
													size='x20'
													alignSelf='center'
													aria-describedby={`${avatarField}-hint-1 ${avatarField}-hint-2`}
												/>
											}
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
											addon={
												<Icon name='emoji' size='x20' alignSelf='center' aria-describedby={`${emojiField}-hint-1 ${emojiField}-hint-2`} />
											}
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
							<FieldLabel htmlFor={tokenField} required>
								{t('Token')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='token'
									control={control}
									rules={{ required: t('Required_field', { field: t('Token') }) }}
									render={({ field }) => (
										<TextInput
											id={tokenField}
											{...field}
											addon={<Icon name='key' size='x20' />}
											aria-describedby={`${tokenField}-error`}
											aria-invalid={Boolean(errors?.token)}
											aria-required={true}
										/>
									)}
								/>
							</FieldRow>
							{errors?.token && (
								<FieldError aria-live='assertive' id={`${tokenField}-error`}>
									{errors?.token.message}
								</FieldError>
							)}
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
											{...field}
											options={scriptEngineOptions}
											aria-describedby={`${scriptEngineField}-hint`}
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
										<TextAreaInput id={scriptField} rows={10} {...field} addon={<Icon name='code' size='x20' alignSelf='center' />} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>{t('Responding')}</FieldLabel>
							<FieldHint>{t('Response_description_pre')}</FieldHint>
							<FieldRow>
								<Box fontScale='p2' withRichContent flexGrow={1}>
									<pre>
										<code dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hilightedExampleJson) }}></code>
									</pre>
								</Box>
							</FieldRow>
							<FieldHint>{t('Response_description_post')}</FieldHint>
						</Field>
					</FieldGroup>
				</AccordionItem>
				<AccordionItem title={t('Integration_Advanced_Settings')}>
					<FieldGroup>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={retryFailedCallsField}>{t('Integration_Retry_Failed_Url_Calls')}</FieldLabel>
								<Controller
									name='retryFailedCalls'
									control={control}
									render={({ field: { value, ...field } }) => (
										<ToggleSwitch
											id={retryFailedCallsField}
											{...field}
											checked={value}
											aria-describedby={`${retryFailedCallsField}-hint`}
										/>
									)}
								/>
							</FieldRow>
							<FieldHint id={`${retryFailedCallsField}-hint`}>{t('Integration_Retry_Failed_Url_Calls_Description')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={retryCountField}>{t('Retry_Count')}</FieldLabel>
							<FieldRow>
								<Controller
									name='retryCount'
									control={control}
									render={({ field }) => <TextInput id={retryCountField} {...field} aria-describedby={`${retryCountField}-hint`} />}
								/>
							</FieldRow>
							<FieldHint id={`${retryCountField}-hint`}>{t('Integration_Retry_Count_Description')}</FieldHint>
						</Field>
						<Field>
							<FieldLabel htmlFor={retryDelayField}>{t('Integration_Retry_Delay')}</FieldLabel>
							<FieldRow>
								<Controller
									name='retryDelay'
									control={control}
									render={({ field }) => (
										<Select id={retryDelayField} {...field} options={retryDelayOptions} aria-describedby={`${retryDelayField}-hint`} />
									)}
								/>
							</FieldRow>
							<FieldHint
								id={`${retryDelayField}-hint`}
								dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Integration_Retry_Delay_Description')) }}
							/>
						</Field>
						{event === 'sendMessage' && (
							<FieldGroup>
								<Field>
									<FieldRow>
										<FieldLabel htmlFor={triggerWordAnywhereField}>{t('Integration_Word_Trigger_Placement')}</FieldLabel>
										<Controller
											name='triggerWordAnywhere'
											control={control}
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch
													id={triggerWordAnywhereField}
													{...field}
													checked={value}
													aria-describedby={`${triggerWordAnywhereField}-hint`}
												/>
											)}
										/>
									</FieldRow>
									<FieldHint id={`${triggerWordAnywhereField}-hint`}>{t('Integration_Word_Trigger_Placement_Description')}</FieldHint>
								</Field>
								<Field>
									<FieldRow>
										<FieldLabel htmlFor={runOnEditsField}>{t('Integration_Run_When_Message_Is_Edited')}</FieldLabel>
										<Controller
											name='runOnEdits'
											control={control}
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch id={runOnEditsField} {...field} checked={value} aria-describedby={`${runOnEditsField}-hint`} />
											)}
										/>
									</FieldRow>
									<FieldHint id={`${runOnEditsField}-hint`}>{t('Integration_Run_When_Message_Is_Edited_Description')}</FieldHint>
								</Field>
							</FieldGroup>
						)}
					</FieldGroup>
				</AccordionItem>
			</Accordion>
		</Box>
	);
};

export default OutgoingWebhookForm;
