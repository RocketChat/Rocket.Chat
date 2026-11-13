import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow, PageSkeleton } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import UiKitHome from './UiKitHome';
import { useAppHome } from './useAppHome';

export type AppHomeProps = {
	appId: string;
};

export const AppHome = ({ appId }: AppHomeProps) => {
	const { t } = useTranslation();
	const { view, isPending, isError } = useAppHome(appId);

	if (isPending) {
		return <PageSkeleton />;
	}

	return (
		<Page>
			<PageHeader title={t('Home')} />
			<PageScrollableContentWithShadow>
				{view ? (
					<UiKitHome key={view.id} initialView={view} />
				) : (
					<Box display='flex' justifyContent='center'>
						<States>
							<StatesIcon name={isError ? 'warning' : 'home'} variation={isError ? 'danger' : undefined} />
							<StatesTitle>{isError ? t('App_Home_error') : t('App_Home_empty_title')}</StatesTitle>
							{!isError && <StatesSubtitle>{t('App_Home_empty_description')}</StatesSubtitle>}
						</States>
					</Box>
				)}
			</PageScrollableContentWithShadow>
		</Page>
	);
};
