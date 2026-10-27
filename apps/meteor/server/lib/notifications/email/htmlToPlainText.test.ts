import { describe, it } from 'node:test';

import { expect } from 'chai';

import { htmlToPlainText } from './htmlToPlainText';

describe('htmlToPlainText', () => {
	it('should keep the text of the html', () => {
		expect(htmlToPlainText('<p>admin sent you a message</p>')).to.equal('admin sent you a message');
	});

	it('should keep the address of a link next to its label', () => {
		expect(
			htmlToPlainText(
				'<p>admin sent you a message</p><p><a class="btn" href="https://open.example.com/direct/abc?msg=xyz">GO TO MESSAGE</a></p>',
			),
		).to.include('GO TO MESSAGE (https://open.example.com/direct/abc?msg=xyz)');
	});
});
