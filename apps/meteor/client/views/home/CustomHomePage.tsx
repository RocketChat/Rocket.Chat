import { useRole } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContentWithShadow from '../../components/Page/PageScrollableContentWithShadow';
import HomePageHeader from './HomePageHeader';
import CustomCard from './cards/CustomCard';

const CustomHomePage = (): ReactElement => {
	const isAdmin = useRole('admin');

	return (
		<Page data-qa='page-home' data-qa-type='custom' color='default' background='tint'>
			<HomePageHeader />
			<PageScrollableContentWithShadow>
				<CustomCard isAdmin={isAdmin} />
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default CustomHomePage;
