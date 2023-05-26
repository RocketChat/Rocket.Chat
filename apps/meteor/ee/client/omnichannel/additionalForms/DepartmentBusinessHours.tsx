import { Field, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

export const DepartmentBusinessHours = ({ bhId }: { bhId: string | undefined }) => {
	const t = useTranslation();
	const getBusinessHour = useEndpoint('GET', '/v1/livechat/business-hour');
	const { data } = useQuery(['/v1/livechat/business-hour', bhId], () => getBusinessHour({ _id: bhId, type: 'custom' }));

	const name = data?.businessHour?.name;

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
