import React from 'react';
import { Icon } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useRoute } from '../../../contexts/RouterContext';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

type Props = {};

const HomeButton = ({}: Props) => {
	const handleRoute = useMutableCallback(() => {
		FlowRouter.go('/home');
	});

	return <Icon name='home' size='x32' onClick={handleRoute} />;
};

export default HomeButton;
