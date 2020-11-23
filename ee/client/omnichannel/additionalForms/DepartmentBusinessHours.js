import React, { useMemo } from 'react';
import { Field, TextInput } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';

export const DepartmentBusinessHours = ({ bhId }) => {
	const t = useTranslation();
	const { data } = useEndpointDataExperimental('livechat/business-hour', useMemo(() => ({ _id: bhId, type: 'custom' }), [bhId]));

	const name = data && data.businessHour && data.businessHour.name;

	return <Field mbe='x16'>
		<Field.Label>{t('Business_Hour')}</Field.Label>
		<Field.Row>
			<TextInput disabled value={name || ''}/>
		</Field.Row>
	</Field>;
};

export default DepartmentBusinessHours;
