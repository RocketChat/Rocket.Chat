import type { App } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Card, CardBody, CardCol, CardControls, CardHeader, CardRow, CardTitle, Palette } from '@rocket.chat/fuselage';
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
	const { name, id, shortDescription, iconFileData, marketplaceVersion, iconFileContent, installed, bundledIn, version, className } = props;
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

	const canUpdate = installed && version && marketplaceVersion && semver.lt(version, marketplaceVersion);

	return (
		<Card
			horizontal
			role='link'
			aria-labelledby={`${id}-title`}
			aria-describedby={`${id}-description`}
			onClick={handleNavigateToAppInfo}
			onKeyDown={handleKeyDown}
			role='listitem'
			key={id}
			className={className}
			// className={hoverClass}
		>
			<CardRow>
				<CardCol>
					<AppAvatar size='x40' iconFileContent={iconFileContent} iconFileData={iconFileData} />
				</CardCol>
				<CardCol>
					<CardHeader>
						<CardTitle variant='h5' id={`${id}-title`}>
							{name}
						</CardTitle>
						{Boolean(bundledIn.length) && <BundleChips bundledIn={bundledIn} />}
					</CardHeader>
					{shortDescription && <CardBody id={`${id}-description`}>{shortDescription}</CardBody>}
				</CardCol>
			</CardRow>
			<CardControls onClick={preventClickPropagation} style={{ justifyContent: 'flex-end' }}>
				{canUpdate && <Badge small variant='primary' />}
				<Badge small variant='primary' />
				<AppStatus app={props} isAppDetailsPage={false} installed={installed} />
				<AppMenu app={props} isAppDetailsPage={false} mis={4} />
			</CardControls>
		</Card>
	);
};

export default memo(AppRow);
