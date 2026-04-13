import { format } from 'date-fns';

const momentToDateFns: Record<string, string> = {
	L: 'PP',
	l: 'P',
	LL: 'PPP',
	ll: 'PP',
	LLL: 'PPP p',
	lll: 'PP p',
	LLLL: 'EEEE, PPP p',
	llll: 'EEE, PP p',
	LT: 'p',
	LTS: 'pp',
};

export const formatDate = (date: string, type = 'll') => {
	const d = new Date(date);
	const fmt = momentToDateFns[type] || type;
	return format(d, fmt);
};
