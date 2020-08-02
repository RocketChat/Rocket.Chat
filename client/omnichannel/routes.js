import { FlowRouter } from 'meteor/kadira:flow-router';

import { renderRouteComponent, createTemplateForComponent } from '../reactAdapters';

createTemplateForComponent('omnichannelFlex', () => import('./sidebar/OmnichannelSidebar'));

const routeGroup = FlowRouter.group({
	name: 'omnichannel',
	prefix: '/omnichannel',
});

export const registerOmnichannelRoute = (path, { lazyRouteComponent, props, action, ...options } = {}) => {
	routeGroup.route(path, {
		...options,
		action: (params, queryParams) => {
			if (action) {
				action(params, queryParams);
				return;
			}

			renderRouteComponent(() => import('./OmnichannelRouter'), {
				template: 'main',
				region: 'center',
				propsFn: () => ({ lazyRouteComponent, ...options, params, queryParams, ...props }),
			});
		},
	});
};

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
});
