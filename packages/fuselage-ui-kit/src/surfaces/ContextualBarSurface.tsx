import { Margins } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { Surface } from './Surface';

type ContextualBarSurfaceProps = {
	children?: ReactNode;
};

const ContextualBarSurface = ({ children }: ContextualBarSurfaceProps) => (
	<Surface type='contextualBar'>
		<Margins blockEnd={16}>{children}</Margins>
	</Surface>
);

export default ContextualBarSurface;
