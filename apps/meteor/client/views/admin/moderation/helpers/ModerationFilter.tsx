import DateRangePicker from './DateRangePicker';
import { FilterBar, FilterBarFilters, FilterBarSearch } from '../../../../components/FilterBar';

export type ModerationFilterProps = {
	text: string;
	setText: (text: string) => void;
	setDateRange: (dateRange: { start: string; end: string }) => void;
};

const ModerationFilter = ({ text, setText, setDateRange }: ModerationFilterProps) => {
	return (
		<FilterBar>
			<FilterBarSearch shouldAutoFocus value={text} onChange={(event) => setText(event.target.value)} />
			<FilterBarFilters>
				<DateRangePicker onChange={setDateRange} />
			</FilterBarFilters>
		</FilterBar>
	);
};

export default ModerationFilter;
