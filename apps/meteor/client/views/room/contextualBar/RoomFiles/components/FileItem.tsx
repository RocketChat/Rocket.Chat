import type { IRoom, IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import {
	Icon,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';

import FileItemMenu from './FileItemMenu';
import ImageItem from './ImageItem';
import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import { normalizeUsername } from '../../../../../../lib/utils/normalizeUsername';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { isPreviewableImage } from '../../../../../lib/utils/isPreviewableImage';

export type FileItemProps = {
	rid: IRoom['_id'];
	fileData: IUploadWithUser;
	onClickDelete: (id: IUpload['_id']) => void;
};

const FileItem = ({ rid, fileData, onClickDelete }: FileItemProps) => {
	const format = useFormatDateAndTime();
	const { _id, path, name, uploadedAt, type, typeGroup, user, description } = fileData;

	const { onClick, onContextMenu } = useDownloadFromServiceWorker(path || '', name);
	const normalizedUsername = user?.username ? normalizeUsername(user.username) : undefined;
	const shouldDisplayPreview = typeGroup === 'image' && !!type && isPreviewableImage(type);
	const isEncrypted = !!path?.includes('/file-decrypt/');
	const extension = getFileExtension(name);

	return (
		<Item size='extended' inset='lg'>
			{shouldDisplayPreview ? (
				<ImageItem id={_id} url={path} name={name} username={normalizedUsername} timestamp={format(uploadedAt)} alt={description} />
			) : (
				<>
					<ItemMedia>
						<Icon name='attachment-file' size='x32' />
					</ItemMedia>
					<ItemContent>
						<ItemRow>
							<ItemTitle>
								<ItemLink
									href={path ?? ''}
									download
									rel='noopener noreferrer'
									target='_blank'
									title={name}
									{...(isEncrypted && { onClick, onContextMenu })}
								>
									{name}
								</ItemLink>
							</ItemTitle>
							<ItemMeta>{format(uploadedAt)}</ItemMeta>
						</ItemRow>
						<ItemRow>
							{normalizedUsername && <ItemDescription>@{normalizedUsername}</ItemDescription>}
							{extension && <ItemMeta>{extension.toUpperCase()}</ItemMeta>}
						</ItemRow>
					</ItemContent>
				</>
			)}
			<ItemActions reveal='hover'>
				<FileItemMenu rid={rid} fileData={fileData} onClickDelete={onClickDelete} />
			</ItemActions>
		</Item>
	);
};

export default FileItem;
