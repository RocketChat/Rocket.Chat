import { Field, Button, ButtonGroup, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

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
	isRoomFederated: boolean;
};

const AddUsers = ({ onClickClose, onClickBack, onClickSave, isRoomFederated }: AddUsersProps): ReactElement => {
	const t = useTranslation();

	const {
		control,
		formState: { isDirty },
	} = useFormContext();

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
					<Button primary disabled={!isDirty} onClick={onClickSave}>
						{t('Add_users')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AddUsers;
