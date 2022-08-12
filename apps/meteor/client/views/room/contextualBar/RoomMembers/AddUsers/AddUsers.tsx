import { IUser } from '@rocket.chat/core-typings';
import { Field, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import VerticalBar from '../../../../../components/VerticalBar';

type AddUsersProps = {
	onClickClose?: () => void;
	onClickBack?: () => void;
	onClickSave: () => Promise<void>;
	users: Exclude<IUser['username'], undefined>[];
	onChange: (value: IUser['username'][]) => void;
};

const AddUsers = ({ onClickClose, onClickBack, onClickSave, users, onChange }: AddUsersProps): ReactElement => {
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
						<UserAutoCompleteMultipleFederated value={users} onChange={onChange} placeholder={t('Choose_users')} />
					</Field>
					<Field>
						<ButtonGroup>
							<Button primary disabled={!users || users.length === 0} onClick={onClickSave}>
								{t('Add_users')}
							</Button>
						</ButtonGroup>
					</Field>
				</FieldGroup>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default AddUsers;
