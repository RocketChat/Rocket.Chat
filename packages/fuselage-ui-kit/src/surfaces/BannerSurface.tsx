import { Margins } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { Surface } from './Surface';

type BannerSurfaceProps = {
	children?: ReactNode;
};

const BannerSurface = ({ children }: BannerSurfaceProps) => (
	<Surface type='banner'>
		<Margins block={8}>{children}</Margins>
	</Surface>
);

export default BannerSurface;
