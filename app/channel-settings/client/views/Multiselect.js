import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../../../client/lib/portals/createTemplateForComponent';

createTemplateForComponent(
	'Multiselect',
	() => import('../../../../client/admin/settings/inputs/MultiSelectSettingInput'),
	{
		// eslint-disable-next-line new-cap
		renderContainerView: () => HTML.DIV({ class: 'rc-multiselect', style: 'display: flex;' }),
	},
);
