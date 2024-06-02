import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Field, FieldLabel, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../../../components/Contextualbar';
import UserAutoCompleteMultiple from '../../../../../components/UserAutoCompleteMultiple';
import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useRoom } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';
import { useAddMatrixUsers } from './AddMatrixUsers/useAddMatrixUsers';

type AddUsersProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	reload: () => void;
};

const AddUsers = ({ rid, onClickBack, reload }: AddUsersProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useRoom();

	const { closeTab } = useRoomToolbox();
	const saveAction = useMethod('addUsersToRoom');

	const {
		handleSubmit,
		control,
		getValues,
		formState: { isDirty, isSubmitting },
	} = useForm({ defaultValues: { users: [] } });

	const handleSave = useMutableCallback(async ({ users }) => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	const addClickHandler = useAddMatrixUsers();

	return (
		<>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{t('Add_users')}</ContextualbarTitle>
				{closeTab && <ContextualbarClose onClick={closeTab} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<FieldLabel flexGrow={0}>{t('Choose_users')}</FieldLabel>
						{isRoomFederated(room) ? (
							<Controller
								name='users'
								control={control}
								render={({ field }) => <UserAutoCompleteMultipleFederated {...field} placeholder={t('Choose_users')} />}
							/>
						) : (
							<Controller
								name='users'
								control={control}
								render={({ field }) => <UserAutoCompleteMultiple {...field} placeholder={t('Choose_users')} />}
							/>
						)}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{isRoomFederated(room) ? (
						<Button
							primary
							disabled={addClickHandler.isLoading}
							onClick={() =>
								addClickHandler.mutate({
									users: getValues('users'),
									handleSave,
								})
							}
						>
							{t('Add_users')}
						</Button>
					) : (
						<Button primary loading={isSubmitting} disabled={!isDirty} onClick={handleSubmit(handleSave)}>
							{t('Add_users')}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AddUsers;
