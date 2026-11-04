import { Box, IconButton } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import CardView from './CardView';
import { useAppTranslation } from '../hooks/useAppTranslation';
import type { BlockProps } from '../utils/BlockProps';

export type CarouselBlockProps = BlockProps<UiKit.CarouselBlock>;

const cardWidth = 280;

const isCard = (value: unknown): value is UiKit.CardBlock =>
	typeof value === 'object' && value !== null && 'type' in value && value.type === 'card';

// The carousel follows the carousel pattern: the previous and next buttons are ordinary tab stops, and the row
// scrolls natively, so Tab into a card brings it into view.
const CarouselBlock = ({ className, block, surfaceRenderer }: CarouselBlockProps) => {
	const { t } = useAppTranslation();
	const scroller = useRef<HTMLDivElement>(null);
	const [edges, setEdges] = useState({ start: true, end: true });

	const updateEdges = useCallback(() => {
		const element = scroller.current;

		if (!element) {
			return;
		}

		setEdges({
			start: element.scrollLeft <= 0,
			end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
		});
	}, []);

	useEffect(() => {
		updateEdges();
		window.addEventListener('resize', updateEdges);

		return () => window.removeEventListener('resize', updateEdges);
	}, [block.elements, updateEdges]);

	const scrollBy = (direction: -1 | 1) => {
		const element = scroller.current;

		element?.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
	};

	const cards = (Array.isArray(block.elements) ? block.elements : []).filter(isCard);

	return (
		<Box className={className} display='flex' alignItems='center' gap='x4'>
			<IconButton
				size='small'
				icon='chevron-left'
				title={t('UIKit_Carousel_previous')}
				disabled={edges.start}
				onClick={() => scrollBy(-1)}
			/>
			<Box
				ref={scroller}
				role='group'
				aria-roledescription='carousel'
				aria-label={t('UIKit_Carousel')}
				tabIndex={0}
				display='flex'
				gap='x8'
				flexGrow={1}
				minWidth={0}
				overflowX='auto'
				onScroll={updateEdges}
				style={{ scrollSnapType: 'x proximity' }}
			>
				{cards.map((card, index) => (
					<Box
						key={index}
						role='group'
						aria-roledescription='slide'
						aria-label={t('UIKit_Carousel_slide', { current: index + 1, total: cards.length })}
						display='flex'
						flexShrink={0}
						width={cardWidth}
						style={{ scrollSnapAlign: 'start' }}
					>
						<CardView
							block={{ ...card, appId: card.appId ?? block.appId, blockId: card.blockId ?? block.blockId }}
							surfaceRenderer={surfaceRenderer}
						/>
					</Box>
				))}
			</Box>
			<IconButton size='small' icon='chevron-right' title={t('UIKit_Carousel_next')} disabled={edges.end} onClick={() => scrollBy(1)} />
		</Box>
	);
};

export default memo(CarouselBlock);
