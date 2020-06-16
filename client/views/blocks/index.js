import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../reactAdapters';

createTemplateForComponent('ModalBlock', () => import('./ModalBlock'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ class: 'rc-multiselect', style: 'display: flex; width:100%;' }),
});

createTemplateForComponent('Blocks', () => import('./MessageBlock'));
