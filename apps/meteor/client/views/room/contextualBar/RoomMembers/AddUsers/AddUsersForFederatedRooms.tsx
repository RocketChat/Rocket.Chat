import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Field, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../../../components/Contextualbar';
import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useAddMatrixUsers } from './ValidateMatrixInvitedUsers/useAddMatrixUsers';

type AddUsersForFederatedRoomsProps = {
	rid: IRoom['_id'];
	reload: () => void;
	onClickClose: () => void;
	onClickBack: () => void;
	handleUsers: (value: string | string[]) => void;
	users: Exclude<IUser['username'], undefined>[];
};

const AddUsersForFederatedRooms = ({
	rid,
	reload,
	onClickClose,
	onClickBack,
	handleUsers,
	users,
}: AddUsersForFederatedRoomsProps): ReactElement => {
	const t = useTranslation();

	const addClickHandler = useAddMatrixUsers();

	return (
		<>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{t('Add_users')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<Field.Label flexGrow={0}>{t('Choose_users')}</Field.Label>
						{<UserAutoCompleteMultipleFederated value={users} onChange={handleUsers} placeholder={t('Choose_users')} />}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button
						primary
						disabled={!users || users.length === 0 || addClickHandler.isLoading}
						onClick={() =>
							addClickHandler.mutate({
								rid,
								reload,
								onClickBack,
								handleUsers,
								users: users.filter((user) => user.startsWith('@')),
							})
						}
					>
						{t('Add_users')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AddUsersForFederatedRooms;
