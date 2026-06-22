import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';

const expectedTimingLabels = [
	'12AM-1AM',
	'1AM-2AM',
	'2AM-3AM',
	'3AM-4AM',
	'4AM-5AM',
	'5AM-6AM',
	'6AM-7AM',
	'7AM-8AM',
	'8AM-9AM',
	'9AM-10AM',
	'10AM-11AM',
	'11AM-12PM',
];

describe('getMomentChartLabelsAndData', () => {
	it('should create timing labels from midnight to noon', () => {
		const [timingLabels] = getMomentChartLabelsAndData(12 * 60 * 60 * 1000);
		expect(timingLabels).toStrictEqual(expectedTimingLabels);
	});
});
