import { download, downloadAs, downloadCsvAs, downloadJsonAs } from './download';

describe('download', () => {
	it('should work', () => {
		const listener = jest.fn();
		document.addEventListener('click', listener, false);

		download('about:blank', 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).toHaveBeenCalled();
	});
});

describe('downloadAs', () => {
	it('should work', () => {
		const listener = jest.fn();
		document.addEventListener('click', listener, false);

		downloadAs({ data: [] }, 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).toHaveBeenCalled();
	});
});

describe('downloadJsonAs', () => {
	it('should work', () => {
		const listener = jest.fn();
		document.addEventListener('click', listener, false);

		downloadJsonAs({}, 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).toHaveBeenCalled();
	});
});

describe('downloadCsvAs', () => {
	it('should work', () => {
		const listener = jest.fn();
		document.addEventListener('click', listener, false);

		downloadCsvAs(
			[
				[1, 2, 3],
				[4, 5, 6],
			],
			'blank',
		);

		document.removeEventListener('click', listener, false);
		expect(listener).toHaveBeenCalled();
	});
});
