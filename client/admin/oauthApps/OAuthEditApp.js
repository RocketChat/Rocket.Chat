import React, { useCallback, useState, useMemo } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	TextInput,
	Field,
	Icon,
	Skeleton,
	Throbber,
	InputBox,
	TextAreaInput,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod, useAbsoluteUrl } from '../../contexts/ServerContext';
import { useRoute } from '../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { Modal } from '../../components/basic/Modal';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import VerticalBar from '../../components/basic/VerticalBar';

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Application_delete_warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Your_entry_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default function EditOauthAppWithData({ _id, ...props }) {
	const t = useTranslation();

	const [cache, setCache] = useState();

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const query = useMemo(() => ({
		appId: _id,
		// TODO: remove cache. Is necessary for data invalidation
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('oauth-apps.get', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20' maxWidth='x600' w='full' alignSelf='center'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || !_id) {
		return <Box fontScale='h1' pb='x20'>{t('error-application-not-found')}</Box>;
	}

	return <EditOauthApp data={data.oauthApp} onChange={onChange} {...props}/>;
}

function EditOauthApp({ onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [newData, setNewData] = useState({
		name: data.name,
		active: data.active,
		redirectUri: Array.isArray(data.redirectUri) ? data.redirectUri.join('\n') : data.redirectUri,
	});
	const [modal, setModal] = useState();

	const router = useRoute('admin-oauth-apps');

	const close = useCallback(() => router.push({}), [router]);

	const absoluteUrl = useAbsoluteUrl();
	const authUrl = useMemo(() => absoluteUrl('oauth/authorize'), [absoluteUrl]);
	const tokenUrl = useMemo(() => absoluteUrl('oauth/token'), [absoluteUrl]);

	const saveApp = useMethod('updateOAuthApp');
	const deleteApp = useMethod('deleteOAuthApp');

	const handleSave = useCallback(async () => {
		try {
			await saveApp(
				data._id,
				newData,
			);
			dispatchToastMessage({ type: 'success', message: t('Application_updated') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [data._id, dispatchToastMessage, newData, onChange, saveApp, t]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteApp(data._id);
			setModal(() => <SuccessModal onClose={() => { setModal(); close(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, data._id, deleteApp, dispatchToastMessage]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const {
		active,
		name,
		redirectUri,
	} = newData;

	return <>
		<VerticalBar.ScrollableContent w='full' {...props}>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Active')}
						<ToggleSwitch checked={active} onChange={handleChange('active', () => !active)}/>
					</Field.Label>
				</Field>
				<Field>
					<Field.Label>{t('Application_Name')}</Field.Label>
					<Field.Row>
						<TextInput value={name} onChange={handleChange('name')} />
					</Field.Row>
					<Field.Hint>{t('Give_the_application_a_name_This_will_be_seen_by_your_users')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Redirect_URI')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={5} value={redirectUri} onChange={handleChange('redirectUri')}/>
					</Field.Row>
					<Field.Hint>{t('After_OAuth2_authentication_users_will_be_redirected_to_this_URL')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Client_ID')}</Field.Label>
					<Field.Row>
						<TextInput value={data.clientId} onChange={handleChange('clientId')} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Client_Secret')}</Field.Label>
					<Field.Row>
						<TextInput value={data.clientSecret} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Authorization_URL')}</Field.Label>
					<Field.Row>
						<TextInput value={authUrl} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Access_Token_URL')}</Field.Label>
					<Field.Row>
						<TextInput value={tokenUrl} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSave} >{t('Save')}</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
		{ modal }
	</>;
}
