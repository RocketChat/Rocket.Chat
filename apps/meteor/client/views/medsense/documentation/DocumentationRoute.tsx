import { useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { lazy } from 'react';

const DocumentationReviewPage = lazy(() => import('./DocumentationReviewPage'));

const DocumentationRoute = () => {
	const id = useRouteParameter('id');

	if (!id) {
		return null;
	}

	return <DocumentationReviewPage interventionId={id} />;
};

export default DocumentationRoute;
