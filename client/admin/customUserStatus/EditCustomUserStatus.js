import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, TextInput, Field, Select, Icon, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
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
			{t('Custom_User_Status_Delete_Warning')}
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
			{t('Custom_User_Status_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditCustomUserStatusWithData({ _id, cache, ...props }) {
	const t = useTranslation();
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
		// TODO: remove cache. Is necessary for data invalidation
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('custom-user-status.list', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20'>
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

	if (error || !data || data.statuses.length < 1) {
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	return <EditCustomUserStatus data={data.statuses[0]} {...props}/>;
}

export function EditCustomUserStatus({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, name: previousName, statusType: previousStatusType } = data || {};

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('');
	const [modal, setModal] = useState();

	useEffect(() => {
		setName(previousName || '');
		setStatusType(previousStatusType || '');
	}, [previousName, previousStatusType, _id]);

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const deleteStatus = useMethod('deleteCustomUserStatus');

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousStatusType !== statusType, [name, previousName, previousStatusType, statusType]);
	const handleSave = useCallback(async () => {
		try {
			await saveStatus({
				_id,
				previousName,
				previousStatusType,
				name,
				statusType,
			});
			dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Updated_Successfully') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [saveStatus, _id, previousName, previousStatusType, name, statusType, dispatchToastMessage, t, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteStatus(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteStatus, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const presenceOptions = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return <>
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select value={statusType} onChange={(value) => setStatusType(value)} placeholder={t('Presence')} options={presenceOptions}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
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
		</VerticalBar.ScrollableContent>
		{ modal }
	</>;
}
