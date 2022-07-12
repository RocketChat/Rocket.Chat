import { expect } from 'chai';

import { getExtension } from '../../../app/utils/lib/mimeTypes';

describe('mimeTypes', () => {
	describe('#getExtension()', () => {
		it('should return an empty string if the given param is an invalid mime type', () => {
			expect(getExtension('invalid-mime')).to.be.equal('');
		});

		it('should return the correct extension when the mime type is valid', () => {
			expect(getExtension('image/png')).to.be.equal('png');
		});
	});
});
