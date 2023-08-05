import type { App } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Palette } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import React, { memo } from 'react';
import semver from 'semver';

import AppAvatar from '../../../components/avatar/AppAvatar';
import AppStatus from '../AppDetailsPage/tabs/AppStatus/AppStatus';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';

// TODO: org props
const AppRow = (props: App): ReactElement => {
	const { name, id, shortDescription, iconFileData, marketplaceVersion, iconFileContent, installed, bundledIn, version } = props;
	const breakpoints = useBreakpoints();

	const router = useRouter();
	const context = useRouteParameter('context');

	const isMobile = !breakpoints.includes('md');

	const handleNavigateToAppInfo = () => {
		if (!context) {
			return;
		}
		router.navigate({
			name: 'marketplace',
			params: {
				context,
				page: 'info',
				version: marketplaceVersion || version,
				id,
				tab: 'details',
			},
		});
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLOrSVGElement>) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleNavigateToAppInfo();
	};

	const preventClickPropagation = (e: MouseEvent<HTMLOrSVGElement>) => {
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
			mbe={8}
			pb={8}
			pi={16}
			borderRadius='x4'
			className={hoverClass}
			bg='light'
		>
			<Box display='flex' flexDirection='row' width='80%'>
				<AppAvatar size='x40' mie={16} alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' alignItems='center' fontScale='p2m' mie={16} withTruncatedText>
					<Box withTruncatedText fontScale='h5' color='title-labels'>
						{name}
					</Box>
				</Box>
				<Box display='flex' mie={16} alignItems='center'>
					{bundledIn && Boolean(bundledIn.length) && (
						<Box display='flex' alignItems='center'>
							<BundleChips bundledIn={bundledIn} />
						</Box>
					)}
					{shortDescription && !isMobile && (
						<Box is='span' mis={16} fontScale='c1'>
							{shortDescription}
						</Box>
					)}
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' width='20%' alignItems='center' justifyContent='flex-end' onClick={preventClickPropagation}>
				{canUpdate && (
					<Box mie={8}>
						<Badge small variant='primary' />
					</Box>
				)}
				<AppStatus app={props} isAppDetailsPage={false} installed={installed} />
				<Box minWidth='x32'>
					<AppMenu app={props} isAppDetailsPage={false} mis={4} />
				</Box>
			</Box>
		</Box>
	);
};

export default memo(AppRow);
