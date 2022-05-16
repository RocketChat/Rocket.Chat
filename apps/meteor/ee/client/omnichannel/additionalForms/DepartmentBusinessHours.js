import { Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useEndpointData } from '../../../../client/hooks/useEndpointData';

export const DepartmentBusinessHours = ({ bhId }) => {
	const t = useTranslation();
	const { value: data } = useEndpointData(
		'livechat/business-hour',
		useMemo(() => ({ _id: bhId, type: 'custom' }), [bhId]),
	);

	const name = data && data.businessHour && data.businessHour.name;

	return (
		<Field>
			<Field.Label>{t('Business_Hour')}</Field.Label>
			<Field.Row>
				<TextInput disabled value={name || ''} />
			</Field.Row>
		</Field>
	);
};

export default DepartmentBusinessHours;
