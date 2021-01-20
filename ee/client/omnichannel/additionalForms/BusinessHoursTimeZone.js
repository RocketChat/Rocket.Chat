import React, { useMemo } from 'react';
import { SelectFiltered, Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useTimezoneNameList } from '../../../../client/hooks/useTimezoneNameList';
import { useForm } from '../../../../client/hooks/useForm';

const getInitialData = (data = {}) => ({
	name: data ?? '',
});

const BusinessHoursTimeZone = ({ onChange, data, className, hasChanges = () => {} }) => {
	const t = useTranslation();

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(data));

	const { name } = values;
	const { handleName } = handlers;

	const timeZones = useTimezoneNameList();

	const timeZonesOptions = useMemo(() => timeZones.map((name) => [
		name,
		t(name),
	]), [t, timeZones]);

	onChange({ name });
	hasChanges(hasUnsavedChanges);

	return <Field className={className}>
		<Field.Label>
			{t('Timezone')}
		</Field.Label>
		<Field.Row>
			<SelectFiltered options={timeZonesOptions} value={name} onChange={handleName}/>
		</Field.Row>
	</Field>;
};

export default BusinessHoursTimeZone;
