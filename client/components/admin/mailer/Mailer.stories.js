import React from 'react';

import { GroupPage } from '../settings/GroupPage';

import { Mailer } from '.';

export default {
	title: 'admin/pages/mailer',
	component: Mailer,
	// decorators: [
	// 	(storyFn) => <SettingsState>
	// 		{storyFn()}
	// 	</SettingsState>,
	// ],
};

export const _default = () =>
	<Mailer />;

export const withGroup = () =>
	<GroupPage
		_id='General'
		i18nLabel='General'
	/>;

export const skeleton = () =>
	<GroupPage.Skeleton />;
