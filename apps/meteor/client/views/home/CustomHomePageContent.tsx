import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

const CustomHomePageContent = (props: BoxProps) => {
	const body = useSetting('Layout_Home_Body', '');

	const dangerous = useMemo(() => ({ __html: body }), [body]);

	return <Box withRichContent dangerouslySetInnerHTML={dangerous} {...props} />;
};

export default CustomHomePageContent;
