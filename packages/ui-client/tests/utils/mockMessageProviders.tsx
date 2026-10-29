import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ReactNode } from 'react';

import type {
	MessageContentContextValue,
	MessageDisplayContextValue,
	MessageInteractionsContextValue,
	MessageMediaContextValue,
	MessageNavigationContextValue,
	MessageRelatedDataContextValue,
	MessageRenderersContextValue,
	MessageSelectionStore,
	MessageToolbarContextValue,
} from '../../src/components/Message/contexts';
import {
	MessageContentContext,
	MessageDisplayContext,
	MessageEditingContext,
	MessageInteractionsContext,
	MessageMediaContext,
	MessageNavigationContext,
	MessageRelatedDataContext,
	MessageRenderersContext,
	MessageSelectionContext,
	MessageToolbarContext,
	messageContentDefaultValue,
	messageDisplayDefaultValue,
	messageInteractionsDefaultValue,
	messageMediaDefaultValue,
	messageNavigationDefaultValue,
	messageRelatedDataDefaultValue,
	messageRenderersDefaultValue,
	messageToolbarDefaultValue,
} from '../../src/components/Message/contexts';

type Spied<T> = { [K in keyof T]: T[K] extends (...args: infer A) => infer R ? jest.Mock<R, A> & T[K] : T[K] };

const spyOn = <T extends object>(value: T): Spied<T> =>
	Object.fromEntries(
		Object.entries(value).map(([key, capability]) => [key, typeof capability === 'function' ? jest.fn(capability) : capability]),
	) as Spied<T>;

export type MockMessageProvidersOptions = {
	display?: Partial<MessageDisplayContextValue>;
	navigation?: Partial<MessageNavigationContextValue>;
	interactions?: Partial<MessageInteractionsContextValue>;
	toolbar?: Partial<MessageToolbarContextValue>;
	renderers?: Partial<MessageRenderersContextValue>;
	relatedData?: Partial<MessageRelatedDataContextValue>;
	content?: Partial<MessageContentContextValue>;
	media?: Partial<MessageMediaContextValue>;
	selection?: MessageSelectionStore;
	editingMessageId?: string;
	root?: ReturnType<typeof mockAppRoot>;
};

/**
 * Wraps a message component in every message context, with each navigation and interaction capability replaced by a
 * `jest.fn` that the test can assert on.
 */
export const mockMessageProviders = ({
	display,
	navigation,
	interactions,
	toolbar,
	renderers,
	relatedData,
	content,
	media,
	selection,
	editingMessageId,
	root = mockAppRoot(),
}: MockMessageProvidersOptions = {}) => {
	const spies = {
		navigation: spyOn({ ...messageNavigationDefaultValue, ...navigation }),
		interactions: spyOn({ ...messageInteractionsDefaultValue, ...interactions }),
	};

	const wrapper = root
		.wrap((children: ReactNode) => (
			<MessageDisplayContext.Provider value={{ ...messageDisplayDefaultValue, ...display }}>
				<MessageNavigationContext.Provider value={spies.navigation}>
					<MessageInteractionsContext.Provider value={spies.interactions}>
						<MessageToolbarContext.Provider value={{ ...messageToolbarDefaultValue, ...toolbar }}>
							<MessageRenderersContext.Provider value={{ ...messageRenderersDefaultValue, ...renderers }}>
								<MessageRelatedDataContext.Provider value={{ ...messageRelatedDataDefaultValue, ...relatedData }}>
									<MessageContentContext.Provider value={{ ...messageContentDefaultValue, ...content }}>
										<MessageMediaContext.Provider value={{ ...messageMediaDefaultValue, ...media }}>
											<MessageSelectionContext.Provider value={selection}>
												<MessageEditingContext.Provider value={editingMessageId}>{children}</MessageEditingContext.Provider>
											</MessageSelectionContext.Provider>
										</MessageMediaContext.Provider>
									</MessageContentContext.Provider>
								</MessageRelatedDataContext.Provider>
							</MessageRenderersContext.Provider>
						</MessageToolbarContext.Provider>
					</MessageInteractionsContext.Provider>
				</MessageNavigationContext.Provider>
			</MessageDisplayContext.Provider>
		))
		.build();

	return { wrapper, ...spies };
};
