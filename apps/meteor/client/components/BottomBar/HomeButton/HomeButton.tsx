import { Icon } from '@rocket.chat/fuselage';

import { FlowRouter } from 'meteor/kadira:flow-router';

import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import React, { ReactElement } from 'react';

const HomeButton = (): ReactElement => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/home');
	});

	return <Icon name='home' size='x32' onClick={handleRoute} />;
};

export default HomeButton;
