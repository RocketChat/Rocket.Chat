import { action } from '@storybook/addon-actions';
import { addDecorator, configure } from '@storybook/react';
import React from 'react';

import { ConnectionStatusProvider } from '../client/components/providers/ConnectionStatusProvider.mock';
import { TranslationProvider } from '../client/components/providers/TranslationProvider.mock';

addDecorator(function RocketChatDecorator(fn) {
	require('@rocket.chat/icons/dist/font/RocketChat.minimal.css');
	require('../app/theme/client/main.css');

	const linkElement = document.getElementById('theme-styles') || document.createElement('link');
	if (linkElement.id !== 'theme-styles') {
		linkElement.setAttribute('id', 'theme-styles');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('href', 'https://open.rocket.chat/theme.css');
		document.head.appendChild(linkElement);
	}

	return <ConnectionStatusProvider connected status='connected' reconnect={action('reconnect')}>
		<TranslationProvider>
			<style>{`
				body {
					background-color: white;
				}
			`}</style>
			<div className='rc-old'>
				<div dangerouslySetInnerHTML={{__html: require('!!raw-loader!../private/public/icons.svg').default}} />
				<div className='global-font-family color-primary-font-color'>
					{fn()}
				</div>
			</div>
		</TranslationProvider>
	</ConnectionStatusProvider>;
});

configure(require.context('../client', true, /\.stories\.js$/), module);
