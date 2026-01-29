import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useMethod, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAddMatrixUsers } from './AddMatrixUsers/useAddMatrixUsers';
import UserAutoCompleteMultiple from '../../../../../components/UserAutoCompleteMultiple';
import { useRoom } from '../../../contexts/RoomContext';

const hasExternalUsers = (users: string[]): boolean => users.some((user) => user.startsWith('@'));

type AddUsersProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	reload: () => void;
};

const AddUsers = ({ rid, onClickBack, reload }: AddUsersProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useRoom();
	const usersFieldId = useId();
	const roomIsFederated = isRoomFederated(room);
	// we are dropping the non native federation for now
	const isFederationBlocked = room && !isRoomNativeFederated(room);
	const isFederated = roomIsFederated && !isFederationBlocked;

	const { closeTab } = useRoomToolbox();
	const saveAction = useMethod('addUsersToRoom');

	const {
		handleSubmit,
		control,
		getValues,
		formState: { isDirty, isSubmitting, errors },
	} = useForm({ defaultValues: { users: [] } });

	const handleSave = useEffectEvent(async ({ users }: { users: string[] }) => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t(roomIsFederated && !isFederationBlocked ? 'Users_invited' : 'Users_added') });
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	const addClickHandler = useAddMatrixUsers();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{t('Add_users')}</ContextualbarTitle>
				{closeTab && <ContextualbarClose onClick={closeTab} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<FieldLabel flexGrow={0}>{t('Choose_users')}</FieldLabel>
						<Controller
							name='users'
							control={control}
							rules={{
								validate: (users) => !isFederated && (!hasExternalUsers(users) || t('You_cannot_add_external_users_to_non_federated_room')),
							}}
							render={({ field }) => (
								<UserAutoCompleteMultiple
									federated={isFederated}
									placeholder={t('Choose_users')}
									aria-describedby={`${usersFieldId}-error`}
									{...field}
								/>
							)}
						/>
						{errors.users && (
							<FieldError role='alert' id={`${usersFieldId}-error`}>
								{errors.users.message}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{roomIsFederated ? (
						!isFederationBlocked && (
							<Button
								primary
								disabled={addClickHandler.isPending || !isDirty}
								onClick={() =>
									addClickHandler.mutate({
										users: getValues('users'),
										handleSave,
									})
								}
							>
								{t('Add_users')}
							</Button>
						)
					) : (
						<Button primary loading={isSubmitting} disabled={!isDirty} onClick={handleSubmit(handleSave)}>
							{t('Add_users')}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default AddUsers;
