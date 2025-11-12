import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import IconButtonElement from '../elements/IconButtonElement';
import IconElement from '../elements/IconElement';
import type { BlockProps } from '../utils/BlockProps';

type SectionedPreviewProps = BlockProps<UiKit.SectionedPreviewBlock>;

const SectionedPreview = ({ block, surfaceRenderer, context }: SectionedPreviewProps): ReactElement => {
	console.log('SectionedPreview', block, context);
	const { sections, blockId } = block;
	return (
		<Box
			display='flex'
			flexDirection='column'
			borderWidth={1}
			borderRadius='x4'
			borderColor='extra-light'
			maxWidth='345px'
			backgroundColor='surface-neutral'
			overflow='hidden'
		>
			{sections.map((section, index) => {
				const { elements, action, variant } = section;
				return (
					<Box
						key={`${blockId}-${index}`}
						padding={16}
						backgroundColor={variant === 'foreground' ? 'surface-light' : undefined}
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
								if (element.type === 'plain_text') {
									return (
										<Box key={index} mi={4}>
											<>{surfaceRenderer.renderTextObject(element, index, UiKit.BlockContext.NONE)}</>
										</Box>
									);
								}
								return null;
							})}
						</Box>
						<div>
							{action ? <IconButtonElement block={action} context={context} surfaceRenderer={surfaceRenderer} index={index} /> : null}
						</div>
					</Box>
				);
			})}
		</Box>
	);
};

export default SectionedPreview;
