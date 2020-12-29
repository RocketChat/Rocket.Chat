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

import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod, useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import VerticalBar from '../../../components/VerticalBar';
import DeleteSuccessModal from '../../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

export default function EditOauthAppWithData({ _id, ...props }) {
	const t = useTranslation();

	const params = useMemo(() => ({ appId: _id }), [_id]);
	const { value: data, phase: state, error, reload } = useEndpointData('oauth-apps.get', params);

	const onChange = useCallback(() => {
		reload();
	}, [reload]);

	if (state === AsyncStatePhase.LOADING) {
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
	const setModal = useSetModal();

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
			setModal(() => <DeleteSuccessModal
				children={t('Your_entry_has_been_deleted')}
				onClose={() => { setModal(); close(); }}
			/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, data._id, deleteApp, dispatchToastMessage, setModal, t]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal
		children={t('Application_delete_warning')}
		onDelete={onDeleteConfirm}
		onCancel={() => setModal(undefined)}
	/>);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const {
		active,
		name,
		redirectUri,
	} = newData;

	return <VerticalBar.ScrollableContent w='full' {...props}>
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
	</VerticalBar.ScrollableContent>;
}
