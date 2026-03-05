import { format } from 'date-fns';

import Time from './Time';

export type FullDateProps = {
	value: Date;
};

const FullDate = ({ value }: FullDateProps) => <Time value={format(value, 'PPPppp')} dateTime={value.toISOString()} />;

export default FullDate;
