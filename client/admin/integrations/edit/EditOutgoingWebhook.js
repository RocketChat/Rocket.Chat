import React, { useMemo, useState, useCallback } from 'react';
import {
	Field,
	TextInput,
	Box,
	Headline,
	Skeleton,
	ToggleSwitch,
	Icon,
	TextAreaInput,
	FieldGroup,
	Margins,
	Button,
	Select,
	Accordion,
} from '@rocket.chat/fuselage';

import { SuccessModal, DeleteWarningModal } from './EditIntegrationsPage';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useHilightCode } from '../../../hooks/useHilightCode';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useExampleData } from '../exampleIncomingData';
import { integrations as eventList } from '../../../../app/integrations/lib/rocketchat';
import Page from '../../../components/basic/Page';

export default function EditOutgoingWebhookWithData({ integrationId, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();

	const { data, state, error } = useEndpointDataExperimental('integrations.get', useMemo(() => ({ integrationId }), [integrationId, cache]));

	const onChange = () => setCache(new Date());

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16' {...props}>{t('Oops_page_not_found')}</Box>;
	}

	return <EditOutgoingWebhook data={data.integration} onChange={onChange} {...props}/>;
}

const getInitialValue = (data) => {
	const initialValue = {
		enabled: data.enabled ?? true,
		impersonateUser: data.impersonateUser,
		event: data.event,
		token: data.token,
		urls: data.urls.join('\n') ?? '',
		triggerWords: data.triggerWords.join('; ') ?? '',
		targetRoom: data.targetRoom ?? '',
		channel: data.channel.join(', ') ?? '',
		username: data.username ?? '',
		name: data.name ?? '',
		alias: data.alias ?? '',
		avatarUrl: data.avatarUrl ?? '',
		emoji: data.emoji ?? '',
		scriptEnabled: data.scriptEnabled ?? false,
		script: data.script ?? '',
		retryFailedCalls: data.retryFailedCalls ?? true,
		retryCount: data.retryCount ?? 5,
		retryDelay: data.retryDelay ?? 'power-of-ten',
		triggerrWordAnywhere: data.triggerrWordAnywhere ?? false,
		runOnEdits: data.runOnEdits ?? true,
	};
	return initialValue;
};

