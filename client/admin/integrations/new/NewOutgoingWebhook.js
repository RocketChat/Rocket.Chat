import React, { useMemo, useState, useCallback } from 'react';
import {
	Field,
	TextInput,
	Box,
	ToggleSwitch,
	Icon,
	TextAreaInput,
	FieldGroup,
	Margins,
	Button,
	Select,
	Accordion,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useHilightCode } from '../../../hooks/useHilightCode';
import { useRoute } from '../../../contexts/RouterContext';
import { useExampleData } from '../exampleIncomingData';
import { integrations as eventList } from '../../../../app/integrations/lib/rocketchat';
import Page from '../../../components/basic/Page';

const getValue = (e) => (e.currentTarget ? e.currentTarget.value : e);

const capitalize = (s) => {
	if (typeof s !== 'string') { return ''; }
	return s.charAt(0).toUpperCase() + s.slice(1);
};

const useForm = (obj) => {
	const ret = Object.keys(obj).sort().reduce((ret, key) => {
		const value = obj[key];
		const [data, setData] = useState(value);

		ret[key] = data;
		ret[`handle${ capitalize(key) }`] = useCallback(typeof value !== 'boolean' ? (e) => setData(getValue(e)) : () => setData(!data), [data]);

		return ret;
	}, {});
	return ret;
};

const defaultData = {
	type: 'webhook-outgoing',
	enabled: true,
	impersonateUser: false,
	event: 'sendMessage',
	urls: '',
	triggerWords: '',
	targetRoom: '',
	channel: '',
	username: '',
	name: '',
	alias: '',
	avatar: '',
	emoji: '',
	scriptEnabled: false,
	script: '',
	retryFailedCalls: true,
	retryCount: 6,
	retryDelay: 'powers-of-ten',
	triggerWordAnywhere: false,
	runOnEdits: true,
};

