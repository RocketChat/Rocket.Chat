import type { DecoratorFunction } from '@storybook/addons';
import type { ReactElement } from 'react';
import React from 'react';

import ModalContextMock from '../client/stories/contexts/ModalContextMock';
import RouterContextMock from '../client/stories/contexts/RouterContextMock';
import ServerContextMock from '../client/stories/contexts/ServerContextMock';
import TranslationContextMock from '../client/stories/contexts/TranslationContextMock';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import '../app/theme/client/main.css';

export const rocketChatDecorator: DecoratorFunction<ReactElement<unknown>> = (fn, { parameters }) => {
	return (
		<ServerContextMock {...parameters.serverContext}>
			<TranslationContextMock {...parameters.translationContext}>
				<ModalContextMock {...parameters.modalContext}>
					<RouterContextMock {...parameters.routerContext}>
						<style>{`
								body {
									background-color: white;
								}
							`}</style>
						<div className='color-primary-font-color'>{fn()}</div>
					</RouterContextMock>
				</ModalContextMock>
			</TranslationContextMock>
		</ServerContextMock>
	);
};
