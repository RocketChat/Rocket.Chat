import { Icon } from '@rocket.chat/fuselage';

import { FlowRouter } from 'meteor/kadira:flow-router';

import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import React, { ReactElement } from 'react';

const GameButton = (): ReactElement => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/games');
	});

	return <Icon name='joystick' size='x32' onClick={handleRoute} />;
};

export default GameButton;
