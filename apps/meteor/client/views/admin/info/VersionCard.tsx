import type { IServerInfo } from '@rocket.chat/core-typings';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { Card, CardBody, CardCol, CardColSection, CardColTitle, CardFooter, ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { CSSProperties, ReactElement } from 'react';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

import { useFormatDate } from '../../../hooks/useFormatDate';
import { useLicenseV2 } from '../../../hooks/useLicenseV2';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';
import type { ActionButton } from './VersionCardActionButton';
import VersionCardActionButton from './VersionCardActionButton';
import type { ActionItem } from './VersionCardActionItem';
import VersionCardActionItem from './VersionCardActionItem';

type VersionCardProps = {
	serverInfo: IServerInfo;
};

const SUPPORT_EXTERNAL_LINK = 'https://go.rocket.chat/i/support';
const RELEASES_EXTERNAL_LINK = 'https://go.rocket.chat/i/releases';

const VersionCard = ({ serverInfo }: VersionCardProps): ReactElement => {
	const t = useTranslation();

	const [actionItems, setActionItems] = useState<ActionItem[]>([]);
	const [actionButton, setActionButton] = useState<ActionButton>();
	const [versionStatus, setVersionStatus] = useState<string>();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const style: CSSProperties = {
		backgroundImage: 'url(images/globe.png)',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'right 20px center',
		backgroundSize: mediaQuery ? 'auto' : 'contain',
	};

	const { license, refetch } = useLicenseV2();
	const { data: regStatus } = useRegistrationStatus();
	const isRegistered = regStatus?.registrationStatus.workspaceRegistered || false;
	const isAirgapped = license.information.offline;
	const licenseName = license.information.tags[0].name;
	const isTrial = license.information.trial;
	const serverVersion = serverInfo.info.version;
	const supportedVersions = serverInfo.supportedVersions.versions;

	const formatDate = useFormatDate();

	const getStatusTag = () => {
		if (isAirgapped) {
			return;
		}
		if (versionStatus === 'outdated') {
			return <Tag variant='danger'>{t('Outdated')}</Tag>;
		}

		if (versionStatus === 'latest') {
			return <Tag variant='primary'>{t('Latest')}</Tag>;
		}

		return <Tag variant='secondary'>{t('New_version_available')}</Tag>;
	};

	const getActionItems = useCallback(
		(license, versionStatus) => {
			const items: ActionItem[] = [];
			let btn;

			// TODO:  Add limits plan check
			items.push({
				type: 'info',
				icon: 'check',
				label: <Trans i18nKey='Operating_withing_plan_limits' />,
			});

			if (isAirgapped) {
				items.push({
					type: 'info',
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
					type: 'info',
					icon: 'check',
					label: (
						<Trans i18nKey='Version_supported_until' values={{ date: formatDate(license.information.visualExpiration) }}>
							Version
							<ExternalLink textDecorationLine='underline' color='unset' to={SUPPORT_EXTERNAL_LINK}>
								supported
							</ExternalLink>
							until {formatDate(license.information.visualExpiration)}
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
					type: 'info',
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
				setActionButton({ path: '/admin/registration', label: <Trans i18nKey='Solve_issues' /> });
			} else {
				setActionButton(btn);
			}

			setActionItems(items.sort((a) => (a.type === 'danger' ? -1 : 1)));
		},
		[formatDate, isAirgapped, isRegistered],
	);

	useEffect(() => {
		const versionIndex = supportedVersions?.findIndex((v) => v.version === serverVersion);

		if (versionIndex === -1) {
			setVersionStatus('outdated');
		} else if (versionIndex === supportedVersions?.length - 1) {
			setVersionStatus('latest');
		} else {
			setVersionStatus('available_version');
		}

		getActionItems(license, versionStatus);
	}, [getActionItems, license, serverVersion, supportedVersions, versionStatus]);

	return (
		<Card data-qa-id='usage-card' style={style}>
			<CardBody flexDirection='row'>
				<CardCol>
					<CardColSection m={0}>
						<CardColTitle fontScale='h3' mbe={4} display='flex'>
							{t('Version_version', { version: serverVersion })}
							<Box mis={8} alignSelf='center' width='auto'>
								{getStatusTag()}
							</Box>
						</CardColTitle>
					</CardColSection>
					<CardColSection m={0}>
						<Box color='secondary-info' fontScale='p2'>
							<Icon name='rocketchat' size={16} /> {licenseName} {isTrial && `(${t('trial')})`}
						</Box>
					</CardColSection>
					<CardColSection>
						{actionItems.map((item, index) => (
							<VersionCardActionItem key={index} actionItem={item} />
						))}
					</CardColSection>
				</CardCol>
			</CardBody>
			<CardFooter>{actionButton && <VersionCardActionButton actionButton={actionButton} refetch={refetch} />}</CardFooter>
		</Card>
	);
};

export default memo(VersionCard);
