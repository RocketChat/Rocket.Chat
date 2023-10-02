import { useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useCallback } from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import TagEdit from './TagEdit';
import TagEditWithData from './TagEditWithData';
import TagsPage from './TagsPage';

const TagsRoute = () => {
	const t = useTranslation();
	const reload = useRef(() => null);
	const canViewTags = usePermission('manage-livechat-tags');

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (context === 'edit') {
		return <TagEditWithData reload={handleReload} tagId={id} title={t('Edit_Tag')} />;
	}

	if (context === 'new') {
		return <TagEdit reload={handleReload} title={t('New_Tag')} />;
	}

	if (!canViewTags) {
		return <NotAuthorizedPage />;
	}

	return <TagsPage reload={reload} />;
};

export default TagsRoute;
