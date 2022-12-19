import type { IUserStatus } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Button, ButtonGroup, TextInput, Field, Select, Icon } from '@rocket.chat/fuselage';
import { useSetModal, useRoute, useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';

type CustomUserStatusFormProps = {
	onClose: () => void;
	onReload: () => void;
	status?: IUserStatus;
};

const CustomUserStatusForm = ({ onClose, onReload, status }: CustomUserStatusFormProps): ReactElement => {
	const t = useTranslation();
	const { _id, name, statusType } = status || {};
	const setModal = useSetModal();
	const route = useRoute('custom-user-status');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		control,
		handleSubmit,
		formState: { isDirty, errors },
	} = useForm({
		defaultValues: { name: status?.name ?? '', statusType: status?.statusType ?? '' },
	});

	const saveStatus = useEndpoint('POST', _id ? '/v1/custom-user-status.update' : '/v1/custom-user-status.create');
	const deleteStatus = useEndpoint('POST', '/v1/custom-user-status.delete');

	const handleSave = useCallback(
		async (data) => {
			try {
				await saveStatus({ _id, name, statusType, ...data });

				dispatchToastMessage({
					type: 'success',
					message: t('Custom_User_Status_Updated_Successfully'),
				});

				onReload();
				route.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[saveStatus, _id, name, statusType, route, dispatchToastMessage, t, onReload],
	);

	const handleDeleteStatus = useCallback(() => {
		const handleCancel = (): void => {
			setModal(null);
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteStatus({ customUserStatusId: _id || '' });
				dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Has_Been_Deleted') });
				onReload();
				route.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(() => (
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_User_Status_Delete_Warning')}
			</GenericModal>
		));
	}, [_id, route, deleteStatus, dispatchToastMessage, onReload, setModal, t]);

	const presenceOptions: SelectOption[] = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return (
		<VerticalBar.ScrollableContent>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput {...register('name', { required: true })} placeholder={t('Name')} />
				</Field.Row>
				{errors?.name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>}
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Controller
						name='statusType'
						control={control}
						rules={{ required: true }}
						render={({ field }): ReactElement => <Select {...field} placeholder={t('Presence')} options={presenceOptions} />}
					/>
				</Field.Row>
				{errors?.statusType && <Field.Error>{t('error-the-field-is-required', { field: t('Presence') })}</Field.Error>}
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button onClick={onClose}>{t('Cancel')}</Button>
						<Button primary onClick={handleSubmit(handleSave)} disabled={!isDirty}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			{_id && (
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button danger onClick={handleDeleteStatus}>
								<Icon name='trash' mie='x4' />
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			)}
		</VerticalBar.ScrollableContent>
	);
};

export default CustomUserStatusForm;
