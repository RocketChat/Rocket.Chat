import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import TagsPage from './TagsPage';

const TagsRoute = () => {
	const canViewTags = usePermission('manage-livechat-tags');

	if (!canViewTags) {
		return <NotAuthorizedPage />;
	}

	return <TagsPage />;
};

export default TagsRoute;