export default function NewOutgoingWebhook({ data = defaultData, onChange, setSaveAction, ...props }) {
	const t = useTranslation();

	const { outgoingEvents } = eventList;

	const router = useRoute('admin-integrations');

	const hilightCode = useHilightCode();

	const eventOptions = useMemo(() => Object.entries(outgoingEvents).map(([key, val]) => [key, t(val.label)]), []);

	const retryDelayOptions = useMemo(() => [
		['powers-of-ten', t('powers-of-ten')],
		['powers-of-two', t('powers-of-two')],
		['increments-of-two', t('increments-of-two')],
	], []);

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
		avatar: avatarUrl,
		emoji,
		token,
		scriptEnabled,
		script,
		retryFailedCalls,
		retryCount,
		retryDelay,
		triggerWordAnywhere,
		runOnEdits,
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
	} = useForm({ ...data, token: useUniqueId() });

	const saveIntegration = useEndpointAction('POST', 'integrations.create', useMemo(() => ({
		token,
		enabled,
		impersonateUser,
		event,
		targetRoom,
		channel,
		username,
		name,
		alias,
		avatar: avatarUrl,
		emoji,
		scriptEnabled,
		script,
		retryFailedCalls,
		retryCount,
		retryDelay,
		triggerWordAnywhere,
		runOnEdits,
		urls: urls.split('\n'),
		triggerWords: triggerWords.split(';'),
	}), [token, JSON.stringify({
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
		avatar: avatarUrl,
		emoji,
		scriptEnabled,
		script,
		retryFailedCalls,
		retryCount,
		retryDelay,
		triggerWordAnywhere,
		runOnEdits,
	})]), t('Integration_added'));

	const handleSave = useCallback(async () => {
		const result = await saveIntegration();
		if (result.success) {
			router.push({ id: result.integration._id, context: 'edit', type: 'outgoing' });
		}
	}, [saveIntegration, router]);


	const [exampleData] = useExampleData({
		aditionalFields: {
			...alias && { alias },
			...emoji && { emoji },
			...avatarUrl && { avatar: avatarUrl },
		},
		url: null,
	}, [alias, emoji, avatarUrl]);

	const hilightedExampleJson = hilightCode('json', JSON.stringify(exampleData, null, 2));

	const showChannel = useMemo(() => outgoingEvents[event].use.channel, [event]);
	const showTriggerWords = useMemo(() => outgoingEvents[event].use.triggerWords, [event]);
	const showTargetRoom = useMemo(() => outgoingEvents[event].use.targetRoom, [event]);

	return <Page.ScrollableContent pb='x24' mi='neg-x24' is='form' qa-admin-user-edit='form' { ...props }>
		<Margins block='x16'>
			<Accordion width='x600' alignSelf='center' >
				<FieldGroup>
					{ useMemo(() => <Field>
						<Field.Label>{t('Event_Trigger')}</Field.Label>
						<Field.Row>
							<Select flexGrow={1} value={event} options={eventOptions} onChange={handleEvent}/>
						</Field.Row>
						<Field.Hint>{t('Event_Trigger_Description')}</Field.Hint>
					</Field>, [event]) }
					{ useMemo(() => <Field>
						<Field.Label display='flex' justifyContent='space-between' w='full'>
							{t('Enabled')}
							<ToggleSwitch checked={enabled} onChange={handleEnabled} />
						</Field.Label>
					</Field>, [enabled]) }
					{ useMemo(() => <Field>
						<Field.Label>{t('Name_optional')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={name} onChange={handleName}/>
						</Field.Row>
						<Field.Hint>{t('You_should_name_it_to_easily_manage_your_integrations')}</Field.Hint>
					</Field>, [name])}
					{ useMemo(() => showChannel && <Field>
						<Field.Label>{t('Channel')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={channel} onChange={handleChannel} addon={<Icon name='at' size='x20'/>}/>
						</Field.Row>
						<Field.Hint>{t('Channel_to_listen_on')}</Field.Hint>
						<Field.Hint dangerouslySetInnerHTML={{ __html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general') }} />
						<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integrations_for_all_channels') }} />
					</Field>, [showChannel, channel])}
					{ useMemo(() => showTriggerWords && <Field>
						<Field.Label>{t('Trigger_Words')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={triggerWords} onChange={handleTriggerWords}/>
						</Field.Row>
						<Field.Hint>{t('When_a_line_starts_with_one_of_there_words_post_to_the_URLs_below')}</Field.Hint>
						<Field.Hint>{t('Separate_multiple_words_with_commas')}</Field.Hint>
					</Field>, [triggerWords])}
					{ useMemo(() => showTargetRoom && <Field>
						<Field.Label>{t('TargetRoom')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={targetRoom} onChange={handleTargetRoom}/>
						</Field.Row>
						<Field.Hint>{t('TargetRoom_Description')}</Field.Hint>
						<Field.Hint dangerouslySetInnerHTML={{ __html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general') }} />
					</Field>, [showTargetRoom, targetRoom])}
					{ useMemo(() => <Field>
						<Field.Label>{t('URLs')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={10} flexGrow={1} value={urls} onChange={handleUrls} addon={<Icon name='permalink' size='x20'/>}/>
						</Field.Row>
					</Field>, [urls])}
					{ useMemo(() => <Field>
						<Field.Label display='flex' justifyContent='space-between' w='full'>
							{t('Impersonate_user')}
							<ToggleSwitch checked={impersonateUser} onChange={handleImpersonateUser} />
						</Field.Label>
					</Field>, [impersonateUser])}
					{ useMemo(() => <Field>
						<Field.Label>{t('Post_as')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={username} onChange={handleUsername} addon={<Icon name='user' size='x20'/>}/>
						</Field.Row>
						<Field.Hint>{t('Choose_the_username_that_this_integration_will_post_as')}</Field.Hint>
						<Field.Hint>{t('Should_exists_a_user_with_this_username')}</Field.Hint>
					</Field>, [username])}
					{ useMemo(() => <Field>
						<Field.Label>{`${ t('Alias') } (${ t('optional') })`}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={alias} onChange={handleAlias} addon={<Icon name='edit' size='x20'/>}/>
						</Field.Row>
						<Field.Hint>{t('Choose_the_alias_that_will_appear_before_the_username_in_messages')}</Field.Hint>
					</Field>, [alias])}
					{ useMemo(() => <Field>
						<Field.Label>{`${ t('Avatar_URL') } (${ t('optional') })`}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={avatarUrl} onChange={handleAvatar} addon={<Icon name='user-rounded' size='x20' alignSelf='center'/>}/>
						</Field.Row>
						<Field.Hint>{t('You_can_change_a_different_avatar_too')}</Field.Hint>
						<Field.Hint>{t('Should_be_a_URL_of_an_image')}</Field.Hint>
					</Field>, [avatarUrl])}
					{ useMemo(() => <Field>
						<Field.Label>{`${ t('Emoji') } (${ t('optional') })`}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={emoji} onChange={handleEmoji} addon={<Icon name='emoji' size='x20' alignSelf='center'/>}/>
						</Field.Row>
						<Field.Hint>{t('You_can_use_an_emoji_as_avatar')}</Field.Hint>
						<Field.Hint dangerouslySetInnerHTML={{ __html: t('Example_s', ':ghost:') }} />
					</Field>, [emoji])}
					{ useMemo(() => <Field>
						<Field.Label>{`${ t('Token') } (${ t('Optional') })`}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={token} onChange={handleToken} addon={<Icon name='key' size='x20'/>}/>
						</Field.Row>
					</Field>, [token])}
					{ useMemo(() => <Field>
						<Field.Label display='flex' justifyContent='space-between' w='full'>
							{t('Script_Enabled')}
							<ToggleSwitch checked={scriptEnabled} onChange={handleScriptEnabled} />
						</Field.Label>
					</Field>, [scriptEnabled])}
					{ useMemo(() => <Field>
						<Field.Label>{t('Script')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={10} flexGrow={1} value={script} onChange={handleScript} addon={<Icon name='code' size='x20' alignSelf='center'/>}/>
						</Field.Row>
					</Field>, [script])}
					{ useMemo(() => <Field>
						<Field.Label>{t('Responding')}</Field.Label>
						<Field.Hint>{t('Response_description_pre')}</Field.Hint>
						<Field.Row>
							<Box fontScale='p1' withRichContent flexGrow={1}>
								<pre><code dangerouslySetInnerHTML={{ __html: hilightedExampleJson }}></code></pre>
							</Box>
						</Field.Row>
						<Field.Hint>{t('Response_description_post')}</Field.Hint>
					</Field>, [hilightedExampleJson])}
				</FieldGroup>
				<Accordion.Item title={t('Advanced_Settings')}>
					<FieldGroup>
						{ useMemo(() => <Field>
							<Field.Label display='flex' justifyContent='space-between' w='full'>
								{t('Integration_Retry_Failed_Url_Calls')}
								<ToggleSwitch checked={retryFailedCalls} onChange={handleRetryFailedCalls} />
							</Field.Label>
							<Field.Hint>{t('Integration_Retry_Failed_Url_Calls_Description')}</Field.Hint>
						</Field>, [retryFailedCalls])}
						{ useMemo(() => <Field>
							<Field.Label>{t('Retry_Count')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={retryCount} onChange={handleRetryCount}/>
							</Field.Row>
							<Field.Hint>{t('Integration_Retry_Count_Description')}</Field.Hint>
						</Field>, [retryCount])}
						{ useMemo(() => <Field>
							<Field.Label>{t('Integration_Retry_Delay')}</Field.Label>
							<Field.Row>
								<Select flexGrow={1} value={retryDelay} options={retryDelayOptions} onChange={handleRetryDelay}/>
							</Field.Row>
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integration_Retry_Delay_Description') }}/>
						</Field>, [retryDelay])}
						{ useMemo(() => event === 'sendMessage' && <FieldGroup>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Integration_Word_Trigger_Placement')}
									<ToggleSwitch checked={triggerWordAnywhere} onChange={handleTriggerWordAnywhere} />
								</Field.Label>
								<Field.Hint>{t('Integration_Word_Trigger_Placement_Description')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label display='flex' justifyContent='space-between' w='full'>
									{t('Integration_Word_Trigger_Placement')}
									<ToggleSwitch checked={runOnEdits} onChange={handleRunOnEdits} />
								</Field.Label>
								<Field.Hint>{t('Integration_Run_When_Message_Is_Edited_Description')}</Field.Hint>
							</Field>
						</FieldGroup>, [triggerWordAnywhere, runOnEdits])}
					</FieldGroup>
				</Accordion.Item>
				<Field>
					<Field.Row>
						<Button w='full' mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
					</Field.Row>
				</Field>
			</Accordion>
		</Margins>
	</Page.ScrollableContent>;
}
