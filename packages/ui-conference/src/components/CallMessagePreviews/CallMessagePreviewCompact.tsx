import { Box, IconButton, Text, Tile, useStyle } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

import { openButtonStyles, surfaceStyles, swipeStyles } from './previewStyles.js';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss.js';

export type CallMessagePreviewCompactProps = {
	avatar: ReactNode;
	name: string;
	text: string;
	openLabel: string;
	dismissLabel: string;
	onOpen: () => void;
	/** Also called when the preview is swiped away. */
	onDismiss: () => void;
	ref?: Ref<HTMLLIElement>;
	openButtonRef?: Ref<HTMLButtonElement>;
};

/** One chat message previewed over the call in a window with little room over it, as an item of `CallMessagePreviewList`. */
const CallMessagePreviewCompact = ({
	avatar,
	name,
	text,
	openLabel,
	dismissLabel,
	onOpen,
	onDismiss,
	ref,
	openButtonRef,
}: CallMessagePreviewCompactProps) => {
	const swipeRef = useSwipeToDismiss(onDismiss);
	const surfaceClassName = useStyle(surfaceStyles);
	const swipeClassName = useStyle(swipeStyles);

	return (
		<Box is='li' ref={ref} display='block'>
			<Tile ref={swipeRef} elevation='2' flush className={`${surfaceClassName} ${swipeClassName}`}>
				<Box display='flex' alignItems='center' gap={8} padding={8} position='relative'>
					{avatar}
					<Box
						is='button'
						type='button'
						ref={openButtonRef}
						aria-label={openLabel}
						className={openButtonStyles}
						display='flex'
						flexDirection='column'
						flexGrow={1}
						minWidth={0}
						padding={0}
						borderWidth='none'
						backgroundColor='transparent'
						textAlign='start'
						onClick={onOpen}
					>
						<Text is='span' fontScale='p2b' color='titles-labels' truncate>
							{name}
						</Text>
						<Text is='span' fontScale='p2' color='default' truncate>
							{text}
						</Text>
					</Box>
					{/* Positioned so it paints over the open button's stretched area, which would otherwise take its clicks. */}
					<Box position='relative'>
						<IconButton icon='cross' size='small' aria-label={dismissLabel} onClick={onDismiss} />
					</Box>
				</Box>
			</Tile>
		</Box>
	);
};

export default CallMessagePreviewCompact;
