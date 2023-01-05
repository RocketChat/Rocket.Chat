import type { IWebdavNode, IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Modal, Box, IconButton, Select } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMethod, useToastMessageDispatch, useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement, MouseEvent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';

import { fileUploadIsValidContentType } from '../../../../../app/utils/client';
import FilterByText from '../../../../components/FilterByText';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import FileUploadModal from '../../modals/FileUploadModal';
import FilePickerBreadcrumbs from './FilePickerBreadcrumbs';
import WebdavFilePickerGrid from './WebdavFilePickerGrid';
import WebdavFilePickerTable from './WebdavFilePickerTable';
import { sortWebdavNodes } from './lib/sortWebdavNodes';

export type WebdavSortOptions = 'name' | 'size' | 'dataModified';

type WebdavFilePickerModalProps = {
	onUpload: (file: File, description?: string) => Promise<void>;
	onClose: () => void;
	account: IWebdavAccountIntegration;
};

const WebdavFilePickerModal = ({ onUpload, onClose, account }: WebdavFilePickerModalProps): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const getWebdavFilePreview = useMethod('getWebdavFilePreview');
	const getWebdavFileList = useMethod('getWebdavFileList');
	const getFileFromWebdav = useMethod('getFileFromWebdav');
	const dispatchToastMessage = useToastMessageDispatch();
	const [typeView, setTypeView] = useState<'list' | 'grid'>('list');
	const { sortBy, sortDirection, setSort } = useSort<WebdavSortOptions>('name');
	const [currentFolder, setCurrentFolder] = useState('/');
	const [parentFolders, setParentFolders] = useState<string[]>([]);
	const [webdavNodes, setWebdavNodes] = useState<IWebdavNode[]>([]);
	const [filterText, setFilterText] = useState('');
	const debouncedFilter = useDebouncedValue(filterText, 500);
	const [isLoading, setIsLoading] = useState(false);

	const showFilePreviews = useMutableCallback(async (accountId, nodes) => {
		if (!Array.isArray(nodes) || !nodes.length) {
			return;
		}
		const promises = nodes
			.map((node, index) => {
				if (node.type !== 'file') {
					return;
				}
				return getWebdavFilePreview(accountId, node.filename)
					.then((res) => {
						const blob = new Blob([res.data], { type: 'image/png' });
						const imgURL = URL.createObjectURL(blob);
						nodes[index].preview = imgURL;
					})
					.catch((e) => e);
			})
			.filter(Boolean);

		return Promise.all(promises)
			.then(() => nodes)
			.catch((e) => e);
	});

	const handleFilterNodes = useCallback(
		(webdavNodes: IWebdavNode[]): void => {
			const regex = new RegExp(`\\b${debouncedFilter}`, 'i');
			const filteredNodes = webdavNodes.filter(({ basename }) => basename.match(regex));
			return setWebdavNodes(filteredNodes);
		},
		[debouncedFilter],
	);

	const handleGetWebdavFileList = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		let result;
		try {
			result = await getWebdavFileList(account._id, currentFolder);
			handleFilterNodes(result.data);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onClose();
		} finally {
			setIsLoading(false);
			const nodesWithPreviews = await showFilePreviews(account._id, result?.data);
			if (Array.isArray(nodesWithPreviews) && nodesWithPreviews.length) {
				handleFilterNodes(nodesWithPreviews);
			}
		}
	}, [account._id, currentFolder, dispatchToastMessage, getWebdavFileList, onClose, showFilePreviews, handleFilterNodes]);

	const handleBreadcrumb = (e: MouseEvent<HTMLElement>): void => {
		const { index } = e.currentTarget.dataset;
		const parentFolders = currentFolder.split('/').filter((s) => s);

		// determine parent directory to go to
		let targetFolder = '/';
		for (let i = 0; i <= Number(index); i++) {
			targetFolder += parentFolders[i];
			targetFolder += '/';
		}
		setCurrentFolder(targetFolder);
	};

	const handleBack = (): void => {
		let newCurrentFolder = currentFolder;
		// determine parent directory to go back
		let parentFolder = '/';
		if (newCurrentFolder && newCurrentFolder !== '/') {
			if (newCurrentFolder[newCurrentFolder.length - 1] === '/') {
				newCurrentFolder = newCurrentFolder.slice(0, -1);
			}
			parentFolder = newCurrentFolder.substr(0, newCurrentFolder.lastIndexOf('/') + 1);
		}
		setCurrentFolder(parentFolder);
	};

	const handleNodeClick = (webdavNode: IWebdavNode): void | Promise<void> => {
		if (webdavNode.type === 'directory') {
			return setCurrentFolder(webdavNode.filename);
		}

		return handleUpload(webdavNode);
	};

	const handleUpload = async (webdavNode: IWebdavNode): Promise<void> => {
		setIsLoading(true);

		const uploadFile = async (file: File, description?: string): Promise<void> => {
			try {
				await onUpload?.(file, description);
			} catch (error) {
				return dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setIsLoading(false);
				onClose();
			}
		};

		try {
			const { data } = await getFileFromWebdav(account._id, webdavNode);
			const blob = new Blob([data]);
			const file = new File([blob], webdavNode.basename, { type: webdavNode.mime });

			setModal(
				<FileUploadModal
					fileName={webdavNode.basename}
					onSubmit={(_, description): Promise<void> => uploadFile(file, description)}
					file={file}
					onClose={(): void => setModal(null)}
					invalidContentType={Boolean(file.type && !fileUploadIsValidContentType(file.type))}
				/>,
			);
		} catch (error) {
			return dispatchToastMessage({ type: 'error', message: error });
		}
	};

	useEffect(() => {
		handleGetWebdavFileList();
	}, [handleGetWebdavFileList]);

	useEffect(() => {
		setParentFolders(currentFolder?.split('/').filter((s) => s) || []);
	}, [currentFolder]);

	const options: SelectOption[] = [
		['name', 'Name'],
		['size', 'Size'],
		['dataModified', 'Data Modified'],
	];

	const handleSort = (sortBy: WebdavSortOptions, sortDirection?: 'asc' | 'desc'): void => {
		setSort(sortBy);
		const sortedNodes = sortWebdavNodes(webdavNodes, sortBy, sortDirection);
		return setWebdavNodes(sortedNodes);
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Upload_From', { name: account.name })}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box display='flex' justifyContent='space-between'>
					<FilePickerBreadcrumbs parentFolders={parentFolders} handleBreadcrumb={handleBreadcrumb} handleBack={handleBack} />
					<Box>
						{typeView === 'list' && <IconButton icon='squares' small title={t('Grid_view')} onClick={(): void => setTypeView('grid')} />}
						{typeView === 'grid' && <IconButton icon='th-list' small title={t('List_view')} onClick={(): void => setTypeView('list')} />}
					</Box>
				</Box>
				<Box display='flex' flexDirection='column'>
					<FilterByText onChange={({ text }): void => setFilterText(text)}>
						{typeView === 'grid' && (
							<Select value={sortBy} onChange={(value): void => handleSort(value as WebdavSortOptions)} options={options} />
						)}
					</FilterByText>
				</Box>
				{typeView === 'list' && (
					<WebdavFilePickerTable
						webdavNodes={webdavNodes}
						sortBy={sortBy}
						sortDirection={sortDirection}
						onSort={handleSort}
						onNodeClick={handleNodeClick}
						isLoading={isLoading}
					/>
				)}
				{typeView === 'grid' && <WebdavFilePickerGrid webdavNodes={webdavNodes} onNodeClick={handleNodeClick} isLoading={isLoading} />}
			</Modal.Content>
			<Modal.Footer />
		</Modal>
	);
};

export default WebdavFilePickerModal;
