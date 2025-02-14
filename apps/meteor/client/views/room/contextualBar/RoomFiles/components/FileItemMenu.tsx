import type { IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Box, Menu, Icon } from '@rocket.chat/fuselage';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { memo, useEffect, useId } from 'react';

import { getURL } from '../../../../../../app/utils/client';
import { download, downloadAs } from '../../../../../lib/download';
import { useRoom } from '../../../contexts/RoomContext';
import { useMessageDeletionIsAllowed } from '../hooks/useMessageDeletionIsAllowed';

type FileItemMenuProps = {
	fileData: IUpload;
	onClickDelete: (id: IUpload['_id']) => void;
};

const ee = new Emitter<Record<string, { result: ArrayBuffer; id: string }>>();

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data.type === 'attachment-download-result') {
			const { result } = event.data as { result: ArrayBuffer; id: string };

			ee.emit(event.data.id, { result, id: event.data.id });
		}
	});
}

const FileItemMenu = ({ fileData, onClickDelete }: FileItemMenuProps) => {
	const t = useTranslation();
	const room = useRoom();
	const userId = useUserId();
	const isDeletionAllowed = useMessageDeletionIsAllowed(room._id, fileData, userId);
	const canDownloadFile = !fileData.encryption || 'serviceWorker' in navigator;

	const { controller } = navigator?.serviceWorker || {};

	const uid = useId();

	useEffect(
		() =>
			ee.once(uid, ({ result }) => {
				downloadAs({ data: [new Blob([result])] }, fileData.name ?? t('Download'));
			}),
		[fileData, t, uid],
	);

	const menuOptions = {
		downLoad: {
			label: (
				<Box display='flex' alignItems='center'>
					<Icon mie={4} name='download' size='x16' />
					{t('Download')}
				</Box>
			),
			action: () => {
				if (fileData.path?.includes('/file-decrypt/')) {
					if (!controller) {
						return;
					}

					controller?.postMessage({
						type: 'attachment-download',
						url: fileData.path,
						id: uid,
					});
					return;
				}

				if (fileData.url && fileData.name) {
					const URL = window.webkitURL ?? window.URL;
					const href = getURL(fileData.url);
					download(href, fileData.name);
					URL.revokeObjectURL(fileData.url);
				}
			},
			disabled: !canDownloadFile,
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
