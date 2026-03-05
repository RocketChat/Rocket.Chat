import { format } from 'date-fns';

import Time from './Time';

export type ShortTimeProps = {
	value: Date;
};

const ShortTime = ({ value }: ShortTimeProps) => <Time value={format(value, 'p')} dateTime={value.toISOString()} />;

export default ShortTime;
