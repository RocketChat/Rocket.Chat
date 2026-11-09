import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

export type FieldsProps = {
	fields: readonly UiKit.TextObject[];
	surfaceRenderer: UiKit.SurfaceRenderer<ReactElement<any>>;
};

// Two columns sized by the message, not the window, so fields read the same in a thread panel and in the room.
const Fields = ({ fields, surfaceRenderer }: FieldsProps) => (
	<Box display='grid' rowGap='x8' columnGap='x16' style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
		{fields.map((field, i) => (
			<div key={i} style={{ overflowWrap: 'anywhere' }}>
				{surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE)}
			</div>
		))}
	</Box>
);

export default Fields;
