import { HTML } from 'meteor/htmljs';

import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent(
	'Multiselect',
	() => import('../../../../client/components/admin/settings/inputs/MultiSelectSettingInput'),
	{
		// eslint-disable-next-line new-cap
		renderContainerView: () => HTML.DIV({ className: 'rc-multiselect', style: 'display: flex;' }),
	},
);
