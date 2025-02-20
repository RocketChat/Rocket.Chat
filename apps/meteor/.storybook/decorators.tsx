import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator } from '@storybook/react';

import ModalContextMock from '../client/stories/contexts/ModalContextMock';
import RouterContextMock from '../client/stories/contexts/RouterContextMock';
import ServerContextMock from '../client/stories/contexts/ServerContextMock';
import TranslationContextMock from '../client/stories/contexts/TranslationContextMock';

const MockedAppRoot = mockAppRoot().build();

export const rocketChatDecorator: Decorator = (fn, { parameters }) => {
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
		<MockedAppRoot>
			<ServerContextMock {...parameters.serverContext}>
				<TranslationContextMock {...parameters.translationContext}>
					<ModalContextMock {...parameters.modalContext}>
						<RouterContextMock {...parameters.routerContext}>
							<style>{`
								body {
									background-color: white;
								}
							`}</style>
							<div dangerouslySetInnerHTML={{ __html: icons }} />
							<div className='color-primary-font-color'>{fn()}</div>
						</RouterContextMock>
					</ModalContextMock>
				</TranslationContextMock>
			</ServerContextMock>
		</MockedAppRoot>
	);
};
