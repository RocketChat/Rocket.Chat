import { IWebdavNode } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Skeleton, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ComponentProps } from 'react';

import { getNodeIconType } from '../lib/getNodeIconType';
import WebdavFilePickerGridItem from './WebdavFilePickerGridItem';

type WebdavFilePickerGridProps = {
	webdavNodes: IWebdavNode[];
	onNodeClick: (file: IWebdavNode) => void;
	isLoading: boolean;
};

const WebdavFilePickerGrid = ({ webdavNodes, onNodeClick, isLoading }: WebdavFilePickerGridProps): ReactElement => {
	const t = useTranslation();

	const hoverStyle = css`
		&:hover {
			background-color: ${colors.n400};
			cursor: pointer;
		}
	`;

	return (
		<Box display='flex' flexWrap='wrap'>
			{isLoading &&
				Array(6)
					.fill('')
					.map((_, index) => (
						<WebdavFilePickerGridItem p='x4' key={index}>
							<Skeleton variant='rect' width='full' height='full' />
						</WebdavFilePickerGridItem>
					))}
			{!isLoading &&
				webdavNodes.map((webdavNode, index) => {
					const { icon } = getNodeIconType(webdavNode.basename, webdavNode.type, webdavNode.mime);

					return (
						<WebdavFilePickerGridItem key={index} className={hoverStyle} onClick={(): void => onNodeClick(webdavNode)}>
							<Icon mie='x4' size='x72' name={icon as ComponentProps<typeof Icon>['name']} />
							<Box textAlign='center'>{webdavNode.basename}</Box>
						</WebdavFilePickerGridItem>
					);
				})}
			{!isLoading && webdavNodes?.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</Box>
	);
};

export default WebdavFilePickerGrid;
