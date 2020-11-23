import React, { useMemo } from 'react';
import { Field, MultiSelectFiltered } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';

export const DepartmentForwarding = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();
	const { data } = useEndpointDataExperimental('livechat/department');

	const options = useMemo(() => (data && [...data.departments.map((department) => [department._id, department.name])]) || [], [data]);

	return <Field mbe='x16'>
		<Field.Label>{t(label)}</Field.Label>
		<Field.Row>
			<MultiSelectFiltered value={value} options={options} onChange={handler} disabled={!options} placeholder={t(placeholder)} flexGrow={1} />
		</Field.Row>
		<Field.Hint>{t('List_of_departments_for_forward_description')}</Field.Hint>
	</Field>;
};

export default DepartmentForwarding;
