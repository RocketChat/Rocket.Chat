/* eslint-env mocha */
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import { waitForElement } from '../../../../client/lib/utils/waitForElement';

describe('waitUntilWrapperExists', () => {
	const globalDocument = global.document;
	const mutationObserver = global.MutationObserver;

	beforeEach(() => {
		const dom = new JSDOM(
			`<html>
				<body>
					<span class="ready" />
				</body>
			</html>`,
			{ url: 'http://localhost' },
		);
		global.document = dom.window.document;
		global.MutationObserver = dom.window.MutationObserver;
	});

	afterEach(() => {
		global.document = globalDocument;
		global.MutationObserver = mutationObserver;
	});

	it('should return the element when it is already in the dom', async () => {
		expect(await waitForElement('.ready')).to.be.equal(document.querySelector('.ready'));
	});

	it('should await until the element be in the dom and return it', async () => {
		setTimeout(() => {
			const element = document.createElement('div');
			element.setAttribute('class', 'not-ready');
			document.body.appendChild(element);
		}, 5);
		expect(await waitForElement('.not-ready')).to.be.equal(document.querySelector('.not-ready'));
	});
});
