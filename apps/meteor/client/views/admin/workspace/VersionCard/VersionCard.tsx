import type { IWorkspaceInfo } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { SupportedVersions } from '@rocket.chat/server-cloud-communication';
import { Card, CardBody, CardCol, CardColSection, CardColTitle, CardFooter, ExternalLink } from '@rocket.chat/ui-client';
import type { CSSProperties, ReactElement } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import semver from 'semver';

import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useLicense } from '../../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../../hooks/useRegistrationStatus';
import { isOverLicenseLimits } from '../../../../lib/utils/isOverLicenseLimits';
import VersionCardActionButton from './components/VersionCardActionButton';
import type { VersionActionButton } from './components/VersionCardActionButton';
import type { VersionActionItem } from './components/VersionCardActionItem';
import VersionCardActionItemList from './components/VersionCardActionItemList';
import { VersionCardSkeleton } from './components/VersionCardSkeleton';
import { VersionTag } from './components/VersionTag';
import type { VersionStatus } from './components/VersionTag';

const SUPPORT_EXTERNAL_LINK = 'https://go.rocket.chat/i/version-support';
const RELEASES_EXTERNAL_LINK = 'https://go.rocket.chat/i/update-product';

type VersionCardProps = {
	serverInfo: IWorkspaceInfo;
};

const VersionCard = ({ serverInfo }: VersionCardProps): ReactElement => {
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const style: CSSProperties = {
		backgroundImage: 'url(images/globe.png)',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'right 20px center',
		backgroundSize: mediaQuery ? 'auto' : 'contain',
	};

	const { t } = useTranslation();

	const formatDate = useFormatDate();

	const { data: licenseData, isLoading, refetch: refetchLicense } = useLicense();
	const { data: regStatus } = useRegistrationStatus();

	const [actionItems, setActionItems] = useState<VersionActionItem[]>([]);
	const [actionButton, setActionButton] = useState<VersionActionButton>();
	const [versionStatus, setVersionStatus] = useState<VersionStatus>();

	const isRegistered = regStatus?.registrationStatus.workspaceRegistered || false;

	const { license, tags, trial, limits } = licenseData?.license || {};
	const isAirgapped = license?.information?.offline;
	const licenseName = tags?.[0]?.name ?? 'Community';
	const isTrial = trial;
	const visualExpiration = formatDate(license?.information?.visualExpiration || '');
	const licenseLimits = limits;
	const serverVersion = serverInfo.version;
	const supportedVersions = useMemo(
		() => decodeBase64(serverInfo?.supportedVersions?.signed || ''),
		[serverInfo?.supportedVersions?.signed],
	);

	const getVersionStatus = (serverVersion: string, versions: { version: string }[]): VersionStatus => {
		const coercedServerVersion = String(semver.coerce(serverVersion));
		const highestVersion = versions.reduce((prev, current) => (prev.version > current.version ? prev : current));
		const isSupported = versions.some((v) => v.version === coercedServerVersion || v.version === serverVersion);

		if (semver.gte(coercedServerVersion, highestVersion.version)) {
			return 'latest';
		}

		if (isSupported && semver.gt(highestVersion.version, coercedServerVersion)) {
			return 'available_version';
		}

		return 'outdated';
	};

	const getActionItems = useCallback(() => {
		const items: VersionActionItem[] = [];
		let btn;
		const isOverLimits = licenseLimits ? isOverLicenseLimits(licenseLimits) : false;

		if (isOverLimits) {
			items.push({
				type: 'danger',
				icon: 'warning',
				label: <Trans i18nKey='Plan_limits_reached' />,
			});

			btn = { path: '/admin/manage-subscription', label: <Trans i18nKey='Manage_subscription' /> };
		} else {
			items.push({
				type: 'neutral',
				icon: 'check',
				label: <Trans i18nKey='Operating_withing_plan_limits' />,
			});
		}

		if (isAirgapped) {
			items.push({
				type: 'neutral',
				icon: 'warning',
				label: (
					<Trans i18nKey='Check_support_availability'>
						Check
						<ExternalLink textDecorationLine='underline' color='unset' to={SUPPORT_EXTERNAL_LINK}>
							support
						</ExternalLink>
						availability
					</Trans>
				),
			});
		}

		if (versionStatus && versionStatus !== 'outdated') {
			items.push({
				type: 'neutral',
				icon: 'check',
				label: (
					<Trans i18nKey='Version_supported_until' values={{ date: visualExpiration }}>
						Version
						<ExternalLink textDecorationLine='underline' color='unset' to={SUPPORT_EXTERNAL_LINK}>
							supported
						</ExternalLink>
						until {visualExpiration}
					</Trans>
				),
			});
		} else {
			items.push({
				type: 'danger',
				icon: 'warning',
				label: (
					<Trans i18nKey='Version_not_supported'>
						Version
						<ExternalLink textDecorationLine='underline' color='unset' to={SUPPORT_EXTERNAL_LINK}>
							not supported
						</ExternalLink>
					</Trans>
				),
			});

			btn = { path: RELEASES_EXTERNAL_LINK, label: <Trans i18nKey='Update_version' /> };
		}

		if (isRegistered) {
			items.push({
				type: 'neutral',
				icon: 'check',
				label: <Trans i18nKey='Workspace_registered' />,
			});
		} else {
			items.push({
				type: 'danger',
				icon: 'warning',
				label: <Trans i18nKey='Workspace_not_registered' />,
			});

			btn = { path: 'modal#registerWorkspace', label: <Trans i18nKey='RegisterWorkspace_Button' /> };
		}

		if (items.filter((item) => item.type === 'danger').length > 1) {
			setActionButton({ path: '/admin/manage-subscription', label: <Trans i18nKey='Solve_issues' /> });
		} else {
			setActionButton(btn);
		}

		setActionItems(items.sort((a) => (a.type === 'danger' ? -1 : 1)));
	}, [licenseLimits, isAirgapped, isRegistered, versionStatus, visualExpiration]);

	useEffect(() => {
		if (!supportedVersions.versions) {
			return;
		}
		setVersionStatus(getVersionStatus(serverVersion, supportedVersions.versions));
		getActionItems();
	}, [getActionItems, serverVersion, supportedVersions]);

	return (
		<Card style={style}>
			{!isLoading && licenseData ? (
				<>
					<CardBody flexDirection='row'>
						<CardCol>
							<CardColSection m={0}>
								<CardColTitle fontScale='h3' mbe={4} display='flex'>
									{t('Version_version', { version: serverVersion })}
									<Box mis={8} alignSelf='center' width='auto'>
										<VersionTag versionStatus={versionStatus} />
									</Box>
								</CardColTitle>
							</CardColSection>
							<CardColSection m={0}>
								<Box color='secondary-info' fontScale='p2'>
									<Icon name='rocketchat' size={16} /> {licenseName} {isTrial && `(${t('trial')})`}
								</Box>
							</CardColSection>
							<CardColSection>{actionItems && <VersionCardActionItemList actionItems={actionItems} />}</CardColSection>
						</CardCol>
					</CardBody>
					<CardFooter>{actionButton && <VersionCardActionButton actionButton={actionButton} refetch={refetchLicense} />}</CardFooter>
				</>
			) : (
				<VersionCardSkeleton />
			)}
		</Card>
	);
};

export default VersionCard;

const decodeBase64 = (b64: string): SupportedVersions => {
	const [, bodyEncoded] = b64.split('.');
	return JSON.parse(atob(bodyEncoded));
};
