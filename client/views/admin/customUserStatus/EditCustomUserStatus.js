import { Button, ButtonGroup, TextInput, Field, Select, Icon } from '@rocket.chat/fuselage';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export function EditCustomUserStatus({ close, onChange, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const { _id, name: previousName, statusType: previousStatusType } = data || {};

	const [name, setName] = useState(() => data?.name ?? '');
	const [statusType, setStatusType] = useState(() => data?.statusType ?? '');

	useEffect(() => {
		setName(previousName || '');
		setStatusType(previousStatusType || '');
	}, [previousName, previousStatusType, _id]);

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const deleteStatus = useMethod('deleteCustomUserStatus');

	const hasUnsavedChanges = useMemo(
		() => previousName !== name || previousStatusType !== statusType,
		[name, previousName, previousStatusType, statusType],
	);
	const handleSave = useCallback(async () => {
		try {
			await saveStatus({
				_id,
				previousName,
				previousStatusType,
				name,
				statusType,
			});
			dispatchToastMessage({
				type: 'success',
				message: t('Custom_User_Status_Updated_Successfully'),
			});
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [
		saveStatus,
		_id,
		previousName,
		previousStatusType,
		name,
		statusType,
		dispatchToastMessage,
		t,
		onChange,
	]);

	const handleDeleteButtonClick = useCallback(() => {
		const handleClose = () => {
			setModal(null);
			close();
			onChange();
		};

		const handleDelete = async () => {
			try {
				await deleteStatus(_id);
				setModal(() => (
					<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
						{t('Custom_User_Status_Has_Been_Deleted')}
					</GenericModal>
				));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				onChange();
			}
		};

		const handleCancel = () => {
			setModal(null);
		};

		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={handleDelete}
				onCancel={handleCancel}
				confirmText={t('Delete')}
			>
				{t('Custom_User_Status_Delete_Warning')}
			</GenericModal>
		));
	}, [_id, close, deleteStatus, dispatchToastMessage, onChange, setModal, t]);

	const presenceOptions = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return (
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
						placeholder={t('Name')}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select
						value={statusType}
						onChange={(value) => setStatusType(value)}
						placeholder={t('Presence')}
						options={presenceOptions}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger onClick={handleDeleteButtonClick}>
							<Icon name='trash' mie='x4' />
							{t('Delete')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
}

export default EditCustomUserStatus;
