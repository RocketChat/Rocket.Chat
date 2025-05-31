import type { IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { memo, useEffect, useRef } from 'react';

import FileItemIcon from './FileItemIcon';
import FileItemMenu from './FileItemMenu';
import ImageItem from './ImageItem';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';

const customClass = css`
	&:hover {
		cursor: pointer;
		background: ${Palette.surface['surface-hover']};
	}

	&:focus.focus-visible {
		outline: 0;
		margin: 2px;
		box-shadow: 0 0 0 2px ${Palette.stroke['stroke-extra-light-highlight']};
		border-color: ${Palette.stroke['stroke-highlight']};
	}
`;

type FileItemProps = {
	fileData: IUploadWithUser;
	onClickDelete: (id: IUpload['_id']) => void;
	focused: boolean;
};

const FileItem = ({ fileData, onClickDelete, focused }: FileItemProps) => {
	const format = useFormatDateAndTime();
	const { _id, path, name, uploadedAt, type, typeGroup, user } = fileData;

	const encryptedAnchorProps = useDownloadFromServiceWorker(path || '', name);
	const ref = useRef<HTMLElement>(null);
	const containerRef = useRef<HTMLLIElement>(null);

	useEffect(() => {
		if (focused && containerRef.current) {
			containerRef.current.focus();
		}
	}
	, [focused]);

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (!ref.current) {
			return;
		}

		if (event.code === 'Enter' || event.code === 'Space') {
			event.preventDefault();
			console.log('click');
			ref.current.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
		}
	};

	return (
		<Box
			is='li'
			display='flex'
			pb={12}
			pi={24}
			borderRadius={4}
			className={customClass}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			role='listitem'
			ref={containerRef}
			// key={`file-${_id}`}
		>
			{typeGroup === 'image' ? (
				<ImageItem id={_id} url={path} name={name} username={user?.username} timestamp={format(uploadedAt)} ref={ref} />
			) : (
				<Box
					is='a'
					minWidth={0}
					download
					rel='noopener noreferrer'
					target='_blank'
					title={name}
					display='flex'
					flexGrow={1}
					flexShrink={1}
					href={path}
					textDecorationLine='none'
					ref={ref}
					tabIndex={-1}
					{...(path?.includes('/file-decrypt/') ? encryptedAnchorProps : {})}
				>
					<FileItemIcon type={type} />
					<Box mis={8} flexShrink={1} overflow='hidden'>
						<Box withTruncatedText color='default' fontScale='p2m'>
							{name}
						</Box>
						{user?.username && (
							<Box withTruncatedText color='hint' fontScale='p2'>
								@{user?.username}
							</Box>
						)}
						<Box color='hint' fontScale='micro'>
							{format(uploadedAt)}
						</Box>
					</Box>
				</Box>
			)}
			<FileItemMenu fileData={fileData} onClickDelete={onClickDelete} />
		</Box>
	);
};

export default memo(FileItem);
