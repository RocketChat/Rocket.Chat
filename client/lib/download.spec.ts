import 'jsdom-global/register';
import chai from 'chai';
import chaiSpies from 'chai-spies';
import { describe, it } from 'mocha';

import { withBlobUrls } from '../../tests/utils/client/withBlobUrls';
import { download, downloadAs, downloadCsvAs, downloadJsonAs } from './download';

chai.use(chaiSpies);

describe('download', () => {
	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		download('about:blank', 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});

describe('downloadAs', () => {
	withBlobUrls();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadAs({ data: [] }, 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});

describe('downloadJsonAs', () => {
	withBlobUrls();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadJsonAs({}, 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});

describe('downloadCsvAs', () => {
	withBlobUrls();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadCsvAs(
			[
				[1, 2, 3],
				[4, 5, 6],
			],
			'blank',
		);

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});
