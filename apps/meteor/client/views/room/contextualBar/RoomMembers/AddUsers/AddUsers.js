import { Field, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../../components/UserAutoCompleteMultiple';
import VerticalBar from '../../../../../components/VerticalBar';

const AddUsers = ({ onClickClose, onClickBack, onClickSave, value, onChange }) => {
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
					<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Choose_users')} />
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
