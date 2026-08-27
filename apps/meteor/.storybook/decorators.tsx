import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator } from '@storybook/react';
import { I18nextProvider } from 'react-i18next';

import ModalContextMock from '../client/stories/contexts/ModalContextMock';
import RouterContextMock from '../client/stories/contexts/RouterContextMock';
import ServerContextMock from '../client/stories/contexts/ServerContextMock';
import TranslationContextMock from '../client/stories/contexts/TranslationContextMock';
import { storybookI18n } from '../client/stories/i18n';

const MockedAppRoot = mockAppRoot().build();

/**
 * Puts the real English copy in front of `mockAppRoot`'s empty i18next instance.
 *
 * Innermost on purpose: the nearest `I18nextProvider` is the one a component reads, and `mockAppRoot` installs
 * one of its own. A story that builds its own `mockAppRoot` nests yet another provider inside this, so such
 * stories have to apply the same instance themselves — `withCallProviders` in the conference stories is an
 * example of doing that.
 */
export const RocketChatDecorator: Decorator = (Story, { parameters }) => (
	<MockedAppRoot>
		<ServerContextMock {...parameters.serverContext}>
			<TranslationContextMock {...parameters.translationContext}>
				<ModalContextMock {...parameters.modalContext}>
					<RouterContextMock {...parameters.routerContext}>
						<I18nextProvider i18n={storybookI18n}>
							<div className='color-primary-font-color rcx-content--main'>
								<Story />
							</div>
						</I18nextProvider>
					</RouterContextMock>
				</ModalContextMock>
			</TranslationContextMock>
		</ServerContextMock>
	</MockedAppRoot>
);
