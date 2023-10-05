import { Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
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
			<FieldLabel>{t('Business_Hour')}</FieldLabel>
			<FieldRow>
				<TextInput disabled value={name || ''} />
			</FieldRow>
		</Field>
	);
};

export default DepartmentBusinessHours;
