import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const CustomHomePageContent = (): ReactElement => {
	const body = String(useSetting('Layout_Home_Body'));

	return <Box role='status' aria-label={body} withRichContent dangerouslySetInnerHTML={{ __html: body }} />;
};

export default CustomHomePageContent;
