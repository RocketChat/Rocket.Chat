import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const CustomHomePageContent = (): ReactElement | null => {
	const body = useSetting('Layout_Home_Body') as string;

	if (!body) {
		return null;
	}

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
};

export default CustomHomePageContent;
