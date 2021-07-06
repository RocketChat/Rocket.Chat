import React, { ReactElement } from 'react';

import { MeteorProviderMock } from './mocks/providers';

export const rocketChatDecorator = (storyFn: () => ReactElement): ReactElement => {
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

	return <MeteorProviderMock>
		<style>{`
			body {
				background-color: white;
			}
		`}</style>
		<div dangerouslySetInnerHTML={{ __html: icons }} />
		<div className='color-primary-font-color'>
			{storyFn()}
		</div>
	</MeteorProviderMock>;
};

export const fullHeightDecorator = (storyFn: () => ReactElement): ReactElement =>
	<div style={{
		display: 'flex',
		flexDirection: 'column',
		maxHeight: '100vh',
	}}>
		{storyFn()}
	</div>;

export const centeredDecorator = (storyFn: () => ReactElement): ReactElement =>
	<div style={{
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '100vh',
	}}>
		{storyFn()}
	</div>;
