/* eslint-env mocha */
import { expect } from 'chai';

import { filterAppsByText } from '../../../../../../../client/views/admin/apps/helpers/filterAppsByText';

describe('filterAppsByText', () => {
	it('should return true if the text is the name of an app', () => {
		const app = {
			name: 'name1',
		};
		const text = 'name1';
		const result = filterAppsByText(app.name, text);
		expect(result).to.be.true;
	});
	it('should return false if the text is not the name of an app', () => {
		const app = {
			name: 'name1',
		};
		const text = 'name2';
		const result = filterAppsByText(app.name, text);
		expect(result).to.be.false;
	});
});
