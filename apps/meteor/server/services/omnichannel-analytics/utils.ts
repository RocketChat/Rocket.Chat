import moment from 'moment';

const HOURS_IN_DAY = 24;

export async function* dayIterator(from: moment.Moment, to: moment.Moment): AsyncGenerator<moment.Moment> {
	const m = from.clone().startOf('day');
	const f = to.clone().startOf('day');
	while (m.diff(f, 'days') <= 0) {
		yield m;
		m.add(1, 'days');
	}
}

export async function* weekIterator(from: moment.Moment, to: moment.Moment, timezone: string): AsyncGenerator<moment.Moment> {
	const m = moment.tz(from, timezone);
	while (m.diff(to, 'weeks') <= 0) {
		yield moment(m);
		m.add(1, 'weeks');
	}
}

export async function* hourIterator(day: moment.Moment): AsyncGenerator<moment.Moment> {
	const m = moment(day).startOf('day');
	let passedHours = 0;
	while (passedHours < HOURS_IN_DAY) {
		yield moment(m);
		m.add(1, 'hours');
		passedHours++;
	}
}
