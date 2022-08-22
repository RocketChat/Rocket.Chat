import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useMediaQueries } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useRoute } from '@rocket.chat/ui-contexts';
import React, { FC, memo, KeyboardEvent, MouseEvent } from 'react';

import AppAvatar from '../../../components/avatar/AppAvatar';
import AppMenu from './AppMenu';
import AppStatus from './AppStatus';
import BundleChips from './BundleChips';
import { App } from './types';

const AppRow: FC<App & { isMarketplace: boolean }> = (props) => {
	const { name, id, description, iconFileData, marketplaceVersion, iconFileContent, installed, isSubscribed, isMarketplace, bundledIn } =
		props;

	const [isAppNameTruncated, isBundleTextVisible, isDescriptionVisible] = useMediaQueries(
		'(max-width: 510px)',
		'(max-width: 887px)',
		'(min-width: 1200px)',
	);

	const appsRoute = useRoute('admin-apps');
	const marketplaceRoute = useRoute('admin-marketplace');

	const handleClick = (): void => {
		if (isMarketplace) {
			marketplaceRoute.push({
				context: 'details',
				version: marketplaceVersion,
				id,
			});
			return;
		}

		appsRoute.push({
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
		<Box
			key={id}
			role='link'
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignItems='center'
			bg='surface'
			mbe='x8'
			pb='x8'
			pis='x16'
			pie='x4'
			className={hover}
		>
			<Box display='flex' flexDirection='row' width='80%'>
				<AppAvatar size='x40' mie='x16' alignSelf='center' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				<Box display='flex' alignItems='center' color='default' fontScale='p2m' mie='x16' style={{ whiteSpace: 'nowrap' }}>
					<Box is='span' withTruncatedText={isAppNameTruncated}>
						{name}
					</Box>
				</Box>
				<Box display='flex' mie='x16' alignItems='center' color='default'>
					{bundledIn && Boolean(bundledIn.length) && (
						<Box display='flex' alignItems='center' color='default' mie='x16'>
							<BundleChips bundledIn={bundledIn} isIconOnly={isBundleTextVisible} />
						</Box>
					)}
					{isDescriptionVisible && (
						<Box is='span' withTruncatedText width='x369'>
							{description}
						</Box>
					)}
				</Box>
			</Box>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='flex-end' onClick={preventClickPropagation} width='20%'>
				<AppStatus app={props} isSubscribed={isSubscribed} isAppDetailsPage={false} installed={installed} mis='x4' />
				<Box minWidth='x32'>{(installed || isSubscribed) && <AppMenu app={props} mis='x4' />}</Box>
			</Box>
		</Box>
	);
};

export default memo(AppRow);
