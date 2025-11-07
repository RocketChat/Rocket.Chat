import { usePermission } from '@rocket.chat/ui-contexts';

import TagsPage from './TagsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const TagsRoute = () => {
	const canViewTags = usePermission('manage-livechat-tags');

	if (!canViewTags) {
		return <NotAuthorizedPage />;
	}

	return <TagsPage />;
};

export default TagsRoute;
