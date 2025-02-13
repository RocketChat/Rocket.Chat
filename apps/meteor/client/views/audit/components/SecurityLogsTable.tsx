import { Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingSelect } from './SettingSelect';

const SecurityLogsTable = (): ReactElement => {
	const { t } = useTranslation();
	const [value, setValue] = useState('');

	return (
		<>
			<Field alignSelf='stretch'>
				<FieldLabel>{t('Setting')}</FieldLabel>
				<FieldRow>
					<SettingSelect value={value} onChange={setValue} />
				</FieldRow>
			</Field>
		</>
	);
};

export default SecurityLogsTable;
