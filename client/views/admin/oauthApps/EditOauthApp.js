import {
	Button,
	ButtonGroup,
	TextInput,
	Field,
	Icon,
	TextAreaInput,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';
import React, { useCallback, useState, useMemo } from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod, useAbsoluteUrl } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

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
			await saveApp(data._id, newData);
			dispatchToastMessage({ type: 'success', message: t('Application_updated') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [data._id, dispatchToastMessage, newData, onChange, saveApp, t]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteApp(data._id);

			const handleClose = () => {
				setModal();
				close();
			};

			setModal(() => (
				<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
					{t('Your_entry_has_been_deleted')}
				</GenericModal>
			));
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [close, data._id, deleteApp, dispatchToastMessage, setModal, t]);

	const openConfirmDelete = () =>
		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={onDeleteConfirm}
				onCancel={() => setModal(undefined)}
				confirmText={t('Delete')}
			>
				{t('Application_delete_warning')}
			</GenericModal>
		));

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
							<Button primary onClick={handleSave}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button primary danger onClick={openConfirmDelete}>
								<Icon name='trash' mie='x4' />
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	);
}

export default EditOauthApp;
