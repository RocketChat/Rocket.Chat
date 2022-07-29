import { IWebdavNode } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ComponentProps } from 'react';

import { timeAgo } from '../../../../../app/ui/client/views/app/helpers';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';

const getFileSize = (type: string, size: number): string => {
	if (type === 'directory') {
		return '';
	}
	const bytes = size;
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getNodeIconType = (
	basename: string,
	fileType: string,
	mime: string,
): { icon: ComponentProps<typeof Icon['name']>; type: string; extension: string } => {
	// add icon for different types
	let icon = 'clip';
	let type = '';

	let extension = basename.split('.').pop();
	if (extension === basename) {
		extension = '';
	}

	if (fileType === 'directory') {
		icon = 'folder';
		type = 'directory';
	} else if (mime.match(/application\/pdf/)) {
		icon = 'file-pdf';
		type = 'pdf';
	} else if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-document';
		type = 'document';
	} else if (
		[
			'application/vnd.ms-excel',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		].includes(mime)
	) {
		icon = 'file-sheets';
		type = 'sheets';
	} else if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-sheets';
		type = 'ppt';
	}
	return { icon, type, extension };
};

type WebdavFilePickerTableProps = {
	webdavNodes: Array<IWebdavNode>;
	setCurrentFolder: (folder: string) => void;
	isLoading: boolean;
};

const WebdavFilePickerTable = ({ webdavNodes, setCurrentFolder, isLoading }: WebdavFilePickerTableProps): ReactElement => {
	const t = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<string>('name');

	console.log(webdavNodes);

	const handleClick = (fileName: IWebdavNode['filename'], type: IWebdavNode['type']): void => {
		if (type === 'directory') {
			setCurrentFolder(fileName);
		}
	};

	return (
		<Box display='flex' flexDirection='column' overflowY='hidden' height='x256'>
			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell
						width='300px'
						key='name'
						direction={sortDirection}
						active={sortBy[0] === 'name'}
						onClick={setSort}
						sort='name'
					>
						{t('Name')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='size' direction={sortDirection} active={sortBy[1] === 'size'} onClick={setSort} sort='size'>
						{t('Size')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key='dataModified'
						direction={sortDirection}
						active={sortBy[2] === 'dataModified'}
						onClick={setSort}
						sort='dataModified'
					>
						{t('Data_modified')}
					</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{isLoading &&
						Array(5)
							.fill('')
							.map((_, index) => <GenericTableLoadingRow key={index} cols={3} />)}
					{!isLoading &&
						webdavNodes?.length > 0 &&
						webdavNodes?.map((webdavNode, index) => {
							const { icon, type, extension } = getNodeIconType(webdavNode.basename, webdavNode.type, webdavNode.mime);

							console.log({ icon, type, extension });
							return (
								<GenericTableRow
									key={index}
									// onKeyDown={onClick(emojis._id)}
									onClick={() => handleClick(webdavNode.filename, webdavNode.type)}
									tabIndex={0}
									role='link'
									action
									// qa-emoji-id={emojis._id}
								>
									<GenericTableCell fontScale='p2' color='default' w='x200' display='flex' alignItems='center'>
										<Icon mie='x4' size='x20' name={icon} />
										<Box withTruncatedText>{webdavNode.basename}</Box>
									</GenericTableCell>
									<GenericTableCell fontScale='p2' color='default'>
										<Box withTruncatedText>{getFileSize(webdavNode.type, webdavNode?.size)}</Box>
									</GenericTableCell>
									<GenericTableCell fontScale='p2' color='default'>
										<Box withTruncatedText>{timeAgo(new Date(), t)}</Box>
									</GenericTableCell>
								</GenericTableRow>
							);
						})}
				</GenericTableBody>
			</GenericTable>
		</Box>
	);
};

export default WebdavFilePickerTable;
