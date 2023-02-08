import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ConnectedModalBlock'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

// TODO: Remove those after threads Message/Pinned/Starred/Audit are migrated to React

createTemplateForComponent('Blocks', () => import('./components/message/content/UiKitSurface'));

createTemplateForComponent('messageLocation', () => import('./components/message/content/Location'));

createTemplateForComponent('MessageActions', () => import('./components/message/content/MessageActions'));

createTemplateForComponent('Attachments', () => import('./components/message/content/Attachments'));

createTemplateForComponent('ThreadMetrics', () => import('./components/message/content/ThreadMetrics'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'min-height: 36px;',
		}),
});

createTemplateForComponent('DiscussionMetrics', () => import('./components/message/content/DiscussionMetrics'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'min-height: 36px;',
		}),
});

createTemplateForComponent('BroadcastMetrics', () => import('./components/message/content/BroadcastMetrics'));
