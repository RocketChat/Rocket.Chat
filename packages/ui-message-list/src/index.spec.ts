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

it('exports the content parts under their prefixed names (R25)', () => {
	for (const name of [
		'MessageLocation',
		'MessageReactionList',
		'MessageActionLinks',
		'MessageUrlPreviews',
		'MessageThreadMetrics',
		'MessageThreadMetricsFollow',
		'MessageThreadMetricsParticipants',
		'MessageThreadMetricsUnreadBadge',
		'MessageDiscussionMetrics',
		'MessageBroadcastMetrics',
		'MessageCollapsible',
		'MessageContentBody',
		'MessageContentFallback',
		'IgnoredContent',
	]) {
		expect(pkg).toHaveProperty(name);
	}
});

it('exports the attachments (message-attachments R12)', () => {
	for (const name of ['MessageAttachments', 'MessageQuoteAttachment', 'MessageMapView', 'useMediaReloadOnError']) {
		expect(pkg).toHaveProperty(name);
	}
});

it('exports the toolbar holder and the toolbar context (message-toolbar R27)', () => {
	for (const name of ['MessageToolbarHolder', 'MessageToolbarContext', 'messageToolbarDefaultValue', 'useMessageToolbar']) {
		expect(pkg).toHaveProperty(name);
	}
});

it('exports the parts of a message row (message-variants R51)', () => {
	for (const name of ['RoomMessage', 'MessageHeader', 'StatusIndicators', 'ReadReceiptIndicator', 'MessageRoles']) {
		expect(pkg).toHaveProperty(name);
	}
});
