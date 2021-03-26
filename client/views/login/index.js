import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../lib/portals/createTemplateForComponent';

createTemplateForComponent('resetPassword', () => import('./ResetPassword/ResetPassword'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ style: 'display: flex;' }),
});
