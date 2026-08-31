import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator } from '@storybook/react';

import ModalContextMock from '../client/stories/contexts/ModalContextMock';
import RouterContextMock from '../client/stories/contexts/RouterContextMock';
import ServerContextMock from '../client/stories/contexts/ServerContextMock';
import TranslationContextMock from '../client/stories/contexts/TranslationContextMock';

const MockedAppRoot = mockAppRoot().build();

export const RocketChatDecorator: Decorator = (Story, { parameters }) => (
	<MockedAppRoot>
		<ServerContextMock {...parameters.serverContext}>
			<TranslationContextMock {...parameters.translationContext}>
				<ModalContextMock {...parameters.modalContext}>
					<RouterContextMock {...parameters.routerContext}>
						<div className='color-primary-font-color rcx-content--main'>
							<Story />
						</div>
					</RouterContextMock>
				</ModalContextMock>
			</TranslationContextMock>
		</ServerContextMock>
	</MockedAppRoot>
);
