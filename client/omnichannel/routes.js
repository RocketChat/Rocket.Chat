import { createTemplateForComponent } from '../reactAdapters';
import { createRouteGroup } from '../helpers/createRouteGroup';

createTemplateForComponent('omnichannelFlex', () => import('./sidebar/OmnichannelSidebar'));

const registerOmnichannelRoute = createRouteGroup('omnichannel', '/omnichannel', () => import('./OmnichannelRouter'));

registerOmnichannelRoute('/installation', {
	name: 'omnichannel-installation',
	lazyRouteComponent: () => import('./installation/Installation'),
});
