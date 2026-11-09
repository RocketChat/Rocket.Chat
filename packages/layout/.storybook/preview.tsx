import { parameters, decorators, useThemeMode } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react-webpack5';
import { Suspense } from 'react';

import DarkModeProvider from '../src/DarkModeProvider';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [
		...decorators,
		(Story, { globals }) => {
			const dark = useThemeMode(globals.theme) === 'dark';

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
