import React from 'react';

import FilterByText from '../../../../components/FilterByText';
import DateRangePicker from './DateRangePicker';

type ModerationFilterProps = {
	text: string;
	setText: (text: string) => void;
	setDateRange: (dateRange: { start: string; end: string }) => void;
};

const ModerationFilter = ({ text, setText, setDateRange }: ModerationFilterProps) => {
	return (
		<FilterByText shouldAutoFocus value={text} onChange={(event) => setText(event.target.value)}>
			<DateRangePicker onChange={setDateRange} />
		</FilterByText>
	);
};

export default ModerationFilter;
