import moment from 'moment';

describe('DateRangePicker', () => {
	it('does not override global Moment locale during import', () => {
		const previousLocale = moment.locale();
		try {
			moment.locale('pt-br');
			jest.resetModules();
			require('./DateRangePicker');
			expect(moment.locale()).toBe('pt-br');
		} finally {
			moment.locale(previousLocale);
		}
	});
});
