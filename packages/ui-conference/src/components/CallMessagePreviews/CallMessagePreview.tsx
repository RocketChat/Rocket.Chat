import { Box, IconButton, Text, Tile, useStyle } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

import { openButtonStyles, surfaceStyles } from './previewStyles.js';

export type CallMessagePreviewProps = {
	avatar: ReactNode;
	name: string;
	text: string;
	openLabel: string;
	dismissLabel: string;
	onOpen: () => void;
	onDismiss: () => void;
	ref?: Ref<HTMLLIElement>;
	openButtonRef?: Ref<HTMLButtonElement>;
};

/** One chat message previewed over the call, as an item of `CallMessagePreviewList`. */
const CallMessagePreview = ({
	avatar,
	name,
	text,
	openLabel,
	dismissLabel,
	onOpen,
	onDismiss,
	ref,
	openButtonRef,
}: CallMessagePreviewProps) => {
	const surfaceClassName = useStyle(surfaceStyles);

	return (
		<Box is='li' ref={ref} display='block'>
			<Tile elevation='2' flush className={surfaceClassName}>
				<Box display='flex' alignItems='flex-start' gap='x12' padding='x12' position='relative'>
					<Box flexShrink={0}>{avatar}</Box>
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
						<IconButton icon='cross' size='tiny' aria-label={dismissLabel} onClick={onDismiss} />
					</Box>
				</Box>
			</Tile>
		</Box>
	);
};

export default CallMessagePreview;
