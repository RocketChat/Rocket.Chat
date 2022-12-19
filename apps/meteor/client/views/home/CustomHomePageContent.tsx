import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const CustomHomePageContent = (): ReactElement | null => {
	const body = String(useSetting('Layout_Home_Body'));

	return <Box withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
};

export default CustomHomePageContent;
