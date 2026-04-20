import type { IRoom, IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { FilePreviewIcon } from '@rocket.chat/ui-client';

import FileItemMenu from './FileItemMenu';
import ImageItem from './ImageItem';
import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import { normalizeUsername } from '../../../../../../lib/utils/normalizeUsername';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { isPreviewableImage } from '../../../../../lib/utils/isPreviewableImage';

type FileItemProps = {
	rid: IRoom['_id'];
	fileData: IUploadWithUser;
	onClickDelete: (id: IUpload['_id']) => void;
};

const FileItem = ({ rid, fileData, onClickDelete }: FileItemProps) => {
	const format = useFormatDateAndTime();
	const { _id, path, name, uploadedAt, type, typeGroup, user, description } = fileData;

	const encryptedAnchorProps = useDownloadFromServiceWorker(path || '', name);
	const normalizedUsername = user?.username ? normalizeUsername(user.username) : undefined;
	const shouldDisplayPreview = typeGroup === 'image' && !!type && isPreviewableImage(type);

	return (
		<>
			{shouldDisplayPreview ? (
				<ImageItem id={_id} url={path} name={name} username={normalizedUsername} timestamp={format(uploadedAt)} alt={description} />
			) : (
				<Box
					is='a'
					minWidth={0}
					aria-label={name}
					download
					rel='noopener noreferrer'
					target='_blank'
					title={name}
					display='flex'
					alignItems='center'
					flexGrow={1}
					flexShrink={1}
					href={path}
					tabIndex={-1}
					textDecorationLine='none'
					{...(path?.includes('/file-decrypt/') ? encryptedAnchorProps : {})}
				>
					<FilePreviewIcon format={getFileExtension(name)} />
					<Box mis={8} flexShrink={1} overflow='hidden'>
						<Box withTruncatedText color='default' fontScale='p2m'>
							{name}
						</Box>
						{user?.username && (
							<Box withTruncatedText color='hint' fontScale='p2'>
								@{normalizedUsername}
							</Box>
						)}
						<Box color='hint' fontScale='micro'>
							{format(uploadedAt)}
						</Box>
					</Box>
				</Box>
			)}
			<FileItemMenu rid={rid} fileData={fileData} onClickDelete={onClickDelete} />
		</>
	);
};

export default FileItem;
