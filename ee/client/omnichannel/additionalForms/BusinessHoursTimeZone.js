import React, { useMemo, useState } from 'react';
import { SelectFiltered, Field } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useTimezoneNameList } from '../../../../client/hooks/useTimezoneNameList';

const BusinessHoursTimeZone = ({ onChange, data, className }) => {
	const t = useTranslation();

	const [timezone, setTimezone] = useState(data);

	const timeZones = useTimezoneNameList();

	const timeZonesOptions = useMemo(() => timeZones.map((name) => [
		name,
		t(name),
	]), [t, timeZones]);

	const handleChange = useMutableCallback((value) => {
		setTimezone(value);
	});

	onChange({ name: timezone });

	return <Field className={className}>
		<Field.Label>
			{t('Timezone')}
		</Field.Label>
		<Field.Row>
			<SelectFiltered options={timeZonesOptions} value={timezone} onChange={handleChange}/>
		</Field.Row>
	</Field>;
};

export default BusinessHoursTimeZone;
