import { mock } from 'node:test';

mock.module('@rocket.chat/random', {
	exports: {
		Random: {
			id() {
				return Math.random().toString().replace('0.', 'A');
			},
		},
	},
});

export const { Markdown } = require('../../../../lib/markdown/markdown');
export const { original } = require('../../../../lib/markdown/parser/original/original');
export const { filtered } = require('../../../../lib/markdown/parser/filtered/filtered');
