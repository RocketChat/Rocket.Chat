import 'emoji-mart/css/emoji-mart.css';
import '../src/styles/index.scss';

export const parameters = {
	grid: {
		cellSize: 4,
	},
	options: {
		storySort: ([, a], [, b]) => a.kind.localeCompare(b.kind),
	},
};
