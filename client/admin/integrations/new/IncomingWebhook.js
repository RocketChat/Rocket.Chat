import React, { useMemo, useState } from 'react';
import { Field, TextInput, Box, Headline, Skeleton, ToggleSwitch, Icon, TextAreaInput, MultiSelectFiltered, Margins, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { isEmail } from '../../../../app/utils/lib/isEmail.js';
// import { useRoute } from '../../../contexts/RouterContext';
import Page from '../../../components/basic/Page';
import MarkdownText from '../../../components/basic/MarkdownText';

export function EditIncomingWebhook({ integrationId, ...props }) {
	const t = useTranslation();
	const { data, state, error } = useEndpointDataExperimental('integrations.get', useMemo(() => ({ integrationId }), [integrationId]));

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
		return <Box mbs='x16' {...props}>{t('User_not_found')}</Box>;
	}

	return <IncomingWebhook data={data.user} {...props}/>;
}

export function IncomingWebhook({ data, setData, ...props }) {
	const t = useTranslation();

	const [newData, setNewData] = useState({});

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]);

	const handleSave = async () => {
		if (hasUnsavedChanges) {
			const result = await saveAction();
			if (result.success) {
				// if (avatarObj) {
				// 	await updateAvatar();
				// }
				// goToUser(data._id);
			}
		}
	};

	const testEqual = (a, b) => a === b || !(a || b);
	const getValue = (e) => e.currentTarget.value;
	const handleChange = (field, currentValue, getNewValue = getValue, areEqual = testEqual) => (e) => setNewData({
		...newData,
		[field]: areEqual(getNewValue(e), currentValue) ? null : getNewValue(e),
	});

	const { integration } = data;
	const enabled = newData.enabled ?? integration.enabled ?? false;
	const channel = newData.channel ?? data.channel ?? '';
	const username = newData.username ?? data.username ?? '';
	const alias = newData.alias ?? data.alias;
	const avatarUrl = newData.avatarUrl ?? data.avatarUrl ?? '';
	const emoji = newData.emoji ?? data.emoji ?? '';
	const scriptEnabled = newData.scriptEnabled ?? data.scriptEnabled ?? false;
	const scriptText = newData.scriptText ?? data.scriptText ?? false;

	return <Page.ScrollableContent pb='x24' mi='neg-x24' is='form' qa-admin-user-edit='form' { ...props }>
		<Margins block='x16'>
			<Field>
				<Field.Label>{t('Enabled')}</Field.Label>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
						<Box mie='x4' textColor={ enabled ? 'default' : 'hint' }>{t('True')}</Box>
						<ToggleSwitch checked={enabled} onChange={handleChange('enabled', false, () => !enabled)} />
						<Box mis='x4' textColor={ enabled ? 'hint' : 'default' }>{t('False')}</Box>
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
			<Field>
				<Field.Label>{t('Post_to_Channel')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={channel} onChange={handleChange('channel', data.channel)} addon={<Icon name='at' size='x20'/>}/>
				</Field.Row>
				<Field.Hint>{t('Messages_that_are_sent_to_the_Incoming_WebHook_will_be_posted_here')}</Field.Hint>
				<Field.Hint><MarkdownText>{t('Start_with_s_for_user_or_s_for_channel_Eg_s_or_s', '@', '#', '@john', '#general')}</MarkdownText></Field.Hint>
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
				<Field.Hint><MarkdownText>{t('Example_s', ':ghost:')}</MarkdownText></Field.Hint>
			</Field>
			<Field>
				<Field.Label>{t('Script_Enabled')}</Field.Label>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center'>
						<Box mie='x4' textColor={ scriptEnabled ? 'default' : 'hint' }>{t('True')}</Box>
						<ToggleSwitch checked={scriptEnabled} onChange={handleChange('scriptEnabled', false, () => !scriptEnabled)} />
						<Box mis='x4' textColor={ scriptEnabled ? 'hint' : 'default' }>{t('False')}</Box>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Script')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows={20} flexGrow={1} value={scriptText} onChange={handleChange('scriptText', data.scriptText)} addon={<Icon name='code' size='x20' alignSelf='center'/>}/>
				</Field.Row>
				<Field.Hint>{t('You_can_use_an_emoji_as_avatar')}</Field.Hint>
				<Field.Hint><MarkdownText>{t('Example_s', ':ghost:')}</MarkdownText></Field.Hint>
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
		</Margins>
	</Page.ScrollableContent>;
}
