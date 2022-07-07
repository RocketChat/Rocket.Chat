import { Box } from '@rocket.chat/fuselage';
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

	return (
		<Box
			key={id}
			role='link'
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
		>
			<Box withTruncatedText display='flex' flexDirection='row'>
				<AppAvatar size='x40' mie='x16' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' alignItems='center' color='default' fontScale='p2m' mie='x16'>
					{name}
				</Box>
				<Box display='flex' alignItems='center' color='default' withTruncatedText>
					{description}
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' alignItems='center' marginInline='neg-x8' onClick={preventClickPropagation}>
				<AppStatus app={props} showStatus={isStatusVisible} isAppDetailsPage={false} mis='x4' />
				{(installed || isSubscribed) && <AppMenu app={props} invisible={!isStatusVisible} mis='x4' />}
			</Box>
		</Box>
	);
};

export default memo(MarketplaceRow);
