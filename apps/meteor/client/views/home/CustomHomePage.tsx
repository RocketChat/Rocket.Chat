import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContentWithShadow from '../../components/Page/PageScrollableContentWithShadow';
import CustomHomePageContent from './CustomHomePageContent';
import HomePageHeader from './HomePageHeader';

const CustomHomePage = (): ReactElement => (
	<Page data-qa='page-home' data-qa-type='custom'>
		<HomePageHeader />
		<PageScrollableContentWithShadow>
			<CustomHomePageContent />
		</PageScrollableContentWithShadow>
	</Page>
);

export default CustomHomePage;
