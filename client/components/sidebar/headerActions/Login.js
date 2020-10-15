import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import { useSessionDispatch } from '../../../contexts/SessionContext';

const Login = (props) => {
	const setForceLogin = useSessionDispatch('forceLogin');

	return <Sidebar.TopBar.Action {...props} primary ghost={false} icon='arrow-down-box' onClick={() => setForceLogin(true)}/>;
};

export default Login;
