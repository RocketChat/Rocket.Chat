import type { ReactNode } from 'react';

import BannerSurface from './BannerSurface';
import ContextualBarSurface from './ContextualBarSurface';
import MessageSurface from './MessageSurface';
import ModalSurface from './ModalSurface';
import { SurfaceOptions } from './constant';

export type SurfaceRenderProps = { type?: SurfaceOptions; children: ReactNode };

const SurfaceRender = ({ type = SurfaceOptions.Message, children }: SurfaceRenderProps) => (
	<>
		{SurfaceOptions.Message === type && <MessageSurface>{children}</MessageSurface>}
		{SurfaceOptions.Banner === type && <BannerSurface>{children}</BannerSurface>}
		{SurfaceOptions.Modal === type && <ModalSurface>{children}</ModalSurface>}
		{SurfaceOptions.ContextualBar === type && <ContextualBarSurface>{children}</ContextualBarSurface>}
	</>
);
export default SurfaceRender;
