import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ConfigModalFeatureListProps = {
	children: ReactNode;
};

/**
 * The bulleted list of what a conference call app brings, in the modal's rich text style.
 */
const ConfigModalFeatureList = ({ children }: ConfigModalFeatureListProps) => (
	<Box withRichContent>
		<Box is='ul' paddingInlineStart='x24'>
			{children}
		</Box>
	</Box>
);

export default ConfigModalFeatureList;
