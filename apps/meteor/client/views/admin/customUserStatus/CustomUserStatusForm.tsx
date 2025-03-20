import type { IUserStatus } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { FieldGroup, Button, ButtonGroup, TextInput, Field, FieldLabel, FieldRow, FieldError, Select, Box } from '@rocket.chat/fuselage';
import { useSetModal, useRoute, useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';

type CustomUserStatusFormFormData = {
	name: string;
	statusType: string;
};

type CustomUserStatusFormProps = {
	onClose: () => void;
	onReload: () => void;
	status?: IUserStatus;
};

const CustomUserStatusForm = ({ onClose, onReload, status }: CustomUserStatusFormProps): ReactElement => {
	const t = useTranslation();
	const { _id } = status || {};
	const setModal = useSetModal();
	const route = useRoute('user-status');
	const dispatchToastMessage = useToastMessageDispatch();
	const formId = useId();

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<CustomUserStatusFormFormData>({
		defaultValues: { name: status?.name ?? '', statusType: status?.statusType ?? '' },
		mode: 'all',
	});

	const createStatus = useEndpoint('POST', '/v1/custom-user-status.create');
	const updateStatus = useEndpoint('POST', '/v1/custom-user-status.update');
	const deleteStatus = useEndpoint('POST', '/v1/custom-user-status.delete');

	const handleSave = useCallback(
		async (data: CustomUserStatusFormFormData) => {
			try {
				if (status?._id) {
					await updateStatus({ _id: status?._id, ...data });
				} else {
					await createStatus({ ...data });
				}

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
		[status?._id, dispatchToastMessage, t, onReload, route, updateStatus, createStatus],
	);

	const handleDeleteStatus = useCallback(() => {
		const handleCancel = (): void => {
			setModal(null);
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteStatus({ customUserStatusId: status?._id ?? '' });
				dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Has_Been_Deleted') });
				onReload();
				route.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={handleDelete} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Custom_User_Status_Delete_Warning')}
			</GenericModal>,
		);
	}, [status?._id, route, deleteStatus, dispatchToastMessage, onReload, setModal, t]);

	const presenceOptions: SelectOption[] = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return (
		<>
			<ContextualbarScrollableContent>
				<FieldGroup id={formId} is='form' onSubmit={handleSubmit(handleSave)}>
					<Field>
						<FieldLabel>{t('Name')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('name', { required: t('Required_field', { field: t('Name') }) })} placeholder={t('Name')} />
						</FieldRow>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Presence')}</FieldLabel>
						<FieldRow>
							<Controller
								name='statusType'
								control={control}
								rules={{ required: t('Required_field', { field: t('Presence') }) }}
								render={({ field }): ReactElement => <Select {...field} placeholder={t('Presence')} options={presenceOptions} />}
							/>
						</FieldRow>
						{errors.statusType && <FieldError>{errors.statusType.message}</FieldError>}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{_id && (
					<Box mbs={8}>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={handleDeleteStatus}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</>
	);
};

export default CustomUserStatusForm;
