import type { App } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Palette } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import React, { memo } from 'react';
import semver from 'semver';

import AppAvatar from '../../../../components/avatar/AppAvatar';
import AppStatus from '../AppDetailsPage/tabs/AppStatus/AppStatus';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';

type AppRowProps = App & { isMarketplace: boolean };

// TODO: org props
const AppRow = (props: AppRowProps): ReactElement => {
	const { name, id, shortDescription, iconFileData, marketplaceVersion, iconFileContent, installed, bundledIn, version } = props;
	const breakpoints = useBreakpoints();
	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);
	const context = useRouteParameter('context');

	const isMobile = !breakpoints.includes('md');

	const handleNavigateToAppInfo = (): void => {
		context &&
			router.push({
				context,
				page: 'info',
				version: marketplaceVersion,
				id,
			});
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLOrSVGElement>): void => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleNavigateToAppInfo();
	};

	const preventClickPropagation = (e: MouseEvent<HTMLOrSVGElement>): void => {
		e.stopPropagation();
	};

	const hoverClass = css`
		&:hover,
		&:focus {
			cursor: pointer;
			outline: 0;
			background-color: ${Palette.surface['surface-hover']} !important;
		}
	`;

	const canUpdate = installed && version && marketplaceVersion && semver.lt(version, marketplaceVersion);

	return (
		<Box
			key={id}
			role='link'
			tabIndex={0}
			onClick={handleNavigateToAppInfo}
			onKeyDown={handleKeyDown}
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignItems='center'
			mbe='x8'
			pb='x8'
			pi='x16'
			borderRadius='x4'
			className={hoverClass}
			bg='light'
		>
			<Box display='flex' flexDirection='row' width='80%'>
				<AppAvatar size='x40' mie='x16' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' alignItems='center' color='default' fontScale='p2m' mie='x16' withTruncatedText>
					<Box withTruncatedText>{name}</Box>
				</Box>
				<Box display='flex' mie='x16' alignItems='center' color='default'>
					{bundledIn && Boolean(bundledIn.length) && (
						<Box display='flex' alignItems='center' color='default'>
							<BundleChips bundledIn={bundledIn} />
						</Box>
					)}
					{shortDescription && !isMobile && (
						<Box is='span' mis='x16'>
							{shortDescription}
						</Box>
					)}
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' width='20%' alignItems='center' justifyContent='flex-end' onClick={preventClickPropagation}>
				{canUpdate && (
					<Box mie='x8'>
						<Badge small variant='primary' />
					</Box>
				)}
				<AppStatus app={props} isAppDetailsPage={false} installed={installed} />
				<Box minWidth='x32'>
					<AppMenu app={props} isAppDetailsPage={false} mis='x4' />
				</Box>
			</Box>
		</Box>
	);
};

export default memo(AppRow);
