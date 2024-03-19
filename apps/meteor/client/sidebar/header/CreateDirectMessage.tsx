import type { IUser } from '@rocket.chat/core-typings';
import { Box, Modal, Button, FieldGroup, Field, FieldRow, FieldLabel, FieldError } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useToastMessageDispatch, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { memo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { goToRoomById } from '../../lib/utils/goToRoomById';

const CreateDirectMessage = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();
	const directMaxUsers = useSetting<number>('DirectMesssage_maxUsers') || 1;
	const membersFieldId = useUniqueId();
	const dispatchToastMessage = useToastMessageDispatch();

	const createDirectAction = useEndpoint('POST', '/v1/dm.create');

	const {
		control,
		handleSubmit,
		formState: { isDirty, isSubmitting, isValidating, errors },
	} = useForm({ mode: 'onBlur', defaultValues: { users: [] } });

	const mutateDirectMessage = useMutation({
		mutationFn: createDirectAction,
		onSuccess: ({ room: { rid } }) => {
			goToRoomById(rid);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			onClose();
		},
	});

	const handleCreate = async ({ users }: { users: IUser['username'][] }) => {
		return mutateDirectMessage.mutateAsync({ usernames: users.join(',') });
	};

	return (
		<Modal data-qa='create-direct-modal' wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Create_direct_message')}</Modal.Title>
				<Modal.Close tabIndex={-1} onClick={onClose} />
			</Modal.Header>
			<Modal.Content mbe={2}>
				<Box mbe={24}>{t('Direct_message_creation_description')}</Box>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={membersFieldId} required>
							{t('Members')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='users'
								rules={{
									required: t('error-the-field-is-required', { field: t('Members') }),
									validate: (users) =>
										users.length + 1 > directMaxUsers
											? t('error-direct-message-max-user-exceeded', { maxUsers: directMaxUsers })
											: undefined,
								}}
								control={control}
								render={({ field: { name, onChange, value, onBlur } }) => (
									<UserAutoCompleteMultipleFederated
										name={name}
										onChange={onChange}
										value={value}
										onBlur={onBlur}
										id={membersFieldId}
										aria-describedby={`${membersFieldId}-error`}
										aria-required='true'
										aria-invalid={Boolean(errors.users)}
									/>
								)}
							/>
						</FieldRow>
						{errors.users && (
							<FieldError aria-live='assertive' id={`${membersFieldId}-error`}>
								{errors.users.message}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isDirty} loading={isSubmitting || isValidating} type='submit' primary>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectMessage);
