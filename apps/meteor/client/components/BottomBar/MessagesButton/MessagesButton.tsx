import React from 'react';
import { Icon } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useRoute } from '../../../contexts/RouterContext';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

type Props = {};

function MessagesButton({}: Props) {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/messages');
	});
	return <Icon name='balloons' size='x32' onClick={handleRoute} />;
}

export default MessagesButton;
