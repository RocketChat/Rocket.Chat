import { Field, FieldLabel, FieldRow, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import AutoCompleteDepartmentMultiple from '../../../../client/components/AutoCompleteDepartmentMultiple';

const BusinessHoursMultiple = ({ values = {}, handlers = {}, className }) => {
	const t = useTranslation();

	const { active, name, departments } = values;

	const { handleActive, handleName, handleDepartments } = handlers;

	return (
		<>
			<Field className={className}>
				<FieldRow>
					<FieldLabel>{t('Enabled')}</FieldLabel>
					<ToggleSwitch checked={active} onChange={handleActive} />
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel required>{t('Name')}</FieldLabel>
				<FieldRow>
					<TextInput value={name} onChange={handleName} placeholder={t('Name')} />
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel>{t('Departments')}</FieldLabel>
				<FieldRow>
					<AutoCompleteDepartmentMultiple value={departments} onChange={handleDepartments} enabled={true} />
				</FieldRow>
			</Field>
		</>
	);
};

export default BusinessHoursMultiple;
