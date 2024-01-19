import type { IUpload } from '@rocket.chat/core-typings';
import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { getURL } from '../../../../../../app/utils/client';
import { download } from '../../../../../lib/download';
import { useRoom } from '../../../contexts/RoomContext';
import { useMessageDeletionIsAllowed } from '../hooks/useMessageDeletionIsAllowed';

type FileItemMenuProps = {
	fileData: IUpload;
	onClickDelete: (id: IUpload['_id']) => void;
};

const FileItemMenu = ({ fileData, onClickDelete }: FileItemMenuProps) => {
	const t = useTranslation();
	const room = useRoom();
	const uid = useUserId();
	const isDeletionAllowed = useMessageDeletionIsAllowed(room._id, fileData, uid);

	const menuOptions = {
		downLoad: {
			label: (
				<Box display='flex' alignItems='center'>
					<Icon mie={4} name='download' size='x16' />
					{t('Download')}
				</Box>
			),
			action: () => {
				if (fileData.url && fileData.name) {
					const URL = window.webkitURL ?? window.URL;
					const href = getURL(fileData.url);
					download(href, fileData.name);
					URL.revokeObjectURL(fileData.url);
				}
			},
		},
		...(isDeletionAllowed &&
			onClickDelete && {
				delete: {
					label: (
						<Box display='flex' alignItems='center' color='status-font-on-danger'>
							<Icon mie={4} name='trash' size='x16' />
							{t('Delete')}
						</Box>
					),
					action: () => onClickDelete(fileData._id),
				},
			}),
	};

	return <Menu options={menuOptions} />;
};

export default memo(FileItemMenu);
