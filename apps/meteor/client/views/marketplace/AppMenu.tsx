import type { App } from '@rocket.chat/core-typings';
import { Menu, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useAppMenu } from './hooks/useAppMenu';

type AppMenuProps = {
	app: App;
	isAppDetailsPage: boolean;
};

const AppMenu = ({ app, isAppDetailsPage }: AppMenuProps) => {
	const t = useTranslation();

	const { isLoading, isAdminUser, menuOptions } = useAppMenu(app, isAppDetailsPage);

	if (isLoading) {
		return <Skeleton variant='rect' height='x28' width='x28' />;
	}

	if (!isAdminUser && app?.installed) {
		return null;
	}

	return <Menu title={t('More_options')} options={menuOptions} placement='bottom-start' maxHeight='initial' />;
};

export default memo(AppMenu);
