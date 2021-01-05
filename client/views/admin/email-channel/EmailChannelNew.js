import React, { useCallback, useState } from 'react';
import {
	Accordion,
	Button,
	ButtonGroup,
	TextInput,
	TextAreaInput,
	Field,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';

import DepartmentAutoComplete from '../../omnichannel/DepartmentAutoComplete';
import { useTranslation } from '../../../contexts/TranslationContext';
// import { useMethod } from '../../../contexts/ServerContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
// import VerticalBar from '../../../components/VerticalBar';


export default function EmailChannelNew() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({
		name: '',
		active: false,
	});

	// const saveApp = useMethod('addOAuthApp');

	const router = useRoute('admin-email-channel');

	const close = useCallback(() => router.push({}), [router]);

	const handleSave = useCallback(async () => {
		try {
			// await saveApp(
			// 	newData,
			// );
			close();
			// dispatchToastMessage({ type: 'success', message: t('Application_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, dispatchToastMessage]);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const {
		active,
	} = newData;

	return <Accordion>
		<Accordion.Item defaultExpanded title={t('Channel_Info')}>
			<FieldGroup>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Active')}
						<ToggleSwitch checked={active} onChange={handleChange('active', () => !active)}/>
					</Field.Label>
				</Field>
				<Field>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={4} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Sender_Info')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
					<Field.Hint>
						{t('Will_Appear_In_From')}
					</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Department')}</Field.Label>
					<Field.Row>
						<DepartmentAutoComplete />
					</Field.Row>
					<Field.Hint>
						{t('Only_Members_Selected_Department_Can_View_Channel')}
					</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
		<Accordion.Item title={t('Configure_Outgoing_Mail_SMTP')}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Server')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Username')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Password')}</Field.Label>
					<Field.Row>
						<TextInput type='password' />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Connect_SSL_TLS')}
						<ToggleSwitch checked={active} onChange={handleChange('active', () => !active)}/>
					</Field.Label>
				</Field>
			</FieldGroup>
		</Accordion.Item>
		<Accordion.Item title={t('Configure_Incoming_Mail_IMAP')}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Server')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Port')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Username')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Password')}</Field.Label>
					<Field.Row>
						<TextInput type='password' />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Connect_SSL_TLS')}
						<ToggleSwitch checked={active} onChange={handleChange('active', () => !active)}/>
					</Field.Label>
				</Field>
			</FieldGroup>
		</Accordion.Item>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} >{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</Accordion>;
}
