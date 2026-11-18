import { Box, Card, CardBody, CardControls, CardHeader, CardTitle } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';

import type { BlockProps } from '../utils/BlockProps';
import { isTextObject } from '../utils/isTextObject';

const safeImage = (image: UiKit.CardImage | undefined) =>
	image && typeof image.image_url === 'string' && UiKit.isSafeUrl(image.image_url) ? image : undefined;

type CardViewProps = Pick<BlockProps<UiKit.CardBlock>, 'block' | 'surfaceRenderer'>;

// The card without a width, so a carousel and a block can size it their own way.
const CardView = ({ block, surfaceRenderer }: CardViewProps) => {
	const heroImage = safeImage(block.hero_image);
	const icon = safeImage(block.icon);
	const renderText = (text: UiKit.TextObject | undefined) =>
		isTextObject(text) ? surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE) : null;

	const title = renderText(block.title);
	const subtitle = renderText(block.subtitle);
	const body = renderText(block.body);
	const subtext = renderText(block.subtext);
	const actions = Array.isArray(block.actions)
		? block.actions.map((action) => ({ ...action, appId: action.appId ?? block.appId, blockId: action.blockId ?? block.blockId }))
		: [];

	return (
		<Box
			display='flex'
			flexDirection='column'
			flexGrow={1}
			borderWidth='default'
			borderColor='extra-light'
			borderRadius='large'
			overflow='hidden'
		>
			{heroImage && (
				<Box is='img' src={heroImage.image_url} alt={heroImage.alt_text} width='full' height='x160' style={{ objectFit: 'cover' }} />
			)}
			<Card>
				{(icon || title || subtitle) && (
					<CardHeader>
						{icon && <Box is='img' src={icon.image_url} alt={icon.alt_text} size='x36' borderRadius='medium' flexShrink={0} />}
						<Box display='flex' flexDirection='column' minWidth={0}>
							{title && <CardTitle variant='h5'>{title}</CardTitle>}
							{subtitle && (
								<Box fontScale='c1' color='annotation'>
									{subtitle}
								</Box>
							)}
						</Box>
					</CardHeader>
				)}
				{(body || subtext) && (
					<CardBody flexDirection='column'>
						{body}
						{subtext && (
							<Box fontScale='c1' color='annotation'>
								{subtext}
							</Box>
						)}
					</CardBody>
				)}
				{actions.length > 0 && (
					<CardControls>
						{actions.map((action, index) => (
							<Box key={index} display='flex'>
								{surfaceRenderer.renderActionsBlockElement(action, index)}
							</Box>
						))}
					</CardControls>
				)}
			</Card>
		</Box>
	);
};

export default CardView;
