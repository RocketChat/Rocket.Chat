import type { App } from '@rocket.chat/core-typings';
import { MenuItem, MenuItemContent, MenuSection, MenuV2, Skeleton } from '@rocket.chat/fuselage';
import { useHandleMenuAction } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { AppMenuOption } from './hooks/useAppMenu';
import { useAppMenu } from './hooks/useAppMenu';

type AppMenuProps = {
	app: App;
	isAppDetailsPage: boolean;
};

const AppMenu = ({ app, isAppDetailsPage }: AppMenuProps) => {
	const { t } = useTranslation();

	const { isLoading, isAdminUser, sections } = useAppMenu(app, isAppDetailsPage);

	const itemsList = sections.reduce((acc, { items }) => [...acc, ...items], [] as AppMenuOption[]);

	const onAction = useHandleMenuAction(itemsList);
	const disabledKeys = itemsList.filter((item) => item.disabled).map((item) => item.id);

	if (isLoading) {
		return <Skeleton variant='rect' height='x28' width='x28' />;
	}

	if (!isAdminUser && app?.installed && sections.length === 0) {
		return null;
	}

	return (
		<MenuV2 title={t('More_options')} onAction={onAction} disabledKeys={disabledKeys} detached>
			{sections.map(({ items }, idx) => (
				<MenuSection key={idx} items={items}>
					{items.map((option) => (
						<MenuItem key={option.id}>
							<MenuItemContent>{option.content}</MenuItemContent>
						</MenuItem>
					))}
				</MenuSection>
			))}
		</MenuV2>
	);
};

export default memo(AppMenu);
