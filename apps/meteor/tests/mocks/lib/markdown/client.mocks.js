import { loadWithMocks } from '../../utils/loadWithMocks';

const mocks = {
	'@rocket.chat/random': {
		'Random': {
			id() {
				return Math.random().toString().replace('0.', 'A');
			},
		},
		'@global': true,
	},
};

export const { Markdown } = loadWithMocks('../../../../lib/markdown/markdown', mocks);
export const { original } = loadWithMocks('../../../../lib/markdown/parser/original/original', mocks);
export const { filtered } = loadWithMocks('../../../../lib/markdown/parser/filtered/filtered', mocks);
