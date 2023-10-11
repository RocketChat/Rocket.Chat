import { Grid, GridItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import FilterByText from '../../../../components/FilterByText';
import DateRangePicker from './DateRangePicker';

type ModFilterProps = {
	setText: (text: string) => void;
	setDateRange: (dateRange: { start: string; end: string }) => void;
};

const ModFilter = ({ setText, setDateRange }: ModFilterProps) => {
	const t = useTranslation();

	const handleChange = useCallback(({ text }): void => setText(text), [setText]);

	return (
		<Grid>
			<GridItem flexGrow={5}>
				<FilterByText autoFocus placeholder={t('Search')} onChange={handleChange} />
			</GridItem>
			<GridItem display='flex' alignItems='center'>
				<DateRangePicker onChange={setDateRange} />
			</GridItem>
		</Grid>
	);
};

export default ModFilter;
