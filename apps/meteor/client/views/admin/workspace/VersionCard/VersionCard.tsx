import type { IWorkspaceInfo } from '@rocket.chat/core-typings';
import { Box, Card, CardBody, CardCol, CardControls, CardHeader, CardTitle, Icon } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { SupportedVersions } from '@rocket.chat/server-cloud-communication';
import { ExternalLink } from '@rocket.chat/ui-client';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useSetModal, useMediaUrl } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import VersionCardActionButton from './components/VersionCardActionButton';
import type { VersionActionItem } from './components/VersionCardActionItem';
import VersionCardActionItem from './components/VersionCardActionItem';
import { VersionCardSkeleton } from './components/VersionCardSkeleton';
import { VersionTag } from './components/VersionTag';
import { getVersionStatus } from './getVersionStatus';
import RegisterWorkspaceModal from './modals/RegisterWorkspaceModal';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useLicense, useLicenseName } from '../../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../../hooks/useRegistrationStatus';
import { isOverLicenseLimits } from '../../../../lib/utils/isOverLicenseLimits';

const SUPPORT_EXTERNAL_LINK = 'https://go.rocket.chat/i/version-support';
const RELEASES_EXTERNAL_LINK = 'https://go.rocket.chat/i/update-product';

type VersionCardProps = {
	serverInfo: IWorkspaceInfo;
};

const VersionCard = ({ serverInfo }: VersionCardProps): ReactElement => {
	const breakpoints = useBreakpoints();
	const isExtraLargeOrBigger = breakpoints.includes('xl');

	const getUrl = useMediaUrl();
	const cardBackground = {
		backgroundImage: `url(${getUrl('images/globe.png')})`,
		backgroundRepeat: 'no-repeat',
		backgroundPosition: isExtraLargeOrBigger ? 'right 20px center' : 'left 450px center',
		backgroundSize: 'auto',
	};

	const setModal = useSetModal();

	const { t } = useTranslation();

	const formatDate = useFormatDate();

	const { data: licenseData, isPending, refetch: refetchLicense } = useLicense({ loadValues: true });
	const { isRegistered } = useRegistrationStatus();

	const { license, limits } = licenseData || {};
	const isAirgapped = license?.information?.offline;
	const licenseName = useLicenseName();

	const serverVersion = serverInfo.version;

	const { versionStatus, versions } = useMemo(() => {
		const supportedVersions = serverInfo?.supportedVersions?.signed ? decodeBase64(serverInfo?.supportedVersions?.signed) : undefined;

		if (!supportedVersions) {
			return {};
		}

		const versionStatus = getVersionStatus(serverVersion, supportedVersions?.versions);

		return {
			versionStatus,
			versions: supportedVersions?.versions,
		};
	}, [serverInfo?.supportedVersions?.signed, serverVersion]);

	const isOverLimits = limits && isOverLicenseLimits(limits);

	const actionButton:
		| undefined
		| {
				path: LocationPathname;
				label: ReactNode;
		  }
		| {
				action: () => void;
				label: ReactNode;
		  } = useMemo(() => {
		if (!isRegistered) {
			return {
				action: () => {
					const handleModalClose = (): void => {
						setModal(null);
						refetchLicense();
					};
					setModal(<RegisterWorkspaceModal onClose={handleModalClose} onStatusChange={refetchLicense} />);
				},
				label: t('RegisterWorkspace_Button'),
			};
		}

		if (versionStatus?.label === 'outdated') {
			return {
				action: () => {
					window.open(RELEASES_EXTERNAL_LINK, '_blank');
				},
				label: t('Update_version'),
			};
		}

		if (isOverLimits) {
			return { path: '/admin/subscription', label: t('Manage_subscription') };
		}
	}, [isRegistered, versionStatus, isOverLimits, t, setModal, refetchLicense]);

	const actionItems = useMemo(() => {
		return (
			[
				isOverLimits
					? {
							danger: true,
							icon: 'warning',
							label: t('Plan_limits_reached'),
						}
					: {
							icon: 'check',
							label: t('Operating_withing_plan_limits'),
						},
				(isAirgapped || !versions) && {
					icon: 'warning',
					label: (
						<Trans i18nKey='Check_support_availability'>
							Check
							<ExternalLink to={SUPPORT_EXTERNAL_LINK}>support</ExternalLink>
							availability
						</Trans>
					),
				},

				versionStatus?.label !== 'outdated' &&
					versionStatus?.expiration && {
						icon: 'check',
						label: (
							<Trans i18nKey='Version_supported_until' values={{ date: formatDate(versionStatus?.expiration) }}>
								Version
								<ExternalLink to={SUPPORT_EXTERNAL_LINK}>supported</ExternalLink>
								until {formatDate(versionStatus?.expiration)}
							</Trans>
						),
					},
				versionStatus?.label === 'outdated' && {
					danger: true,
					icon: 'warning',
					label: (
						<Trans i18nKey='Version_not_supported'>
							Version
							<ExternalLink to={SUPPORT_EXTERNAL_LINK}>not supported</ExternalLink>
						</Trans>
					),
				},
				isRegistered
					? {
							icon: 'check',
							label: t('Workspace_registered'),
						}
					: {
							danger: true,
							icon: 'warning',
							label: t('Workspace_not_registered'),
						},
			].filter(Boolean) as VersionActionItem[]
		).sort((a) => (a.danger ? -1 : 1));
	}, [isOverLimits, t, isAirgapped, versions, versionStatus?.label, versionStatus?.expiration, formatDate, isRegistered]);

	if (isPending && !licenseData) {
		return (
			<Card style={{ ...cardBackground }}>
				<VersionCardSkeleton />
			</Card>
		);
	}

	return (
		<Card style={{ ...cardBackground }}>
			<CardCol>
				<CardHeader>
					<CardTitle variant='h3'>{t('Version_version', { version: serverVersion })}</CardTitle>
					{!isAirgapped && versions && <VersionTag versionStatus={versionStatus?.label} title={versionStatus.version} />}
				</CardHeader>

				<Box color='secondary-info'>
					<Icon name='rocketchat' size={16} /> {licenseName.data}
				</Box>
			</CardCol>

			<CardBody flexDirection='column'>
				{actionItems.length > 0 && actionItems.map((item, index) => <VersionCardActionItem key={index} {...item} />)}
			</CardBody>

			{actionButton && (
				<CardControls>
					<VersionCardActionButton {...actionButton} />
				</CardControls>
			)}
		</Card>
	);
};

export default VersionCard;

const decodeBase64 = (b64: string): SupportedVersions | undefined => {
	const [, bodyEncoded] = b64.split('.');
	if (!bodyEncoded) {
		return;
	}

	return JSON.parse(atob(bodyEncoded));
};
