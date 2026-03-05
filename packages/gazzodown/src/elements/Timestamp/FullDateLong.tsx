import { format } from 'date-fns';

import Time from './Time';

export type FullDateLongProps = {
	value: Date;
};

const FullDateLong = ({ value }: FullDateLongProps) => <Time value={format(value, 'PPPPpppp')} dateTime={value.toISOString()} />;

export default FullDateLong;
