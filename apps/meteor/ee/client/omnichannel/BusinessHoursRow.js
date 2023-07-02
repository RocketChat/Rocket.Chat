import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../client/components/GenericTable';
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
		<GenericTableRow key={_id} role='link' action tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
			<GenericTableCell withTruncatedText>{name || t('Default')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{t(timezone.name)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{openDays.join(', ')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{active ? t('Yes') : t('No')}</GenericTableCell>
			{name && (
				<GenericTableCell withTruncatedText onClick={preventClickPropagation}>
					<RemoveBusinessHourButton _id={_id} reload={reload} type={type} />
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
}

export default memo(BusinessHoursRow);
