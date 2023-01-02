import { Field, TextInput, Box, ToggleSwitch, Icon, TextAreaInput, FieldGroup, Margins, Select, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

import { outgoingEvents } from '../../../../app/integrations/lib/outgoingEvents';
import Page from '../../../components/Page';
import { useHighlightedCode } from '../../../hooks/useHighlightedCode';
import { useExampleData } from './useExampleIncomingData';

export default function OutgoingWebhookForm({ formValues, formHandlers, append, ...props }) {
	const t = useTranslation();

	const {
		enabled,
		impersonateUser,
		event,
		urls,
		triggerWords,
		targetRoom,
		channel,
		username,
		name,
		alias,
		avatar,
		emoji,
		token,
		scriptEnabled,
		script,
		retryFailedCalls,
		retryCount,
		retryDelay,
		triggerWordAnywhere,
		runOnEdits,
	} = formValues;

	const {
		handleEvent,
		handleEnabled,
		handleName,
		handleChannel,
		handleTriggerWords,
		handleTargetRoom,
		handleUrls,
		handleImpersonateUser,
		handleUsername,
		handleAlias,
		handleAvatar,
		handleEmoji,
		handleToken,
		handleScriptEnabled,
		handleScript,
		handleRetryFailedCalls,
		handleRetryCount,
		handleRetryDelay,
		handleTriggerWordAnywhere,
		handleRunOnEdits,
	} = formHandlers;

	const retryDelayOptions = useMemo(
		() => [
			['powers-of-ten', t('powers-of-ten')],
			['powers-of-two', t('powers-of-two')],
			['increments-of-two', t('increments-of-two')],
		],
		[t],
	);

	const eventOptions = useMemo(() => Object.entries(outgoingEvents).map(([key, val]) => [key, t(val.label)]), [t]);

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
		url: null,
	});

	const hilightedExampleJson = useHighlightedCode('json', JSON.stringify(exampleData, null, 2));

	return (
		<Page.ScrollableContentWithShadow
			pb='x24'
			mi='neg-x24'
			is='form'
			onSubmit={useCallback((e) => e.preventDefault(), [])}
			qa-admin-user-edit='form'
			{...props}
		>
			<Margins block='x16'>
				<Accordion width='x600' alignSelf='center'>
					<FieldGroup>
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('Event_Trigger')}</Field.Label>
									<Field.Row>
										<Select flexGrow={1} value={event} options={eventOptions} onChange={handleEvent} />
									</Field.Row>
									<Field.Hint>{t('Event_Trigger_Description')}</Field.Hint>
								</Field>
							),
							[event, eventOptions, handleEvent, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label display='flex' justifyContent='space-between' w='full'>
										{t('Enabled')}
										<ToggleSwitch checked={enabled} onChange={handleEnabled} />
									</Field.Label>
								</Field>
							),
							[enabled, handleEnabled, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('Name_optional')}</Field.Label>
									<Field.Row>
										<TextInput flexGrow={1} value={name} onChange={handleName} />
									</Field.Row>
									<Field.Hint>{t('You_should_name_it_to_easily_manage_your_integrations')}</Field.Hint>
								</Field>
							),
							[handleName, name, t],
						)}
						{useMemo(
							() =>
								showChannel && (
									<Field>
										<Field.Label>{t('Channel')}</Field.Label>
										<Field.Row>
											<TextInput flexGrow={1} value={channel} onChange={handleChannel} addon={<Icon name='at' size='x20' />} />
										</Field.Row>
										<Field.Hint>{t('Channel_to_listen_on')}</Field.Hint>
										<Field.Hint
											dangerouslySetInnerHTML={{
												__html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general'),
											}}
										/>
										<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integrations_for_all_channels') }} />
									</Field>
								),
							[showChannel, t, channel, handleChannel],
						)}
						{useMemo(
							() =>
								showTriggerWords && (
									<Field>
										<Field.Label>{t('Trigger_Words')}</Field.Label>
										<Field.Row>
											<TextInput flexGrow={1} value={triggerWords} onChange={handleTriggerWords} />
										</Field.Row>
										<Field.Hint>{t('When_a_line_starts_with_one_of_there_words_post_to_the_URLs_below')}</Field.Hint>
										<Field.Hint>{t('Separate_multiple_words_with_commas')}</Field.Hint>
									</Field>
								),
							[handleTriggerWords, showTriggerWords, t, triggerWords],
						)}
						{useMemo(
							() =>
								showTargetRoom && (
									<Field>
										<Field.Label>{t('TargetRoom')}</Field.Label>
										<Field.Row>
											<TextInput flexGrow={1} value={targetRoom} onChange={handleTargetRoom} />
										</Field.Row>
										<Field.Hint>{t('TargetRoom_Description')}</Field.Hint>
										<Field.Hint
											dangerouslySetInnerHTML={{
												__html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general'),
											}}
										/>
									</Field>
								),
							[handleTargetRoom, showTargetRoom, t, targetRoom],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('URLs')}</Field.Label>
									<Field.Row>
										<TextAreaInput rows={10} flexGrow={1} value={urls} onChange={handleUrls} addon={<Icon name='permalink' size='x20' />} />
									</Field.Row>
								</Field>
							),
							[handleUrls, t, urls],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label display='flex' justifyContent='space-between' w='full'>
										{t('Impersonate_user')}
										<ToggleSwitch checked={impersonateUser} onChange={handleImpersonateUser} />
									</Field.Label>
								</Field>
							),
							[handleImpersonateUser, impersonateUser, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('Post_as')}</Field.Label>
									<Field.Row>
										<TextInput flexGrow={1} value={username} onChange={handleUsername} addon={<Icon name='user' size='x20' />} />
									</Field.Row>
									<Field.Hint>{t('Choose_the_username_that_this_integration_will_post_as')}</Field.Hint>
									<Field.Hint>{t('Should_exists_a_user_with_this_username')}</Field.Hint>
								</Field>
							),
							[handleUsername, t, username],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{`${t('Alias')} (${t('optional')})`}</Field.Label>
									<Field.Row>
										<TextInput flexGrow={1} value={alias} onChange={handleAlias} addon={<Icon name='edit' size='x20' />} />
									</Field.Row>
									<Field.Hint>{t('Choose_the_alias_that_will_appear_before_the_username_in_messages')}</Field.Hint>
								</Field>
							),
							[alias, handleAlias, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{`${t('Avatar_URL')} (${t('optional')})`}</Field.Label>
									<Field.Row>
										<TextInput
											flexGrow={1}
											value={avatar}
											onChange={handleAvatar}
											addon={<Icon name='user-rounded' size='x20' alignSelf='center' />}
										/>
									</Field.Row>
									<Field.Hint>{t('You_can_change_a_different_avatar_too')}</Field.Hint>
									<Field.Hint>{t('Should_be_a_URL_of_an_image')}</Field.Hint>
								</Field>
							),
							[avatar, handleAvatar, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{`${t('Emoji')} (${t('optional')})`}</Field.Label>
									<Field.Row>
										<TextInput
											flexGrow={1}
											value={emoji}
											onChange={handleEmoji}
											addon={<Icon name='emoji' size='x20' alignSelf='center' />}
										/>
									</Field.Row>
									<Field.Hint>{t('You_can_use_an_emoji_as_avatar')}</Field.Hint>
									<Field.Hint dangerouslySetInnerHTML={{ __html: t('Example_s', ':ghost:') }} />
								</Field>
							),
							[emoji, handleEmoji, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{`${t('Token')} (${t('Optional')})`}</Field.Label>
									<Field.Row>
										<TextInput flexGrow={1} value={token} onChange={handleToken} addon={<Icon name='key' size='x20' />} />
									</Field.Row>
								</Field>
							),
							[handleToken, t, token],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label display='flex' justifyContent='space-between' w='full'>
										{t('Script_Enabled')}
										<ToggleSwitch checked={scriptEnabled} onChange={handleScriptEnabled} />
									</Field.Label>
								</Field>
							),
							[handleScriptEnabled, scriptEnabled, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('Script')}</Field.Label>
									<Field.Row>
										<TextAreaInput
											rows={10}
											flexGrow={1}
											value={script}
											onChange={handleScript}
											addon={<Icon name='code' size='x20' alignSelf='center' />}
										/>
									</Field.Row>
								</Field>
							),
							[handleScript, script, t],
						)}
						{useMemo(
							() => (
								<Field>
									<Field.Label>{t('Responding')}</Field.Label>
									<Field.Hint>{t('Response_description_pre')}</Field.Hint>
									<Field.Row>
										<Box fontScale='p2' withRichContent flexGrow={1}>
											<pre>
												<code dangerouslySetInnerHTML={{ __html: hilightedExampleJson }}></code>
											</pre>
										</Box>
									</Field.Row>
									<Field.Hint>{t('Response_description_post')}</Field.Hint>
								</Field>
							),
							[hilightedExampleJson, t],
						)}
					</FieldGroup>
					<Accordion.Item title={t('Integration_Advanced_Settings')}>
						<FieldGroup>
							{useMemo(
								() => (
									<Field>
										<Field.Label display='flex' justifyContent='space-between' w='full'>
											{t('Integration_Retry_Failed_Url_Calls')}
											<ToggleSwitch checked={retryFailedCalls} onChange={handleRetryFailedCalls} />
										</Field.Label>
										<Field.Hint>{t('Integration_Retry_Failed_Url_Calls_Description')}</Field.Hint>
									</Field>
								),
								[handleRetryFailedCalls, retryFailedCalls, t],
							)}
							{useMemo(
								() => (
									<Field>
										<Field.Label>{t('Retry_Count')}</Field.Label>
										<Field.Row>
											<TextInput flexGrow={1} value={retryCount} onChange={handleRetryCount} />
										</Field.Row>
										<Field.Hint>{t('Integration_Retry_Count_Description')}</Field.Hint>
									</Field>
								),
								[handleRetryCount, retryCount, t],
							)}
							{useMemo(
								() => (
									<Field>
										<Field.Label>{t('Integration_Retry_Delay')}</Field.Label>
										<Field.Row>
											<Select flexGrow={1} value={retryDelay} options={retryDelayOptions} onChange={handleRetryDelay} />
										</Field.Row>
										<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integration_Retry_Delay_Description') }} />
									</Field>
								),
								[handleRetryDelay, retryDelay, retryDelayOptions, t],
							)}
							{useMemo(
								() =>
									event === 'sendMessage' && (
										<FieldGroup>
											<Field>
												<Field.Label display='flex' justifyContent='space-between' w='full'>
													{t('Integration_Word_Trigger_Placement')}
													<ToggleSwitch checked={triggerWordAnywhere} onChange={handleTriggerWordAnywhere} />
												</Field.Label>
												<Field.Hint>{t('Integration_Word_Trigger_Placement_Description')}</Field.Hint>
											</Field>
											<Field>
												<Field.Label display='flex' justifyContent='space-between' w='full'>
													{t('Integration_Run_When_Message_Is_Edited')}
													<ToggleSwitch checked={runOnEdits} onChange={handleRunOnEdits} />
												</Field.Label>
												<Field.Hint>{t('Integration_Run_When_Message_Is_Edited_Description')}</Field.Hint>
											</Field>
										</FieldGroup>
									),
								[event, t, triggerWordAnywhere, handleTriggerWordAnywhere, runOnEdits, handleRunOnEdits],
							)}
						</FieldGroup>
					</Accordion.Item>
					{append}
				</Accordion>
			</Margins>
		</Page.ScrollableContentWithShadow>
	);
}
