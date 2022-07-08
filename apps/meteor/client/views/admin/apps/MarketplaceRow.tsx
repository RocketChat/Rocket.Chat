import { css } from '@rocket.chat/css-in-js';
import { Box, Table } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useRoute } from '@rocket.chat/ui-contexts';
import React, { useState, memo, FC, KeyboardEvent, MouseEvent } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import { App } from './types';

const MarketplaceRow: FC<App> = ({ ...props }) => {
	const { name, id, description, iconFileData, marketplaceVersion, iconFileContent, installed, isSubscribed } = props;
	// const t = useTranslation();

	const [isFocused, setFocused] = useState(false);
	const [isHovered, setHovered] = useState(false);
	const isStatusVisible = isFocused || isHovered;

	const marketplaceRoute = useRoute('admin-marketplace');

	const handleClick = (): void => {
		marketplaceRoute.push({
			context: 'details',
			version: marketplaceVersion,
			id,
		});
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLOrSVGElement>): void => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const preventClickPropagation = (e: MouseEvent<HTMLOrSVGElement>): void => {
		e.stopPropagation();
	};

	const hover = css`
		&:hover,
		&:focus {
			cursor: pointer;
			outline: 0;
			background-color: ${colors.n200} !important;
		}
	`;

	return (
		<Table.Row
			key={id}
			role='link'
			action
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onFocus={(): void => setFocused(true)}
			onBlur={(): void => setFocused(false)}
			onMouseEnter={(): void => setHovered(true)}
			onMouseLeave={(): void => setHovered(false)}
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignItems='center'
			bg='surface'
			mbe='x8'
			pb='x8'
			pis='x16'
			pie='x40'
			className={hover}
		>
			<Box display='flex' flexDirection='row' width='80%'>
				<AppAvatar size='x40' mie='x16' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' alignItems='center' color='default' fontScale='p2m' mie='x16' style={{ whiteSpace: 'nowrap' }}>
					{name}
				</Box>
				<Box display='flex' alignItems='center' color='default' withTruncatedText>
					{description}
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='flex-end' onClick={preventClickPropagation} width='20%'>
				<AppStatus app={props} showStatus={isStatusVisible} isAppDetailsPage={false} mis='x4' />
				{(installed || isSubscribed) && <AppMenu app={props} invisible={!isStatusVisible} mis='x4' />}
			</Box>
		</Table.Row>
	);
};

export default memo(MarketplaceRow);
