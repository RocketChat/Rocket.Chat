import { useLayoutEffect } from 'react';

import { appLayout } from '../../lib/appLayout';

type AppLayoutProps = {
	template?: string;
	data?: EJSONable;
};

const AppLayout = ({ template, data }: AppLayoutProps): null => {
	useLayoutEffect(() => {
		if (!template) {
			appLayout.reset();
			return;
		}

		appLayout.render(template, data);
	}, [data, template]);

	return null;
};

export default AppLayout;
