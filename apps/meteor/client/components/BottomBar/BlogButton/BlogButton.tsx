import React from 'react';
import { Icon } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useRoute } from '../../../contexts/RouterContext';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

type Props = {};

const BlogButton = (props: Props) => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/blogs');
	});
	return <Icon name='image' size='x32' onClick={handleRoute} />;
};

export default BlogButton;
