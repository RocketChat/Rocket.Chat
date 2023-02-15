import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('ModalBlock', () => import('./views/blocks/ConnectedModalBlock'), {
	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
});

// createTemplateForComponent('EmojiPickerWrapper', () => import('./views/composer/EmojiPickerWrapper'), {
// 	renderContainerView: () => HTML.DIV({ style: 'display: flex; width: 100%; height: 100%;' }),
// });

createTemplateForComponent('EmojiPickerWrapper', () => import('./views/composer/EmojiPickerWrapper'), {
	renderContainerView: () => HTML.DIV({ class: 'emoji-picker rc-popover__content' }),
});
