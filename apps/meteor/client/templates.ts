import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('omnichannelFlex', () => import('./views/omnichannel/sidebar/OmnichannelSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ConnectedModalBlock'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

createTemplateForComponent('loggedOutBanner', () => import('../ee/client/components/deviceManagement/LoggedOutBanner'), {
	renderContainerView: () => HTML.DIV({ style: 'max-width: 520px; margin: 0 auto;' }),
});

// TODO: Remove those after threads Message/Pinned/Starred/Audit are migrated to React

createTemplateForComponent('Blocks', () => import('./views/blocks/MessageBlock'));

createTemplateForComponent('messageLocation', () => import('./views/location/MessageLocation'));

createTemplateForComponent('MessageActions', () => import('./components/message/MessageActions'));

createTemplateForComponent('reactAttachments', () => import('./components/message/Attachments'));

createTemplateForComponent('ThreadMetric', () => import('./components/message/Metrics/Thread'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'min-height: 36px;',
		}),
});

createTemplateForComponent('DiscussionMetric', () => import('./components/message/Metrics/Discussion'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'min-height: 36px;',
		}),
});

createTemplateForComponent('BroadCastMetric', () => import('./components/message/Metrics/Broadcast'));
