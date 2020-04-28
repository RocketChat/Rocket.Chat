import React, { useCallback, useState, useMemo, useContext, useEffect } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Select, Icon, Modal, ModalBackdrop } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { CurrentStatusContext } from './CustomUserStatusRoute';

const style = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)' };

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <ModalBackdrop style={style}><Modal {...props}>
		<Modal.Header>
			<Icon textColor='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content textStyle='p1'>
			{t('Custom_User_Status_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal></ModalBackdrop>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <><ModalBackdrop style={style}><Modal {...props}>
		<Modal.Header>
			<Icon textColor='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content textStyle='p1'>
			{t('Custom_User_Status_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal></ModalBackdrop></>;
};

export function EditCustomUserStatus({ close, setCache, setModal, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { currentStatus } = useContext(CurrentStatusContext);
	const { _id, name: previousName, statusType: previousStatusType } = currentStatus;

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('');

	useEffect(() => {
		setName(previousName || '');
		setStatusType(previousStatusType || '');
	}, [previousName, previousStatusType, _id]);

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const deleteStatus = useMethod('deleteCustomUserStatus');

	const hasUnsavedChanges = useMemo(() => previousName !== name || previousStatusType !== statusType, [name, statusType]);
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
			setCache(new Date());
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [name, statusType, _id]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteStatus(_id);
			setModal(() => <SuccessModal onClose={() => setModal(undefined)}/>);
			setCache(new Date());
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [_id]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const presenceOptions = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['invisible', t('Invisible')],
	];

	return <Box display='flex' flexDirection='column' textStyle='p1' textColor='default' mbs='x20' {...props}>
		<Margins block='x4'>
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
		</Margins>
	</Box>;
}
