import 'jsdom-global/register';
import chai from 'chai';
import chaiSpies from 'chai-spies';
import { after, before, describe, it } from 'mocha';

import { download, downloadAs, downloadCsvAs, downloadJsonAs } from './download';

chai.use(chaiSpies);

const withURL = (): void => {
	let createObjectURL: typeof URL.createObjectURL;
	let revokeObjectURL: typeof URL.revokeObjectURL;

	before(() => {
		const blobs = new Map<string, Blob>();

		createObjectURL = window.URL.createObjectURL;
		revokeObjectURL = window.URL.revokeObjectURL;

		window.URL.createObjectURL = (blob: Blob): string => {
			const uuid = Math.random().toString(36).slice(2);
			const url = `blob://${ uuid }`;
			blobs.set(url, blob);
			return url;
		};

		window.URL.revokeObjectURL = (url: string): void => {
			blobs.delete(url);
		};
	});

	after(() => {
		window.URL.createObjectURL = createObjectURL;
		window.URL.revokeObjectURL = revokeObjectURL;
	});
};

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
	withURL();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadAs({ data: [] }, 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});

describe('downloadJsonAs', () => {
	withURL();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadJsonAs({}, 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});

describe('downloadCsvAs', () => {
	withURL();

	it('should work', () => {
		const listener = chai.spy();
		document.addEventListener('click', listener, false);

		downloadCsvAs([[1, 2, 3], [4, 5, 6]], 'blank');

		document.removeEventListener('click', listener, false);
		chai.expect(listener).to.have.been.called();
	});
});
