import { Grid, GridItem } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

const breakpoints = {
	xs: 4,
	sm: 4,
	md: 4,
	lg: 6,
	xl: 6,
} as const;

type FieldsProps = {
	fields: readonly UiKit.TextObject[];
	surfaceRenderer: UiKit.SurfaceRenderer<ReactElement>;
};

const Fields = ({ fields, surfaceRenderer }: FieldsProps): ReactElement => (
	<Grid>
		{fields.map((field, i) => (
			<GridItem key={i} {...breakpoints}>
				{surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE)}
			</GridItem>
		))}
	</Grid>
);

export default Fields;
