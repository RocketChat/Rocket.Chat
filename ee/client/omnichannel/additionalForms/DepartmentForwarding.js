import React, { useMemo } from 'react';
import { Field, MultiSelectFiltered } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';

export const DepartmentForwarding = ({ departmentId, value, handler, label, placeholder }) => {
	const t = useTranslation();
	const { value: data } = useEndpointData('livechat/department');

	const options = useMemo(() => (data && [...data.departments.filter((department) => department._id !== departmentId).map((department) => [department._id, department.name])]) || [], [data, departmentId]);


	return <Field>
		<Field.Label>{t(label)}</Field.Label>
		<Field.Row>
			<MultiSelectFiltered value={value} options={options} onChange={handler} disabled={!options} placeholder={t(placeholder)} flexGrow={1} />
		</Field.Row>
		<Field.Hint>{t('List_of_departments_for_forward_description')}</Field.Hint>
	</Field>;
};

export default DepartmentForwarding;
