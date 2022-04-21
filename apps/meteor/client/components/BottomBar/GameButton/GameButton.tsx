import React from 'react';
import { Icon } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useRoute } from '../../../contexts/RouterContext';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

type Props = {};

const GameButton = (props: Props) => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/games');
	});

	return <Icon name='joystick' size='x32' onClick={handleRoute} />;
};

export default GameButton;
