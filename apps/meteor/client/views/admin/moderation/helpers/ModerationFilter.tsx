import DateRangePicker from './DateRangePicker';
import FilterByText from '../../../../components/FilterByText';

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
