import { DecoratorFunction } from '@storybook/addons';
import React, { ReactElement } from 'react';

import { MeteorProviderMock } from './mocks/providers';
import QueryClientProviderMock from './mocks/providers/QueryClientProviderMock';
import ServerProviderMock from './mocks/providers/ServerProviderMock';

export const rocketChatDecorator: DecoratorFunction<ReactElement<unknown>> = (fn, { parameters }) => {
	const linkElement = document.getElementById('theme-styles') || document.createElement('link');
	if (linkElement.id !== 'theme-styles') {
		require('../app/theme/client/main.css');
		require('../app/theme/client/vendor/fontello/css/fontello.css');
		require('../app/theme/client/rocketchat.font.css');
		linkElement.setAttribute('id', 'theme-styles');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('href', 'https://open.rocket.chat/theme.css');
		document.head.appendChild(linkElement);
	}

	/* eslint-disable @typescript-eslint/no-var-requires */
	/* eslint-disable-next-line */
	const { default: icons } = require('!!raw-loader!../private/public/icons.svg');

	return (
		<QueryClientProviderMock>
			<ServerProviderMock {...parameters.serverContext}>
				<MeteorProviderMock>
					<style>{`
					body {
						background-color: white;
					}
				`}</style>
					<div dangerouslySetInnerHTML={{ __html: icons }} />
					<div className='color-primary-font-color'>{fn()}</div>
				</MeteorProviderMock>
			</ServerProviderMock>
		</QueryClientProviderMock>
	);
};
