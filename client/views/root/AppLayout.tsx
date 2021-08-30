import { memo, useLayoutEffect } from 'react';

import { appLayout } from '../../lib/appLayout';

type AppLayoutProps = {
	template?: string;
} & EJSONable;

const AppLayout = ({ template, ...data }: AppLayoutProps): null => {
	useLayoutEffect(() => {
		if (template) {
			appLayout.render(template, data);
			return;
		}

		appLayout.reset();
	}, [template, data]);

	return null;
};

export default memo(AppLayout);
