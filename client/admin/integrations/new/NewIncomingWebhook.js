import React, { useMemo, useState } from 'react';
import { Field, TextInput, Box, ToggleSwitch, Icon, TextAreaInput, FieldGroup, Margins, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import Page from '../../../components/basic/Page';

const initialState = {
	enabled: false,
	channel: '',
	username: '',
	name: '',
	alias: '',
	avatarUrl: '',
	emoji: '',
	scriptEnabled: false,
	script: '',
};

export default function NewIncomingWebhook({ data, setData, ...props }) {
	const t = useTranslation();

	const [newData, setNewData] = useState(initialState);

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => !current).length < Object.keys(newData).length, [JSON.stringify(newData)]);

	const saveAction = useEndpointAction('POST', 'integrations.create', useMemo(() => ({ ...newData, type: 'webhook-incoming' }), [JSON.stringify(newData)]), t('Integration_added'));

	const handleSave = async () => {
		try {
			await saveAction();
			setNewData(initialState);
		} catch (e) {
			console.log(e);
		}
	};

	const getValue = (e) => e.currentTarget.value;
	const handleChange = (field, getNewValue = getValue) => (e) => setNewData({
		...newData,
		[field]: getNewValue(e),
	});

	const {
		enabled,
		channel,
		username,
		name,
		alias,
		avatarUrl,
		emoji,
		scriptEnabled,
		script,
	} = newData;

	return <Page.ScrollableContent pb='x24' mi='neg-x24' is='form' qa-admin-user-edit='form' { ...props }>
		<Margins block='x16'>
			<FieldGroup width='x600' alignSelf='center'>
				<Field>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
							<Box mie='x8' color={ enabled ? 'hint' : 'default' }>{t('False')}</Box>
							<ToggleSwitch checked={enabled} onChange={handleChange('enabled', () => !enabled)} />
							<Box mis='x8' color={ enabled ? 'default' : 'hint' }>{t('True')}</Box>
						</Box>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Name_optional')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
					</Field.Row>
					<Field.Hint>{t('You_should_name_it_to_easily_manage_your_integrations')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Post_to_Channel')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={channel} onChange={handleChange('channel')} addon={<Icon name='at' size='x20'/>}/>
					</Field.Row>
					<Field.Hint>{t('Messages_that_are_sent_to_the_Incoming_WebHook_will_be_posted_here')}</Field.Hint>
					<Field.Hint dangerouslySetInnerHTML={{ __html: t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general') }} />
				</Field>
				<Field>
					<Field.Label>{t('Post_as')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={username} onChange={handleChange('username')} addon={<Icon name='user' size='x20'/>}/>
					</Field.Row>
					<Field.Hint>{t('Choose_the_username_that_this_integration_will_post_as')}</Field.Hint>
					<Field.Hint>{t('Should_exists_a_user_with_this_username')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{`${ t('Alias') } (${ t('optional') })`}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={alias} onChange={handleChange('alias')} addon={<Icon name='edit' size='x20'/>}/>
					</Field.Row>
					<Field.Hint>{t('Choose_the_alias_that_will_appear_before_the_username_in_messages')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{`${ t('Avatar_URL') } (${ t('optional') })`}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={avatarUrl} onChange={handleChange('avatarUrl')} addon={<Icon name='user-rounded' size='x20' alignSelf='center'/>}/>
					</Field.Row>
					<Field.Hint>{t('You_can_change_a_different_avatar_too')}</Field.Hint>
					<Field.Hint>{t('Should_be_a_URL_of_an_image')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{`${ t('Emoji') } (${ t('optional') })`}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={emoji} onChange={handleChange('emoji')} addon={<Icon name='emoji' size='x20' alignSelf='center'/>}/>
					</Field.Row>
					<Field.Hint>{t('You_can_use_an_emoji_as_avatar')}</Field.Hint>
					<Field.Hint dangerouslySetInnerHTML={{ __html: t('Example_s', ':ghost:') }} />
				</Field>
				<Field>
					<Field.Label>{t('Script_Enabled')}</Field.Label>
					<Field.Row>
						<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
							<Box mie='x8' color={ scriptEnabled ? 'hint' : 'default' }>{t('False')}</Box>
							<ToggleSwitch checked={scriptEnabled} onChange={handleChange('scriptEnabled', () => !scriptEnabled)} />
							<Box mis='x8' color={ scriptEnabled ? 'default' : 'hint' }>{t('True')}</Box>
						</Box>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Script')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={20} flexGrow={1} value={script} onChange={handleChange('script')} addon={<Icon name='code' size='x20' alignSelf='center'/>}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
							<Margins inlineEnd='x4'>
								<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={() => setNewData({})}>{t('Reset')}</Button>
								<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
							</Margins>
						</Box>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Margins>
	</Page.ScrollableContent>;
}
