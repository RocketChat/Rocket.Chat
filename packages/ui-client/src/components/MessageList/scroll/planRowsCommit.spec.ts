import { planRowsCommit } from './planRowsCommit';

const keys = (value: string) => value.split('');

describe('planRowsCommit', () => {
	it('should render rows added at the start in shift mode', () => {
		expect(planRowsCommit(keys('cde'), keys('abcde'))).toEqual({ change: 'prepend', renderedLength: 5, shift: true });
	});

	it('should render rows added at the end without shift mode', () => {
		expect(planRowsCommit(keys('cde'), keys('cdef'))).toEqual({ change: 'append', renderedLength: 4, shift: false });
	});

	it('should stage rows added at both ends: the start first, in shift mode', () => {
		const first = planRowsCommit(keys('cde'), keys('abcdefg'));
		expect(first).toEqual({ change: 'prepend', renderedLength: 5, shift: true });

		const second = planRowsCommit(keys('abcde'), keys('abcdefg'));
		expect(second).toEqual({ change: 'append', renderedLength: 7, shift: false });
	});

	it('should render other changes at once without shift mode', () => {
		expect(planRowsCommit(keys('abc'), keys('xyz'))).toEqual({ change: 'replace', renderedLength: 3, shift: false });
		expect(planRowsCommit(keys('abcd'), keys('abxd'))).toEqual({ change: 'reorder', renderedLength: 4, shift: false });
	});
});
