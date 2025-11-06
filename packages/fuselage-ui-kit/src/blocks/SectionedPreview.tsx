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
		>
			{sections.map((section, index) => {
				const { title, action, accessory, variant } = section;
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
						<Box display='flex' alignItems='center' flexDirection='row'>
							{accessory ? <IconElement block={accessory} context={context} surfaceRenderer={surfaceRenderer} index={index} /> : null}
							<Box mis={8}>{surfaceRenderer.renderTextObject(title, index, UiKit.BlockContext.NONE)}</Box>
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
