import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useMemo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type LinearScaleElementProps = BlockProps<UiKit.LinearScaleElement>;

const MAX_POINTS = 100;

const LinearScaleElement = ({ className, block, context, surfaceRenderer }: LinearScaleElementProps) => {
	const { minValue = 0, maxValue = 10, initialValue, preLabel, postLabel } = block;

	const [{ loading, value = initialValue, error }, action] = useUiKitState(block, context);

	const points = useMemo(
		() => Array.from({ length: Math.min(Math.max(maxValue - minValue + 1, 1), MAX_POINTS) }, (_, i) => String(minValue + i)),
		[maxValue, minValue],
	);

	return (
		<Box display='flex' flexDirection='row' flexWrap='nowrap' alignItems='center'>
			{preLabel && (
				<Box fontScale='c2' paddingInlineEnd={8} textAlign='start'>
					{surfaceRenderer.renderTextObject(preLabel, 0, UiKit.BlockContext.NONE)}
				</Box>
			)}
			<Box>
				<ButtonGroup className={className as string} align='center'>
					{points.map((point, i) => (
						<Button
							key={i}
							primary={point === String(value)}
							disabled={loading}
							danger={!!error}
							compact
							small
							value={point}
							onClick={action}
						>
							{surfaceRenderer.renderTextObject(
								{
									type: 'plain_text',
									text: String(i + minValue),
								},
								0,
								UiKit.BlockContext.NONE,
							)}
						</Button>
					))}
				</ButtonGroup>
			</Box>
			{postLabel && (
				<Box fontScale='c2' paddingInlineStart={8} textAlign='end'>
					{surfaceRenderer.renderTextObject(postLabel, 0, UiKit.BlockContext.NONE)}
				</Box>
			)}
		</Box>
	);
};

export default memo(LinearScaleElement);
