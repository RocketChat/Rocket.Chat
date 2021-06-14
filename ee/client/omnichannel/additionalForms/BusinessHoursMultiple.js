import { Field, TextInput, ToggleSwitch, MultiSelectFiltered, Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

const BusinessHoursMultiple = ({ values = {}, handlers = {}, className, departmentList = [] }) => {
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
					<MultiSelectFiltered
						options={departmentList}
						value={departments}
						onChange={handleDepartments}
						maxWidth='100%'
						placeholder={t('Departments')}
					/>
				</Field.Row>
			</Field>
		</>
	);
};

export default BusinessHoursMultiple;
