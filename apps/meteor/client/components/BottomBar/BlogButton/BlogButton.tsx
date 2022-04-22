import { Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React, { ReactElement } from 'react';

const BlogButton = (): ReactElement => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/blogs');
	});
	return <Icon name='image' size='x32' onClick={handleRoute} />;
};

export default BlogButton;
