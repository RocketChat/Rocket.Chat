import { Field, TextInput, ToggleSwitch, Box } from '@rocket.chat/fuselage';
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
				<Box display='flex' flexDirection='row'>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={active} onChange={handleActive} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={handleName} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Departments')}</Field.Label>
				<Field.Row>
					<AutoCompleteDepartmentMultiple value={departments} onChange={handleDepartments} />
				</Field.Row>
			</Field>
		</>
	);
};

export default BusinessHoursMultiple;
