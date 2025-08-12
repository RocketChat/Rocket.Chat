import type { App } from '@rocket.chat/core-typings';
import { Badge, Card, CardBody, CardCol, CardControls, CardHeader, CardRow, CardTitle } from '@rocket.chat/fuselage';
import { AppAvatar } from '@rocket.chat/ui-avatar';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { memo } from 'react';
import semver from 'semver';

import AppStatus from '../AppDetailsPage/tabs/AppStatus/AppStatus';
import AppMenu from '../AppMenu';
import BundleChips from '../BundleChips';
import AddonChip from './AddonChip';

// TODO: org props
const AppRow = ({ className, ...props }: App & { className?: string }): ReactElement => {
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
		<div role='listitem' className={className} key={id}>
			<Card
				data-qa-type='app-row'
				horizontal
				clickable
				role='link'
				aria-labelledby={`${id}-title`}
				aria-describedby={`${id}-description`}
				onClick={handleNavigateToAppInfo}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				<CardRow>
					<AppAvatar size='x40' iconFileContent={iconFileContent} iconFileData={iconFileData} />
					<CardCol>
						<CardHeader>
							<CardTitle variant='h5' id={`${id}-title`}>
								{name}
							</CardTitle>
							{Boolean(bundledIn?.length) && <BundleChips bundledIn={bundledIn} />}
							<AddonChip app={props} />
						</CardHeader>
						{shortDescription && <CardBody id={`${id}-description`}>{shortDescription}</CardBody>}
					</CardCol>
				</CardRow>
				<CardControls onClick={preventClickPropagation}>
					{canUpdate && <Badge small variant='primary' />}
					<AppStatus app={props} isAppDetailsPage={false} installed={installed} />
					<AppMenu app={props} isAppDetailsPage={false} />
				</CardControls>
			</Card>
		</div>
	);
};

export default memo(AppRow);
