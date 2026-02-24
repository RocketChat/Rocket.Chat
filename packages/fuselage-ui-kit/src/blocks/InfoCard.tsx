import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import IconElement from '../elements/IconElement';
import type { BlockProps } from '../utils/BlockProps';

type InfoCardProps = BlockProps<UiKit.InfoCardBlock>;

const InfoCard = ({ block, surfaceRenderer, context }: InfoCardProps): ReactElement => {
	const { rows, blockId } = block;
	return (
		<Box
			display='flex'
			flexDirection='column'
			borderWidth={1}
			borderRadius='x4'
			borderColor='extra-light'
			maxWidth='345px'
			backgroundColor='surface-tint'
			overflow='hidden'
			color='default'
		>
			{rows.map((row, index) => {
				const { elements, action, background } = row;
				return (
					<Box
						key={`${blockId ?? 'info_card'}-${index}`}
						padding={16}
						backgroundColor={background === 'default' ? 'surface-light' : undefined}
						display='flex'
						alignItems='center'
						justifyContent='space-between'
						flexDirection='row'
					>
						<Box display='flex' alignItems='center' flexDirection='row' mi={-4}>
							{elements.map((element, index) => {
								if (element.type === 'icon') {
									return (
										<Box key={index} mi={4}>
											<IconElement block={element} context={context} surfaceRenderer={surfaceRenderer} index={index} />
										</Box>
									);
								}
								if (element.type === 'plain_text' || element.type === 'mrkdwn') {
									return (
										<Box key={index} mi={4}>
											<>{surfaceRenderer.renderTextObject(element, index, UiKit.BlockContext.NONE)}</>
										</Box>
									);
								}
								return null;
							})}
						</Box>
						{action && <div>{surfaceRenderer.renderActionsBlockElement(action, index)}</div>}
					</Box>
				);
			})}
		</Box>
	);
};

export default InfoCard;
