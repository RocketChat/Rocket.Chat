import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

export type ActionProps = {
	element: UiKit.ActionsBlock['elements'][number];
	parser: UiKit.SurfaceRenderer<ReactElement<any>>;
	index: number;
};

const Action = ({ element, parser, index }: ActionProps) => {
	const renderedElement = parser.renderActionsBlockElement(element, index);

	if (!renderedElement) {
		return null;
	}

	// Inputs share the row; buttons and the overflow menu keep their own size.
	const grows = element.type !== UiKit.BlockElementType.BUTTON && element.type !== UiKit.BlockElementType.OVERFLOW;

	return (
		<Box display='flex' flexGrow={grows ? 1 : undefined} flexBasis={grows ? '45%' : undefined}>
			{renderedElement}
		</Box>
	);
};

export default Action;
