import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageFooter, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

type AppDetailsPageLayoutProps = {
	children?: ReactNode;
	footer?: ReactNode;
	footerShown?: boolean;
};

const AppDetailsPageLayout = ({ children, footer, footerShown = false }: AppDetailsPageLayoutProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useMarketplaceContext();

	const handleBackButtonClick = useEffectEvent(() => {
		router.navigate({
			name: 'marketplace',
			params: { context, page: 'list' },
		});
	});

	return (
		<Page flexDirection='column' h='full'>
			<PageHeader title={t('App_Info')} onClickBack={handleBackButtonClick} />
			<PageScrollableContentWithShadow pi={24} pbs={24} pbe={0} h='full'>
				<Box w='full' alignSelf='center' h='full' display='flex' flexDirection='column'>
					{children}
				</Box>
			</PageScrollableContentWithShadow>
			{footer && <PageFooter isDirty={footerShown}>{footer}</PageFooter>}
		</Page>
	);
};

export default AppDetailsPageLayout;
