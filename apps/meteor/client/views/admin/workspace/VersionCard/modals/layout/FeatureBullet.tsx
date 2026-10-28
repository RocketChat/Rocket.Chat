import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FeatureBulletProps = {
	title: ReactNode;
	children: ReactNode;
};

/**
 * A list item naming a feature of registered workspaces, its description close below the name.
 */
const FeatureBullet = ({ title, children }: FeatureBulletProps) => (
	<li>
		<strong>{title}</strong>
		<Box is='p' marginBlockStart='x4'>
			{children}
		</Box>
	</li>
);

export default FeatureBullet;