function EditOutgoingWebhook({ data, onChange, setSaveAction, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState(getInitialValue(data));
	const [modal, setModal] = useState();

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]);

	const saveIntegration = useMethod('updateOutgoingIntegration');

	const router = useRoute('admin-integrations');

	const hilightCode = useHilightCode();

	const deleteQuery = useMemo(() => ({ type: 'webhook-outgoing', integrationId: data._id }), [data._id]);
	const deleteIntegration = useEndpointAction('POST', 'integrations.remove', deleteQuery);

	const handleDeleteIntegration = () => {
		const closeModal = () => setModal();
		const onDelete = async () => {
			const result = await deleteIntegration();
			if (result.success) { setModal(<SuccessModal onClose={() => { closeModal(); router.push({}); }}/>); }
		};

		setModal(<DeleteWarningModal onDelete={onDelete} onCancel={closeModal} />);
	};

	const { outgoingEvents } = eventList;

	const eventOptions = useMemo(
		() => Object.entries(outgoingEvents).map(([key, val]) => [key, t(val.label)]),
		[],
	);

	const retryDelayOptions = [
		['powers-of-ten', t('powers-of-ten')],
		['powers-of-two', t('powers-of-two')],
		['increments-of-two', t('increments-of-two')],
	];

	const handleSave = async () => {
		try {
			await saveIntegration(data._id, {
				...newData,
				triggerWords: newData.triggerWords.split(';'),
				urls: newData.urls.split('\n'),
			});

			dispatchToastMessage({ type: 'success', message: t('Integration_updated') });
			onChange();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const testEqual = (a, b) => a === b || !(a || b);
	const getValue = (e) => e.currentTarget.value;
	const handleChange = (field, currentValue, getNewValue = getValue, areEqual = testEqual) => (e) => setNewData({
		...newData,
		[field]: areEqual(getNewValue(e), currentValue) ? null : getNewValue(e),
	});

	const boolTextColor = useCallback((isEnabled) => (isEnabled ? 'default' : 'hint'));

	const {
		enabled,
		impersonateUser,
		event,
		token,
		urls,
		triggerWords,
		targetRoom,
		channel,
		username,
		name,
		alias,
		avatarUrl,
		emoji,
		scriptEnabled,
		script,
		retryFailedCalls,
		retryCount,
		retryDelay,
		triggerrWordAnywhere,
		runOnEdits,
	} = newData;

	const [exampleData] = useExampleData({
		aditionalFields: {
			...alias && { alias },
			...emoji && { emoji },
			...avatarUrl && { avatar: avatarUrl },
		},
		url: null,
	});

	const hilightedExampleJson = hilightCode('json', JSON.stringify(exampleData, null, 2));

	const showChannel = useMemo(() => outgoingEvents[event].use.channel, [event]);
	const showTriggerWords = useMemo(() => outgoingEvents[event].use.triggerWords, [event]);
	const showTargetRoom = useMemo(() => outgoingEvents[event].use.targetRoom, [event]);

	return <>
		<Page.ScrollableContent pb='x24' mi='neg-x24' is='form' qa-admin-user-edit='form' { ...props }>
			<Margins block='x16'>
				<Accordion width='x600' alignSelf='center'>
					<Accordion.Item title={t('Webhook_Details')} defaultExpanded>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Event_Trigger')}</Field.Label>
								<Field.Row>
									<Select flexGrow={1} value={event} options={eventOptions} onChange={handleChange('event', data.event, (event) => event)}/>
								</Field.Row>
								<Field.Hint>{t('Event_Trigger_Description')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{t('Enabled')}</Field.Label>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
										<Box mie='x8' color={ boolTextColor(!enabled) }>{t('False')}</Box>
										<ToggleSwitch checked={enabled} onChange={handleChange('enabled', data.enabled, () => !enabled)} />
										<Box mis='x8' color={ boolTextColor(enabled) }>{t('True')}</Box>
									</Box>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Name_optional')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={name} onChange={handleChange('name', data.name)}/>
								</Field.Row>
								<Field.Hint>{t('You_should_name_it_to_easily_manage_your_integrations')}</Field.Hint>
							</Field>
							{showChannel && <Field>
								<Field.Label>{t('Channel')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={channel} onChange={handleChange('channel', data.channel.join(', '))} addon={<Icon name='at' size='x20'/>}/>
								</Field.Row>
								<Field.Hint>{t('Channel_to_listen_on')}</Field.Hint>
								<Field.Hint dangerouslySetInnerHTML={{ __html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general') }} />
								<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integrations_for_all_channels') }} />
							</Field>}
							{showTriggerWords && <Field>
								<Field.Label>{t('Trigger_Words')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={triggerWords} onChange={handleChange('triggerWords', data.triggerWords.join('; '))}/>
								</Field.Row>
								<Field.Hint>{t('When_a_line_starts_with_one_of_there_words_post_to_the_URLs_below')}</Field.Hint>
								<Field.Hint>{t('Separate_multiple_words_with_commas')}</Field.Hint>
							</Field>}
							{showTargetRoom && <Field>
								<Field.Label>{t('TargetRoom')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={targetRoom} onChange={handleChange('targetRoom', data.targetRoom)}/>
								</Field.Row>
								<Field.Hint>{t('TargetRoom_Description')}</Field.Hint>
								<Field.Hint dangerouslySetInnerHTML={{ __html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general') }} />
							</Field>}
							<Field>
								<Field.Label>{t('URLs')}</Field.Label>
								<Field.Row>
									<TextAreaInput rows={10} flexGrow={1} value={urls} onChange={handleChange('urls', data.urls)} addon={<Icon name='permalink' size='x20'/>}/>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Impersonate_user')}</Field.Label>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
										<Box mie='x8' color={ boolTextColor(!impersonateUser) }>{t('False')}</Box>
										<ToggleSwitch checked={impersonateUser} onChange={handleChange('impersonateUser', data.impersonateUser, () => !impersonateUser)} />
										<Box mis='x8' color={ boolTextColor(impersonateUser) }>{t('True')}</Box>
									</Box>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Post_as')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={username} onChange={handleChange('username', data.username)} addon={<Icon name='user' size='x20'/>}/>
								</Field.Row>
								<Field.Hint>{t('Choose_the_username_that_this_integration_will_post_as')}</Field.Hint>
								<Field.Hint>{t('Should_exists_a_user_with_this_username')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{`${ t('Alias') } (${ t('optional') })`}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={alias} onChange={handleChange('alias', data.alias)} addon={<Icon name='edit' size='x20'/>}/>
								</Field.Row>
								<Field.Hint>{t('Choose_the_alias_that_will_appear_before_the_username_in_messages')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{`${ t('Avatar_URL') } (${ t('optional') })`}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={avatarUrl} onChange={handleChange('avatarUrl', data.avatarUrl)} addon={<Icon name='user-rounded' size='x20' alignSelf='center'/>}/>
								</Field.Row>
								<Field.Hint>{t('You_can_change_a_different_avatar_too')}</Field.Hint>
								<Field.Hint>{t('Should_be_a_URL_of_an_image')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{`${ t('Emoji') } (${ t('optional') })`}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={emoji} onChange={handleChange('emoji', data.emoji)} addon={<Icon name='emoji' size='x20' alignSelf='center'/>}/>
								</Field.Row>
								<Field.Hint>{t('You_can_use_an_emoji_as_avatar')}</Field.Hint>
								<Field.Hint dangerouslySetInnerHTML={{ __html: t('Example_s', ':ghost:') }} />
							</Field>
							<Field>
								<Field.Label>{`${ t('Token') } (${ t('Optional') })`}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={token} onChange={handleChange('token', data.token)} addon={<Icon name='key' size='x20'/>}/>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Script_Enabled')}</Field.Label>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
										<Box mie='x8' color={ boolTextColor(!scriptEnabled) }>{t('False')}</Box>
										<ToggleSwitch checked={scriptEnabled} onChange={handleChange('scriptEnabled', data.scriptEnabled, () => !scriptEnabled)} />
										<Box mis='x8' color={ boolTextColor(scriptEnabled) }>{t('True')}</Box>
									</Box>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Script')}</Field.Label>
								<Field.Row>
									<TextAreaInput rows={10} flexGrow={1} value={script} onChange={handleChange('script', data.script)} addon={<Icon name='code' size='x20' alignSelf='center'/>}/>
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Responding')}</Field.Label>
								<Field.Hint>{t('Response_description_pre')}</Field.Hint>
								<Field.Row>
									<Box fontScale='p1' withRichContent flexGrow={1}>
										<pre><code dangerouslySetInnerHTML={{ __html: hilightedExampleJson }}></code></pre>
									</Box>
								</Field.Row>
								<Field.Hint>{t('Response_description_post')}</Field.Hint>
							</Field>
						</FieldGroup>
					</Accordion.Item>
					<Accordion.Item title={t('Advanced_Settings')}>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Integration_Retry_Failed_Url_Calls')}</Field.Label>
								<Field.Row>
									<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
										<Box mie='x8' color={ boolTextColor(!retryFailedCalls) }>{t('False')}</Box>
										<ToggleSwitch checked={retryFailedCalls} onChange={handleChange('retryFailedCalls', data.retryFailedCalls, () => !retryFailedCalls)} />
										<Box mis='x8' color={ boolTextColor(retryFailedCalls) }>{t('True')}</Box>
									</Box>
								</Field.Row>
								<Field.Hint>{t('Integration_Retry_Failed_Url_Calls_Description')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{t('Retry_Count')}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} value={retryCount} onChange={handleChange('retryCount', data.retryCount)}/>
								</Field.Row>
								<Field.Hint>{t('Integration_Retry_Count_Description')}</Field.Hint>
							</Field>
							<Field>
								<Field.Label>{t('Integration_Retry_Delay')}</Field.Label>
								<Field.Row>
									<Select flexGrow={1} value={retryDelay} options={retryDelayOptions} onChange={handleChange('retryDelay', data.retryDelay, (event) => event)}/>
								</Field.Row>
								<Field.Hint dangerouslySetInnerHTML={{ __html: t('Integration_Retry_Delay_Description') }}/>
							</Field>
							{event === 'sendMessage' && <FieldGroup>
								<Field>
									<Field.Label>{t('Integration_Word_Trigger_Placement')}</Field.Label>
									<Field.Row>
										<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
											<Box mie='x8' color={ boolTextColor(!triggerrWordAnywhere) }>{t('False')}</Box>
											<ToggleSwitch checked={triggerrWordAnywhere} onChange={handleChange('triggerrWordAnywhere', data.triggerrWordAnywhere, () => !triggerrWordAnywhere)} />
											<Box mis='x8' color={ boolTextColor(triggerrWordAnywhere) }>{t('True')}</Box>
										</Box>
									</Field.Row>
									<Field.Hint>{t('Integration_Word_Trigger_Placement_Description')}</Field.Hint>
								</Field>
								<Field>
									<Field.Label>{t('Integration_Word_Trigger_Placement')}</Field.Label>
									<Field.Row>
										<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
											<Box mie='x8' color={ boolTextColor(!runOnEdits) }>{t('False')}</Box>
											<ToggleSwitch checked={runOnEdits} onChange={handleChange('runOnEdits', data.runOnEdits, () => !runOnEdits)} />
											<Box mis='x8' color={ boolTextColor(runOnEdits) }>{t('True')}</Box>
										</Box>
									</Field.Row>
									<Field.Hint>{t('Integration_Run_When_Message_Is_Edited_Description')}</Field.Hint>
								</Field>
							</FieldGroup>}
						</FieldGroup>
					</Accordion.Item>
					<Field>
						<Field.Row display='flex' flexDirection='column'>
							<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
								<Margins inlineEnd='x4'>
									<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={() => setNewData(getInitialValue(data))}>{t('Reset')}</Button>
									<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
								</Margins>
							</Box>
							<Button mbs='x4' primary danger w='full' onClick={handleDeleteIntegration}>{t('Delete')}</Button>
						</Field.Row>
					</Field>
				</Accordion>
			</Margins>
		</Page.ScrollableContent>
		{ modal }
	</>;
}
