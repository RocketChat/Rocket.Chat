import { action } from '@storybook/addon-actions';
import { withKnobs }from '@storybook/addon-knobs';
import { MINIMAL_VIEWPORTS, INITIAL_VIEWPORTS } from '@storybook/addon-viewport/dist/defaults';
import { addDecorator, addParameters, configure } from '@storybook/react';
import React from 'react';

import { ConnectionStatusProvider } from '../client/components/providers/ConnectionStatusProvider.mock';
import { TranslationProvider } from '../client/components/providers/TranslationProvider.mock';

addParameters({
	viewport: {
		viewports: {
			...MINIMAL_VIEWPORTS,
			...INITIAL_VIEWPORTS,
		},
		defaultViewport: 'responsive',
	},
})

addDecorator(function RocketChatDecorator(fn) {
	const linkElement = document.getElementById('theme-styles') || document.createElement('link');
	if (linkElement.id !== 'theme-styles') {
		require('../app/theme/client/main.css');
		require('../client/RocketChat.font.css');
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
				<div dangerouslySetInnerHTML={{ __html: require('!!raw-loader!../private/public/icons.svg').default }} />
				<div className='global-font-family color-primary-font-color'>
					{fn()}
				</div>
			</div>
		</TranslationProvider>
	</ConnectionStatusProvider>;
});

addDecorator(withKnobs);

configure(require.context('../client', true, /\.stories\.js$/), module);
