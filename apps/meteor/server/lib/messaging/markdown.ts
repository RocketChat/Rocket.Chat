import { createMarkdownMessageRenderer, createMarkdownNotificationRenderer } from '../../../lib/markdown/markdown';
import { callbacks } from '../callbacks';
import { getWorkspaceURL } from '../utils/getURL';

export { Markdown } from '../../../lib/markdown/markdown';

export const registerMarkdownRenderers = (): void => {
	const renderMessage = createMarkdownMessageRenderer({ rootUrl: `${getWorkspaceURL()}/` });
	callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'markdown');

	const renderNotification = createMarkdownNotificationRenderer();
	callbacks.add('renderNotification', renderNotification, callbacks.priority.HIGH, 'filter-markdown');
};
