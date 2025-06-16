import type { IWebdavNode } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { WebdavSortOptions } from './WebdavFilePickerModal';
import { getNodeFileSize } from './lib/getNodeFileSize';
import { getNodeIconType } from './lib/getNodeIconType';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { timeAgo } from '../../../../lib/utils/timeAgo';

type WebdavFilePickerTableProps = {
	webdavNodes: IWebdavNode[];
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	onSort: (sortBy: WebdavSortOptions, sortDirection?: 'asc' | 'desc') => void;
	onNodeClick: (webdavNode: IWebdavNode) => void;
	isLoading: boolean;
};

const WebdavFilePickerTable = ({
	webdavNodes,
	sortBy,
	sortDirection,
	onSort,
	onNodeClick,
	isLoading,
}: WebdavFilePickerTableProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='column' overflowY='hidden' height='x256'>
			{(isLoading || webdavNodes?.length > 0) && (
				<GenericTable>
					<GenericTableHeader>
						<GenericTableHeaderCell
							width='300px'
							key='name'
							direction={sortDirection}
							active={sortBy === 'name'}
							onClick={onSort}
							sort='name'
						>
							{t('Name')}
						</GenericTableHeaderCell>
						<GenericTableHeaderCell key='size' direction={sortDirection} active={sortBy === 'size'} onClick={onSort} sort='size'>
							{t('Size')}
						</GenericTableHeaderCell>
						<GenericTableHeaderCell
							key='dataModified'
							direction={sortDirection}
							active={sortBy === 'dataModified'}
							onClick={onSort}
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
							webdavNodes?.map((webdavNode, index) => {
								const { icon } = getNodeIconType(webdavNode.basename, webdavNode.type, webdavNode.mime);

								return (
									<GenericTableRow key={index} onClick={(): void => onNodeClick(webdavNode)} tabIndex={index} role='link' action>
										<GenericTableCell fontScale='p2' color='default' w='x200' display='flex' alignItems='center'>
											<Icon mie={4} size='x20' name={icon} />
											<Box withTruncatedText>{webdavNode.basename}</Box>
										</GenericTableCell>
										<GenericTableCell fontScale='p2' color='default'>
											<Box withTruncatedText>{getNodeFileSize(webdavNode.type, webdavNode?.size)}</Box>
										</GenericTableCell>
										<GenericTableCell fontScale='p2' color='default'>
											<Box withTruncatedText>{timeAgo(new Date())}</Box>
										</GenericTableCell>
									</GenericTableRow>
								);
							})}
					</GenericTableBody>
				</GenericTable>
			)}
			{!isLoading && webdavNodes?.length === 0 && <GenericNoResults />}
		</Box>
	);
};

export default WebdavFilePickerTable;
