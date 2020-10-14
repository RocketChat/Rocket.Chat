import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Button, ButtonGroup, TextInput, Field, Select, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSetModal } from '../../contexts/ModalContext';
import VerticalBar from '../../components/basic/VerticalBar';
import DeleteSuccessModal from '../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../components/DeleteWarningModal';

export function EditCustomUserStatus({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, name: previousName, statusType: previousStatusType } = data || {};

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('');
	const setModal = useSetModal();

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
			setModal(() => <DeleteSuccessModal
				children={t('Custom_User_Status_Has_Been_Deleted')}
				onClose={() => { setModal(undefined); close(); onChange(); }}
			/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteStatus, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal
		children={t('Custom_User_Status_Delete_Warning')}
		onDelete={onDeleteConfirm}
		onCancel={() => setModal(undefined)}
	/>);

	const presenceOptions = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return <VerticalBar.ScrollableContent {...props}>
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
	</VerticalBar.ScrollableContent>;
}

export default EditCustomUserStatus;
