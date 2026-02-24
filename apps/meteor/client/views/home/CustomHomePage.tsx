import { Page, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import HomePageHeader from './HomePageHeader';
import CustomContentCard from './cards/CustomContentCard';

const CustomHomePage = (): ReactElement => {
	return (
		<Page color='default' background='tint'>
			<HomePageHeader />
			<PageScrollableContentWithShadow>
				<CustomContentCard />
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default CustomHomePage;
