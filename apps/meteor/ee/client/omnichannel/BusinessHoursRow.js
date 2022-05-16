import { Table } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import RemoveBusinessHourButton from './RemoveBusinessHourButton';

function BusinessHoursRow(props) {
	const { _id, name, timezone, workHours, active, type, reload } = props;

	const t = useTranslation();

	const bhRoute = useRoute('omnichannel-businessHours');

	const handleClick = () => {
		bhRoute.push({
			context: 'edit',
			type,
			id: _id,
		});
	};

	const handleKeyDown = (e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const openDays = useMemo(
		() =>
			workHours.reduce((acc, day) => {
				if (day.open) {
					acc.push(t(day.day));
				}
				return acc;
			}, []),
		[t, workHours],
	);

	const preventClickPropagation = (e) => {
		e.stopPropagation();
	};

	return (
		<Table.Row key={_id} role='link' action tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
			<Table.Cell withTruncatedText>{name || t('Default')}</Table.Cell>
			<Table.Cell withTruncatedText>{t(timezone.name)}</Table.Cell>
			<Table.Cell withTruncatedText>{openDays.join(', ')}</Table.Cell>
			<Table.Cell withTruncatedText>{active ? t('Yes') : t('No')}</Table.Cell>
			{name && (
				<Table.Cell withTruncatedText onClick={preventClickPropagation}>
					<RemoveBusinessHourButton _id={_id} reload={reload} type={type} />
				</Table.Cell>
			)}
		</Table.Row>
	);
}

export default memo(BusinessHoursRow);
