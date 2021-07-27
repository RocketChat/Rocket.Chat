import {
	Button,
	ButtonGroup,
	TextInput,
	Field,
	TextAreaInput,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';
import React, { useCallback, useState } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export default function OAuthAddApp(props) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({
		name: '',
		active: false,
		redirectUri: '',
	});

	const saveApp = useMethod('addOAuthApp');

	const router = useRoute('admin-oauth-apps');

	const close = useCallback(() => router.push({}), [router]);

	const handleSave = useCallback(async () => {
		try {
			await saveApp(newData);
			close();
			dispatchToastMessage({ type: 'success', message: t('Application_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, dispatchToastMessage, newData, saveApp, t]);

	const handleChange =
		(field, getValue = (e) => e.currentTarget.value) =>
		(e) =>
			setNewData({ ...newData, [field]: getValue(e) });

	const { active, name, redirectUri } = newData;

	return (
		<VerticalBar.ScrollableContent w='full' {...props}>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Active')}
						<ToggleSwitch checked={active} onChange={handleChange('active', () => !active)} />
					</Field.Label>
				</Field>
				<Field>
					<Field.Label>{t('Application_Name')}</Field.Label>
					<Field.Row>
						<TextInput value={name} onChange={handleChange('name')} />
					</Field.Row>
					<Field.Hint>
						{t('Give_the_application_a_name_This_will_be_seen_by_your_users')}
					</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Redirect_URI')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={5} value={redirectUri} onChange={handleChange('redirectUri')} />
					</Field.Row>
					<Field.Hint>
						{t('After_OAuth2_authentication_users_will_be_redirected_to_this_URL')}
					</Field.Hint>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSave}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	);
}
