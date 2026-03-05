import { format } from 'date-fns';

import Time from './Time';

export type ShortDateProps = {
	value: Date;
};

const ShortDate = ({ value }: ShortDateProps) => <Time value={format(value, 'P')} dateTime={value.toISOString()} />;

export default ShortDate;
