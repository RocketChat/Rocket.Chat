import type { IUser } from '@rocket.chat/core-typings';
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
import UserAutoCompleteMultiple from '../../../../../components/UserAutoCompleteMultiple';
import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';

type AddUsersProps = {
	onClickClose?: () => void;
	onClickBack?: () => void;
	onClickSave: () => Promise<void>;
	users: Exclude<IUser['username'], undefined>[];
	isRoomFederated: boolean;
	onChange: (value: string | string[]) => void;
};

const AddUsers = ({ onClickClose, onClickBack, onClickSave, users, isRoomFederated, onChange }: AddUsersProps): ReactElement => {
	const t = useTranslation();

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
						{isRoomFederated ? (
							<UserAutoCompleteMultipleFederated value={users} onChange={onChange} placeholder={t('Choose_users')} />
						) : (
							<UserAutoCompleteMultiple value={users} onChange={onChange} placeholder={t('Choose_users')} />
						)}
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button primary disabled={!users || users.length === 0} onClick={onClickSave}>
						{t('Add_users')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AddUsers;
