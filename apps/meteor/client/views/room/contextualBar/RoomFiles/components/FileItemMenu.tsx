import type { IRoom, IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Text } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { download, downloadAs } from '../../../../../lib/download';
import { getURL } from '../../../../../lib/getURL';
import { useMessageDeletionIsAllowed } from '../hooks/useMessageDeletionIsAllowed';

export type FileItemMenuProps = {
	rid: IRoom['_id'];
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

const FileItemMenu = ({ rid, fileData, onClickDelete }: FileItemMenuProps) => {
	const t = useTranslation();
	const userId = useUserId();
	const isDeletionAllowed = useMessageDeletionIsAllowed(rid, fileData, userId);
	const canDownloadFile = !fileData.encryption || 'serviceWorker' in navigator;

	const { controller } = navigator?.serviceWorker || {};

	const menuOptions = [
		{
			id: 'download',
			content: t('Download'),
			icon: 'download',
			onClick: () => {
				if (fileData.path?.includes('/file-decrypt/')) {
					if (!controller) {
						return;
					}

					const transactionId = Random.id();
					let timeoutId: ReturnType<typeof setTimeout>;
					const unsubscribe = ee.once(transactionId, ({ result }) => {
						clearTimeout(timeoutId);
						downloadAs({ data: [new Blob([result])] }, fileData.name ?? t('Download'));
					});
					timeoutId = setTimeout(() => {
						unsubscribe();
					}, 30000);

					controller?.postMessage({
						type: 'attachment-download',
						url: fileData.path,
						id: transactionId,
					});
					return;
				}

				if (fileData.name) {
					const URL = window.webkitURL ?? window.URL;
					const href = getURL(`/file-upload/${fileData._id}/${encodeURIComponent(fileData.name)}`);
					download(href, fileData.name);
					URL.revokeObjectURL(href);
				}
			},
			disabled: !canDownloadFile,
		},
		...(isDeletionAllowed && onClickDelete
			? [
					{
						id: 'delete',
						content: <Text color='status-font-on-danger'>{t('Delete')}</Text>,
						onClick: () => onClickDelete(fileData._id),
						icon: 'trash',
						iconColor: 'status-font-on-danger',
					},
				]
			: []),
	] as GenericMenuItemProps[];

	return <GenericMenu title={t('More')} aria-label={t('More')} items={menuOptions} placement='bottom-end' />;
};

export default memo(FileItemMenu);
