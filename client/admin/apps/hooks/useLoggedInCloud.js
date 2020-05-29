import { useEffect, useState } from 'react';

import { useMethod } from '../../../contexts/ServerContext';

export const useLoggedInCloud = () => {
	const [isLoggedIn, setIsLoggedIn] = useState();

	const getLoggedInCloud = useMethod('cloud:checkUserLoggedIn');
	useEffect(() => {
		(async () => setIsLoggedIn(await getLoggedInCloud()))();
	}, []);

	return isLoggedIn;
};
