import { IWebdavNode } from '@rocket.chat/core-typings';
import { Modal, Box, Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, ReactElement, useEffect, useCallback } from 'react';

import FilterByText from '../../../../components/FilterByText';
import FilePickerBreadcrumbs from './FilePickerBreadcrumbs';
import WebdavFilePickerTable from './WebdavFilePickerTable';

type WebdavFilePickerModalProps = {
	onClose: () => void;
	// TO-DO: WebdavIntegration from definition
	account: any;
};

const WebdavFilePickerModal = ({ onClose, account }: WebdavFilePickerModalProps): ReactElement => {
	const t = useTranslation();
	const getWebdavFileList = useMethod('getWebdavFileList');
	const getWebdavFilePreview = useMethod('getWebdavFilePreview');
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const [typeView, setTypeView] = useState<'list' | 'grid'>('list');
	const [currentFolder, setCurrentFolder] = useState('/');
	const [parentFolders, setParentFolders] = useState<Array<string>>([]);
	const [text, setText] = useState('');
	const [webdavNodes, setWebdavNodes] = useState<Array<IWebdavNode>>([]);

	console.log('account', account);
	console.log('currentFolder', currentFolder);

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
						console.log(res);
						const blob = new Blob([res.data], { type: 'image/png' });
						const imgURL = URL.createObjectURL(blob);
						nodes[index].preview = imgURL;
					})
					.catch((e) => e);
			})
			.filter(Boolean);

		return Promise.all(promises)
			.then(() => {
				console.log(nodes);
				return nodes;
			})
			.catch((e) => e);
	});

	const handleGetWebdavFileList = useMutableCallback(async (): Promise<void> => {
		setIsLoading(true);
		let result;
		try {
			result = await getWebdavFileList(account._id, currentFolder);
			console.log(result);
			setWebdavNodes(result.data);
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: error });
			onClose();
		} finally {
			setIsLoading(false);
			const nodesWithPreviews = await showFilePreviews(account._id, result?.data);
			// console.log(nodesWithPreviews);
			// if (Array.isArray(nodesWithPreviews) && nodesWithPreviews.length) {
			// 	instance.state.set({ unfilteredWebdavNodes: nodesWithPreviews });
			// }
		}
	});

	const handleBreadcrumb = (el) => {
		// const index = $(event.target).data('index');
		const index = 0;
		console.log(el.target);

		const parentFolders = currentFolder.split('/').filter((s) => s);
		// determine parent directory to go to
		let targetFolder = '/';
		for (let i = 0; i <= index; i++) {
			targetFolder += parentFolders[i];
			targetFolder += '/';
		}
		setCurrentFolder(targetFolder);
	};

	const handleFilterNodes = (value) => {
		console.log(value);
		// const input = this.searchText.get();
		// const regex = new RegExp(`\\b${value}`, 'i');
		// const filteredNodes = webdavNodes.filter(({ basename }) => basename.match(regex));
		// setWebdavNodes(filteredNodes);
	};

	useEffect(() => {
		handleGetWebdavFileList();
	}, [handleGetWebdavFileList]);

	useEffect(() => {
		setParentFolders(currentFolder?.split('/').filter((s) => s) || []);
	}, [currentFolder]);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Upload_From', { name: account.name })}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box display='flex' justifyContent='space-between'>
					<FilePickerBreadcrumbs parentFolders={parentFolders} handleBreadcrumb={handleBreadcrumb} />
					<Box>
						{typeView === 'list' && (
							<Button title={t('Grid_view')} ghost small onClick={(): void => setTypeView('grid')}>
								<Icon size='x20' name='squares' />
							</Button>
						)}
						{typeView === 'grid' && (
							<Button title={t('List_view')} ghost small onClick={(): void => setTypeView('list')}>
								<Icon size='x20' name='th-list' />
							</Button>
						)}
					</Box>
				</Box>
				<FilterByText onChange={({ text }): void => handleFilterNodes(text)} />
				{typeView === 'list' && (
					<WebdavFilePickerTable webdavNodes={webdavNodes} setCurrentFolder={setCurrentFolder} isLoading={isLoading} />
				)}
			</Modal.Content>
			<Modal.Footer />
		</Modal>
	);
};

export default WebdavFilePickerModal;
