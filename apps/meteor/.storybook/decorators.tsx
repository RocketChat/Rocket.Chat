import type { Decorator } from '@storybook/react';

import ModalContextMock from '../client/stories/contexts/ModalContextMock';
import RouterContextMock from '../client/stories/contexts/RouterContextMock';
import ServerContextMock from '../client/stories/contexts/ServerContextMock';

export const RocketChatDecorator: Decorator = (Story, { parameters }) => (
	<ServerContextMock {...parameters.serverContext}>
		<ModalContextMock {...parameters.modalContext}>
			<RouterContextMock {...parameters.routerContext}>
				<div className='color-primary-font-color rcx-content--main'>
					<Story />
				</div>
			</RouterContextMock>
		</ModalContextMock>
	</ServerContextMock>
);
