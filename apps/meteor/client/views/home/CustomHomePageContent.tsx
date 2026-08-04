import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export type CustomHomePageContentProps = BoxProps;

const CustomHomePageContent = (props: CustomHomePageContentProps) => {
	const body = useSetting('Layout_Home_Body', '');

	const dangerous = useMemo(() => ({ __html: body }), [body]);

	return <Box withRichContent dangerouslySetInnerHTML={dangerous} {...props} />;
};

export default CustomHomePageContent;
