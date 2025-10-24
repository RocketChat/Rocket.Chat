import type { IUpload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
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

	const normalizeFileHref = (href: string): string => {
		const value = href.trim();

		if (!/^https?:\/\//i.test(value) && !value.startsWith('//')) {
			return value;
		}

		try {
			const parsed = new URL(value.startsWith('//') ? `http:${value}` : value);
			const relative = `${parsed.pathname}${parsed.search}${parsed.hash}`;
			return relative || '/';
		} catch {
			return value;
		}
	};

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

					controller?.postMessage({
						type: 'attachment-download',
						url: fileData.path,
						id: uid,
					});
					return;
				}

				if (!fileData.name) {
					return;
				}

				const rawHref = fileData.path ?? fileData.url;

				if (!rawHref) {
					return;
				}

				const normalizedHref = normalizeFileHref(rawHref);

				if (!normalizedHref) {
					return;
				}

				if (normalizedHref.startsWith('blob:') || normalizedHref.startsWith('data:')) {
					download(normalizedHref, fileData.name);
					if (normalizedHref.startsWith('blob:')) {
						const URL = window.webkitURL ?? window.URL;
						URL.revokeObjectURL(normalizedHref);
					}
					return;
				}

				const href = getURL(normalizedHref);
				download(href, fileData.name);

				if (fileData.url?.startsWith('blob:')) {
					const URL = window.webkitURL ?? window.URL;
					URL.revokeObjectURL(fileData.url);
				}
			},
			disabled: !canDownloadFile,
		},
		...(isDeletionAllowed && onClickDelete
			? [
					{
						id: 'delete',
						content: <Box color='status-font-on-danger'>{t('Delete')}</Box>,
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
