import type { BoxProps } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

export type BlockProps<B extends UiKit.Block> = {
	className?: BoxProps['className'];
	block: B;
	context: UiKit.BlockContext;
	index: number;
	surfaceRenderer: UiKit.SurfaceRenderer<ReactElement<any>>;
};
