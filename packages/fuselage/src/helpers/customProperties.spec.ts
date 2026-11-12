import { customProperties } from './customProperties';

describe('customProperties', () => {
	it('returns the values as the style of the element', () => {
		expect(customProperties({ '--rcx-skeleton-width': '20rem', '--rcx-throbber-delay': 0.2 })).toEqual({
			style: { '--rcx-skeleton-width': '20rem', '--rcx-throbber-delay': '0.2' },
		});
	});

	it('leaves out the undefined ones', () => {
		expect(customProperties({ '--rcx-skeleton-width': undefined })).toEqual({ style: {} });
	});
});
