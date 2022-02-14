import { actionLinks } from '../../../action-links/client';

actionLinks.register('createLivechatCall', function (message, params, instance) {
	instance.tabBar.open('video');
});
