import { useState, useEffect } from 'react';

import { isEnterprise } from '../../app/license/client';

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
