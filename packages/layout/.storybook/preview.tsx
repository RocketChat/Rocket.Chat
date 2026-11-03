import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';
import { Suspense } from 'react';

import DarkModeProvider from '../src/DarkModeProvider';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [
		...decorators,
		(Story) => {
			const dark = useDarkMode();

			return (
				<Suspense fallback={null}>
					<DarkModeProvider forcedDarkMode={dark}>
						<Story />
					</DarkModeProvider>
				</Suspense>
			);
		},
	],
	tags: ['autodocs'],
};

export default preview;
