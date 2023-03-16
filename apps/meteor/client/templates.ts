import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from './lib/portals/createTemplateForComponent';

createTemplateForComponent('EmojiPickerWrapper', () => import('./views/composer/EmojiPickerWrapper'), {
	renderContainerView: () => HTML.DIV({ class: 'emoji-picker rc-popover__content' }),
});
