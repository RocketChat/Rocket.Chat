import type { IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import FileItemIcon from './FileItemIcon';
import FileItemMenu from './FileItemMenu';
import ImageItem from './ImageItem';
import { normalizeUsername } from '../../../../../../lib/utils/normalizeUsername';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';

type FileItemProps = {
	fileData: IUploadWithUser;
	onClickDelete: (id: IUpload['_id']) => void;
};

const FileItem = ({ fileData, onClickDelete }: FileItemProps) => {
	const format = useFormatDateAndTime();
	const { _id, path, name, uploadedAt, type, typeGroup, user } = fileData;

	const encryptedAnchorProps = useDownloadFromServiceWorker(path || '', name);
	const normalizedUsername = user?.username ? normalizeUsername(user.username) : undefined;

	return (
		<>
			{typeGroup === 'image' ? (
				<ImageItem id={_id} url={path} name={name} username={normalizedUsername} timestamp={format(uploadedAt)} />
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
					flexGrow={1}
					flexShrink={1}
					href={path}
					tabIndex={-1}
					textDecorationLine='none'
					{...(path?.includes('/file-decrypt/') ? encryptedAnchorProps : {})}
				>
					<FileItemIcon type={type} />
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
			<FileItemMenu fileData={fileData} onClickDelete={onClickDelete} />
		</>
	);
};

export default FileItem;
