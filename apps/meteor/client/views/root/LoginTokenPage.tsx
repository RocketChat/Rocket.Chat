import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import React, { ReactElement, useEffect } from 'react';

import PageLoading from './PageLoading';

const LoginTokenPage = (): ReactElement => {
	const token = useRouteParameter('token');
	const homeRoute = useRoute('home');

	useEffect(() => {
		Accounts.callLoginMethod({
			methodArguments: [
				{
					loginToken: token,
				},
			],
			userCallback(error) {
				console.error(error);
				homeRoute.push();
			},
		});
	}, [homeRoute, token]);

	return <PageLoading />;
};

export default LoginTokenPage;
