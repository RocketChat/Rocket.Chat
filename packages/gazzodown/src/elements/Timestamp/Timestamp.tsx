import FullDate from './FullDate';
import FullDateLong from './FullDateLong';
import LongDate from './LongDate';
import LongTime from './LongTime';
import RelativeTime from './RelativeTime';
import ShortDate from './ShortDate';
import ShortTime from './ShortTime';

export type TimestampProps = {
	format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
	value: Date;
};

const Timestamp = ({ format, value }: TimestampProps) => {
	switch (format) {
		case 't': // Short time format
			return <ShortTime value={value} />;
		case 'T': // Long time format
			return <LongTime value={value} />;
		case 'd': // Short date format
			return <ShortDate value={value} />;
		case 'D': // Long date format
			return <LongDate value={value} />;
		case 'f': // Full date and time format
			return <FullDate value={value} />;

		case 'F': // Full date and time (long) format
			return <FullDateLong value={value} />;

		case 'R': // Relative time format
			return <RelativeTime value={value} />;

		default:
			return <time dateTime={value.toISOString()}> {JSON.stringify(value.getTime())}</time>;
	}
};

export default Timestamp;
