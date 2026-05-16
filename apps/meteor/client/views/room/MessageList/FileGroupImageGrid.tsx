import type { ImageAttachmentProps, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

type FileGroupImageGridProps = {
	attachments: { attachment: MessageAttachmentBase; fileId: string | undefined }[];
	maxWidth: number;
};

const getAspectRatio = (attachment: ImageAttachmentProps): number => {
	const { width, height } = attachment.image_dimensions ?? {};
	return width && height ? width / height : 1;
};

const FileGroupImageGrid = memo(({ attachments, maxWidth }: FileGroupImageGridProps) => {
	const getURL = useMediaUrl();

	return (
		<Box display='flex' flexWrap='wrap' maxWidth={maxWidth} style={{ gap: '4px' }} borderRadius={4} overflow='hidden'>
			{attachments.map(({ attachment, fileId }) => {
				const img = attachment as ImageAttachmentProps;
				const url = getURL(img.image_url);
				const link = img.title_link ? getURL(img.title_link) : url;

				return (
					<Box
						key={fileId || url}
						className='gallery-item-container'
						data-id={fileId}
						style={{ flex: `${getAspectRatio(img)} 1 0%`, minWidth: '30%', height: 160, cursor: 'pointer' }}
						overflow='hidden'
						borderRadius={2}
					>
						<img
							className='gallery-item'
							data-id={fileId}
							data-src={link}
							src={url}
							alt={img.title || ''}
							loading='lazy'
							style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
						/>
					</Box>
				);
			})}
		</Box>
	);
});

FileGroupImageGrid.displayName = 'FileGroupImageGrid';

export default FileGroupImageGrid;
