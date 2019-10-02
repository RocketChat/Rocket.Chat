import { action } from '@storybook/addon-actions';
import '@rocket.chat/icons/dist/font/RocketChat.minimal.css';
import React from 'react';

import '../app/theme/client/main.css';
import { ConnectionStatusProvider } from '../client/components/providers/ConnectionStatusProvider.mock';
import { TranslationProvider } from '../client/components/providers/TranslationProvider.mock';

export const rocketChatWrapper = (fn) =>
	<ConnectionStatusProvider connected status='connected' reconnect={action('reconnect')}>
		<TranslationProvider>
			<style>{`
				body {
					background-color: white;
				}

				.global-font-family {
					font-family:
						-apple-system,
						BlinkMacSystemFont,
						'Segoe UI',
						Roboto,
						Oxygen,
						Ubuntu,
						Cantarell,
						'Helvetica Neue',
						'Apple Color Emoji',
						'Segoe UI Emoji',
						'Segoe UI Symbol',
						'Meiryo UI',
						Arial,
						sans-serif;
				}

				.color-primary-font-color {
					color: #444;
				}
			`}</style>
			<div className='global-font-family color-primary-font-color'>
				{fn()}
			</div>
		</TranslationProvider>
</ConnectionStatusProvider>;
