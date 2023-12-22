import type { App } from '@rocket.chat/core-typings';
import { Badge, Card, CardBody, CardCol, CardControls, CardHeader, CardRow, CardTitle } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import React, { memo } from 'react';
import semver from 'semver';

import AppAvatar from '../../../components/avatar/AppAvatar';
import AppStatus from '../AppDetailsPage/tabs/AppStatus/AppStatus';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';

// TODO: org props
const AppRow = ({ className, ...props }: App & { className: string }): ReactElement => {
	const { name, id, shortDescription, iconFileData, marketplaceVersion, iconFileContent, installed, bundledIn, version } = props;

	const router = useRouter();
	const context = useRouteParameter('context');

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
		<div role='listitem' className={className}>
			<Card
				horizontal
				clickable
				role='link'
				aria-labelledby={`${id}-title`}
				aria-describedby={`${id}-description`}
				onClick={handleNavigateToAppInfo}
				onKeyDown={handleKeyDown}
				key={id}
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
					<AppStatus app={props} isAppDetailsPage={false} installed={installed} />
					<AppMenu app={props} isAppDetailsPage={false} mis={4} />
				</CardControls>
			</Card>
		</div>
	);
};

export default memo(AppRow);
