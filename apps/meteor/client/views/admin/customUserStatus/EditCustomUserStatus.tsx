import { Button, ButtonGroup, TextInput, Field, Select, Icon, SelectOption } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, useMemo, useEffect, ReactElement, SyntheticEvent } from 'react';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';

type EditCustomUserStatusProps = {
	close: () => void;
	onChange: () => void;
	data?: {
		_id: string;
		name: string;
		statusType: string;
	};
};
export function EditCustomUserStatus({ close, onChange, data, ...props }: EditCustomUserStatusProps): ReactElement {
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
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	}, [saveStatus, _id, previousName, previousStatusType, name, statusType, dispatchToastMessage, t, onChange]);

	const handleDeleteButtonClick = useCallback(() => {
		const handleClose = (): void => {
			setModal(null);
			close();
			onChange();
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteStatus(_id);
				setModal(() => (
					<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
						{t('Custom_User_Status_Has_Been_Deleted')}
					</GenericModal>
				));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: String(error) });
				onChange();
			}
		};

		const handleCancel = (): void => {
			setModal(null);
		};

		setModal(() => (
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_User_Status_Delete_Warning')}
			</GenericModal>
		));
	}, [_id, close, deleteStatus, dispatchToastMessage, onChange, setModal, t]);

	const presenceOptions: SelectOption[] = [
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
						onChange={(e: SyntheticEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
						placeholder={t('Name')}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select
						value={statusType}
						onChange={(value): void => setStatusType(value)}
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
