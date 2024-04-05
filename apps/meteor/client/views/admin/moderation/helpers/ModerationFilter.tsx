import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import FilterByText from '../../../../components/FilterByText';
import DateRangePicker from './DateRangePicker';

type ModerationFilterProps = {
	setText: (text: string) => void;
	setDateRange: (dateRange: { start: string; end: string }) => void;
};

const ModerationFilter = ({ setText, setDateRange }: ModerationFilterProps) => {
	const t = useTranslation();

	const handleChange = useCallback(({ text }): void => setText(text), [setText]);

	return (
		<FilterByText placeholder={t('Search')} onChange={handleChange}>
			<DateRangePicker onChange={setDateRange} />
		</FilterByText>
	);
};

export default ModerationFilter;
