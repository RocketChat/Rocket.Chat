import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContentWithShadow from '../../components/Page/PageScrollableContentWithShadow';
import HomePageHeader from './HomePageHeader';

const CustomHomePage = (): ReactElement => {
	const body = useSetting('Layout_Home_Body') as string;

	return (
		<Page data-qa='page-home' data-qa-type='custom'>
			<HomePageHeader />
			<PageScrollableContentWithShadow>
				<Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default CustomHomePage;
