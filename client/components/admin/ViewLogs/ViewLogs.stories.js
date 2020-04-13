import React from 'react';

import { Mailer, ViewLogs } from '.';

export default {
	title: 'admin/pages/ViewLogs',
	component: Mailer,
	// decorators: [
	//  (storyFn) => <SettingsState>
	//      {storyFn()}
	//  </SettingsState>,
	// ],
};

export const _default = () =>
	<ViewLogs />;
