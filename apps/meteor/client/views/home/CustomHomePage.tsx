import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import PageHeader from '../../components/Page/PageHeader';
import PageScrollableContentWithShadow from '../../components/Page/PageScrollableContentWithShadow';

const CustomHomePage = (): ReactElement => {
	const title = useSetting('Layout_Home_Title') as string;
	const body = useSetting('Layout_Home_Body') as string;

	return (
		<Page data-qa='page-home'>
			<PageHeader title={title} />
			<PageScrollableContentWithShadow>
				<Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default CustomHomePage;
