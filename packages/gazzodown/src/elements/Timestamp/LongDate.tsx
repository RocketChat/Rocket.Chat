import { format } from 'date-fns';

import Time from './Time';

export type LongDateProps = {
	value: Date;
};

const LongDate = ({ value }: LongDateProps) => <Time value={format(value, 'Pp')} dateTime={value.toISOString()} />;

export default LongDate;
