import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { useContext, useMemo } from 'react';

import { context, templatesToggleAction, updatePayloadAction } from '../../../Context';
import type { ILayoutBlock } from '../../../Context/initialState';
import getUniqueId from '../../../utils/getUniqueId';
import SurfaceRender from '../../Preview/Display/Surface/SurfaceRender';
import type { SurfaceOptions } from '../../Preview/Display/Surface/constant';
import RenderPayload from '../../RenderPayload/RenderPayload';

export type PayloadProps = { surface: SurfaceOptions; blocks: LayoutBlock[] };

const Payload = ({ blocks, surface }: PayloadProps) => {
	const { dispatch } = useContext(context);
	const blocksWithUniqueIds: ILayoutBlock[] = useMemo(
		() =>
			blocks.map((block) => {
				return { ...block, actionId: getUniqueId() };
			}),
		[blocks],
	);
	const clickHandler = () => {
		dispatch(templatesToggleAction(false));
		dispatch(
			updatePayloadAction({
				blocks: blocksWithUniqueIds,
				changedByEditor: false,
			}),
		);
	};
	return (
		<Box display='flex' flexDirection='column' gap='x16' paddingBlockEnd='x24'>
			<Box
				onClick={clickHandler}
				border='1px solid #e6e6e6'
				padding='4px'
				borderRadius='large'
				className={css`
					cursor: pointer;
				`}
			>
				<Box
					className={css`
						pointer-events: none;
						&hover {
							box-shadow: var(--elements-box-shadow);
						}
					`}
				>
					<SurfaceRender type={surface}>
						<RenderPayload blocks={blocksWithUniqueIds} surface={surface} />
					</SurfaceRender>
				</Box>
			</Box>
			<Box>
				<Button onClick={clickHandler} primary>
					Use This Template
				</Button>
			</Box>
		</Box>
	);
};

export default Payload;
