import React from 'react';

import GroupPage from './GroupPage';

export default {
	title: 'admin/settings/GroupPage',
	component: GroupPage,
};

export const _default = () => <GroupPage />;

export const withGroup = () => <GroupPage _id='General' i18nLabel='General' />;

export const skeleton = () => <GroupPage.Skeleton />;
