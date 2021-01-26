import { useState, useEffect } from 'react';

import { isEnterprise } from '../license';

export const useIsEnterprise = () => {
	const [validEnterprise, setValidEnterprise] = useState('loading');

	useEffect(() => {
		isEnterprise().then((enabled) => {
			if (enabled) {
				return setValidEnterprise(true);
			}
			setValidEnterprise(false);
		});
	}, []);

	return validEnterprise;
};
