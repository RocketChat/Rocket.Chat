import { expect, spy } from 'chai';
import { describe, it } from 'mocha';

import { download, downloadAs, downloadCsvAs, downloadJsonAs } from '../../../../client/lib/download';

describe('download', () => {
	it('should work', () => {
		const listener = spy();
		document.addEventListener('click', listener, false);

		download('about:blank', 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).to.have.been.called();
	});
});

describe('downloadAs', () => {
	it('should work', () => {
		const listener = spy();
		document.addEventListener('click', listener, false);

		downloadAs({ data: [] }, 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).to.have.been.called();
	});
});

describe('downloadJsonAs', () => {
	it('should work', () => {
		const listener = spy();
		document.addEventListener('click', listener, false);

		downloadJsonAs({}, 'blank');

		document.removeEventListener('click', listener, false);
		expect(listener).to.have.been.called();
	});
});

describe('downloadCsvAs', () => {
	it('should work', () => {
		const listener = spy();
		document.addEventListener('click', listener, false);

		downloadCsvAs(
			[
				[1, 2, 3],
				[4, 5, 6],
			],
			'blank',
		);

		document.removeEventListener('click', listener, false);
		expect(listener).to.have.been.called();
	});
});
