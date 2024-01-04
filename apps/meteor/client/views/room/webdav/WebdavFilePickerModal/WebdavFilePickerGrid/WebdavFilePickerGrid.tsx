import type { IWebdavNode } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Skeleton, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import GenericNoResults from '../../../../../components/GenericNoResults';
import { getNodeIconType } from '../lib/getNodeIconType';
import WebdavFilePickerGridItem from './WebdavFilePickerGridItem';

type WebdavFilePickerGridProps = {
	webdavNodes: IWebdavNode[];
	onNodeClick: (file: IWebdavNode) => void;
	isLoading: boolean;
};

const WebdavFilePickerGrid = ({ webdavNodes, onNodeClick, isLoading }: WebdavFilePickerGridProps): ReactElement => {
	const hoverStyle = css`
		&:hover {
			background-color: ${Palette.surface['surface-neutral']};
			cursor: pointer;
		}
	`;

	return (
		<Box display='flex' flexWrap='wrap'>
			{isLoading &&
				Array(6)
					.fill('')
					.map((_, index) => (
						<WebdavFilePickerGridItem p={4} key={index}>
							<Skeleton variant='rect' width='full' height='full' />
						</WebdavFilePickerGridItem>
					))}
			{!isLoading &&
				webdavNodes.map((webdavNode, index) => {
					const { icon } = getNodeIconType(webdavNode.basename, webdavNode.type, webdavNode.mime);

					return (
						<WebdavFilePickerGridItem key={index} className={hoverStyle} onClick={(): void => onNodeClick(webdavNode)}>
							<Icon mie={4} size='x72' name={icon} />
							<Box textAlign='center'>{webdavNode.basename}</Box>
						</WebdavFilePickerGridItem>
					);
				})}
			{!isLoading && webdavNodes?.length === 0 && <GenericNoResults />}
		</Box>
	);
};

export default WebdavFilePickerGrid;
