import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

type OptionLabelProps = {
	htmlFor: string;
	option: UiKit.Option;
	surfaceRenderer: UiKit.SurfaceRenderer<ReactElement>;
};

/** The text of a checkbox or radio option, with its description below it. */
const OptionLabel = ({ htmlFor, option, surfaceRenderer }: OptionLabelProps) => (
	<Box is='label' htmlFor={htmlFor} paddingInlineStart={8} display='flex' flexDirection='column'>
		<Box fontScale='p2' color='default'>
			{surfaceRenderer.renderTextObject(option.text, 0, UiKit.BlockContext.NONE)}
		</Box>
		{option.description && (
			<Box fontScale='p2' color='hint'>
				{surfaceRenderer.renderTextObject(option.description, 1, UiKit.BlockContext.NONE)}
			</Box>
		)}
	</Box>
);

export default OptionLabel;
