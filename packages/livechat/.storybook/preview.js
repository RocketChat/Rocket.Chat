import { addParameters } from '@storybook/react';
import 'emoji-mart/css/emoji-mart.css';
import '../src/styles/index.scss';

addParameters({
	grid: {
		cellSize: 4,
	},
	options: {
		storySort: ([, a], [, b]) => a.kind.localeCompare(b.kind),
	},
});
