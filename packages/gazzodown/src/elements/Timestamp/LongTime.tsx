import { format } from 'date-fns';

import Time from './Time';

export type LongTimeProps = {
	value: Date;
};

const LongTime = ({ value }: LongTimeProps) => <Time value={format(value, 'pp')} dateTime={value.toISOString()} />;

export default LongTime;
