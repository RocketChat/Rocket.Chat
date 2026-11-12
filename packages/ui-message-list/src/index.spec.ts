import * as pkg from '.';
import * as contexts from './Message/contexts';

it('exports the contexts and hooks (R6)', () => {
	for (const name of [
		'MessageDisplayContext',
		'MessageNavigationContext',
		'MessageInteractionsContext',
		'MessageToolbarContext',
		'MessageRenderersContext',
		'MessageRelatedDataContext',
		'MessageContentContext',
		'MessageMediaContext',
		'MessageSelectionContext',
		'MessageEditingContext',
		'useMessageDisplay',
		'useMessageNavigation',
		'useMessageInteractions',
		'useMessageToolbar',
		'useMessageRenderers',
		'useMessageRelatedData',
		'useMessageContent',
		'useMessageMedia',
		'useIsMessageBeingEdited',
		'useIsSelectingMessages',
		'useIsMessageSelected',
		'useToggleMessageSelection',
		'createMessageSelectionStore',
	]) {
		expect(pkg).toHaveProperty(name);
	}

	expect(Object.keys(pkg)).toEqual(expect.arrayContaining(Object.keys(contexts)));
});
