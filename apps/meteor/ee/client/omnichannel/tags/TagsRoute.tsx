import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import TagsPage from './TagsPage';

const TagsRoute = () => {
	const canViewTags = usePermission('manage-livechat-tags');

	if (!canViewTags) {
		return <NotAuthorizedPage />;
	}

	return <TagsPage />;
};

export default TagsRoute;
