import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import '../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators],
};

export default preview;
