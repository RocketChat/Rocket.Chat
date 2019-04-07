/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';

import { merge } from './merge';

describe('Merge', () => {
	it('should merge 3 objects', () => {
		const object = {
			a: [{ b: 2 }, { d: 4 }],
		};

		const other = {
			a: [{ c: 3 }, { e: 5 }],
		};

		const another = {
			a: [{ b: undefined }],
		};

		assert.deepEqual(
			merge(object, other, another),
			{ a: [{ b: undefined, c: 3 }, { d: 4, e: 5 }] }
		);
	});

	it.skip('should remove property', () => {
		const original = {
			msg: 'msg',
			attachments: [{
				title: 'title',
				msg: 'msg',
			}],
			extraField: 1,
		};

		const modifier = {
			msg: 'msg',
			attachments: undefined,
		};

		assert.deepEqual(
			merge(original, modifier),
			{
				msg: 'msg',
				extraField: 1,
			}
		);
	});
});

