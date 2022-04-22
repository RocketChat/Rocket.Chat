import { Icon } from '@rocket.chat/fuselage';

import { FlowRouter } from 'meteor/kadira:flow-router';

import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import React, { ReactElement } from 'react';

function MessagesButton(): ReactElement {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/messages');
	});
	return <Icon name='balloons' size='x32' onClick={handleRoute} />;
}

export default MessagesButton;
