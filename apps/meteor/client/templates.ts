import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

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

createTemplateForComponent(
	'Checkbox',
	async (): Promise<{ default: typeof import('@rocket.chat/fuselage').CheckBox }> => {
		const { CheckBox } = await import('@rocket.chat/fuselage');
		return { default: CheckBox };
	},
	{
		attachment: 'at-parent',
	},
);

createTemplateForComponent('UnreadMessagesIndicator', () => import('./views/room/components/body/UnreadMessagesIndicator'), {
	attachment: 'at-parent',
});

createTemplateForComponent('UploadProgressIndicator', () => import('./views/room/components/body/UploadProgressIndicator'), {
	attachment: 'at-parent',
});

createTemplateForComponent('messageLocation', () => import('./views/location/MessageLocation'));

createTemplateForComponent('sidebarHeader', () => import('./sidebar/header'));

createTemplateForComponent('sidebarChats', () => import('./sidebar/RoomList/index'), {
	renderContainerView: () =>
		HTML.DIV({
			style: 'display: flex; flex: 1 1 100%;',
		}),
});

createTemplateForComponent('omnichannelFlex', () => import('./views/omnichannel/sidebar/OmnichannelSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('loginLayoutHeader', () => import('./views/login/LoginLayout/Header'));

createTemplateForComponent('loginLayoutFooter', () => import('./views/login/LoginLayout/Footer'));

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ConnectedModalBlock'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

createTemplateForComponent('Blocks', () => import('./views/blocks/MessageBlock'));

createTemplateForComponent('adminFlex', () => import('./views/admin/sidebar/AdminSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('accountFlex', () => import('./views/account/AccountSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }),
});

createTemplateForComponent('sidebarFooter', () => import('./sidebar/footer'));

createTemplateForComponent('loggedOutBanner', () => import('../ee/client/components/deviceManagement/LoggedOutBanner'), {
	renderContainerView: () => HTML.DIV({ style: 'max-width: 520px; margin: 0 auto;' }),
});
