import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import RichContent from '../../../../../components/RichContent';

export type ConfigModalFeatureListProps = {
	children: ReactNode;
};

/**
 * The bulleted list of what a conference call app brings, in the rich text style but indented less than its lists.
 */
const ConfigModalFeatureList = ({ children }: ConfigModalFeatureListProps) => (
	<RichContent>
		<Box is='ul' paddingInlineStart='x24'>
			{children}
		</Box>
	</RichContent>
);

export default ConfigModalFeatureList;
