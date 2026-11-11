import type { ReactNode } from 'react';

import { Surface } from './Surface';

export type ModalSurfaceProps = {
	children?: ReactNode;
};

const ModalSurface = ({ children }: ModalSurfaceProps) => <Surface type='modal'>{children}</Surface>;

export default ModalSurface;
