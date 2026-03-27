import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow, Button, ButtonGroup, FieldGroup, CheckBox, Callout } from '@rocket.chat/fuselage';
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
import { useToastMessageDispatch, useMethod, useEndpoint, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useEffect, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
	const getBannedUsers = useEndpoint('GET', '/v1/rooms.bannedUsers');
	const unbanUser = useEndpoint('POST', '/v1/rooms.unbanUser');

	const [bannedUsernames, setBannedUsernames] = useState<string[]>([]);
	const [unbanConfirmed, setUnbanConfirmed] = useState(false);

	const {
		handleSubmit,
		control,
		getValues,
		formState: { isDirty, isSubmitting, errors },
	} = useForm({ defaultValues: { users: [] } });

	const selectedUsers = useWatch({ control, name: 'users' });

	useEffect(() => {
		setBannedUsernames([]);
		setUnbanConfirmed(false);
	}, [selectedUsers]);

	const handleSave = useEffectEvent(async ({ users }: { users: string[] }) => {
		try {
			if (unbanConfirmed && bannedUsernames.length) {
				await Promise.all(bannedUsernames.map((username) => unbanUser({ roomId: rid, username })));
				setBannedUsernames([]);
				setUnbanConfirmed(false);
			}

			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t(roomIsFederated && !isFederationBlocked ? 'Users_invited' : 'Users_added') });
			onClickBack();
			reload();
		} catch (error: any) {
			if (error.error === 'error-user-is-banned') {
				const { bannedUsers } = await getBannedUsers({ roomId: rid });
				const bannedSet = new Set(bannedUsers.map((u) => u.username));
				const usersToUnban = users.filter((username) => bannedSet.has(username));

				if (usersToUnban.length) {
					setBannedUsernames(usersToUnban);
					setUnbanConfirmed(false);
					return;
				}
			}
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
				{bannedUsernames.length > 0 && (
					<Callout type='warning' title={t('User_is_banned')} mbs={16}>
						{t('User_is_banned_from_room_confirm_unban')}
						<Field mbs={8}>
							<FieldRow>
								<CheckBox checked={unbanConfirmed} onChange={() => setUnbanConfirmed((prev) => !prev)} id='unban-confirm' />
								<FieldLabel htmlFor='unban-confirm'>{t('Unban_and_add')}</FieldLabel>
							</FieldRow>
						</Field>
					</Callout>
				)}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{roomIsFederated ? (
						!isFederationBlocked && (
							<Button
								primary
								disabled={addClickHandler.isPending || !isDirty || (bannedUsernames.length > 0 && !unbanConfirmed)}
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
						<Button
							primary
							loading={isSubmitting}
							disabled={!isDirty || (bannedUsernames.length > 0 && !unbanConfirmed)}
							onClick={handleSubmit(handleSave)}
						>
							{t('Add_users')}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default AddUsers;
