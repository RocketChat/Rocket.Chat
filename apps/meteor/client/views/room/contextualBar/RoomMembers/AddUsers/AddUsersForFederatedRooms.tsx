import type { IUser } from '@rocket.chat/core-typings';
import { Field, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import VerticalBar from '../../../../../components/VerticalBar';
import { useAddMatrixUsers } from './ValidateMatrixInvitedUsers/useAddMatrixUsers';

type AddUsersForFederatedRoomsProps = {
	onClickClose?: () => void;
	onClickBack?: () => void;
	onChange: (value: string | string[]) => void;
	users: Exclude<IUser['username'], undefined>[];
};

const AddUsersForFederatedRooms = ({ onClickClose, onClickBack, onChange, users }: AddUsersForFederatedRoomsProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Add_users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<FieldGroup>
					<Field>
						<Field.Label flexGrow={0}>{t('Choose_users')}</Field.Label>
						{<UserAutoCompleteMultipleFederated value={users} onChange={onChange} placeholder={t('Choose_users')} />}
					</Field>
				</FieldGroup>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button primary disabled={!users || users.length === 0} onClick={useAddMatrixUsers({ users: users.filter((user) => user.startsWith('@'))})}>
						{t('Add_users')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default AddUsersForFederatedRooms;
