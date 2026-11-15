import type { Preview } from '@storybook/preact';

import 'emoji-mart/css/emoji-mart.css';
import '../src/styles/index.scss';

const preview: Preview = {
	parameters: {
		layout: 'fullscreen',
	},
};

export default preview;
