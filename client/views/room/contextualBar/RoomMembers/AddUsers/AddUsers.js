import { Field, Button } from '@rocket.chat/fuselage';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../../../ee/client/audit/UserAutoCompleteMultiple';
import VerticalBar from '../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const AddUsers = ({ onClickClose, onClickBack, onClickSave, value, onChange, errors }) => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Add_users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Field>
					<Field.Label flexGrow={0}>{t('Choose_users')}</Field.Label>
					<UserAutoCompleteMultiple
						errors={errors.users}
						value={value}
						onChange={onChange}
						placeholder={t('Choose_users')}
					/>
					{errors.users && <Field.Error>{errors.users}</Field.Error>}
				</Field>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<Button primary disabled={!value || value.length === 0} onClick={onClickSave}>
					{t('Add_users')}
				</Button>
			</VerticalBar.Footer>
		</>
	);
};

export default AddUsers;
