import type { IServerInfo } from '@rocket.chat/core-typings';
import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import { useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Card, CardBody, CardCol, CardColSection, CardColTitle, CardFooter } from '@rocket.chat/ui-client';
import type { To } from '@rocket.chat/ui-contexts';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { CSSProperties, ReactElement } from 'react';
import React, { memo, useCallback, useEffect, useState } from 'react';

import { useFormatDate } from '../../../hooks/useFormatDate';
import { useLicenseV2 } from '../../../hooks/useLicenseV2';

type VersionCardProps = {
	serverInfo: IServerInfo;
};

type ActionItem = {
	type: 'danger' | 'info';
	label: string;
};

type ActionButton = {
	path: string;
	label: string;
};

const VersionCard = ({ serverInfo }: VersionCardProps): ReactElement => {
	const t = useTranslation();
	const router = useRouter();

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

	const { license } = useLicenseV2();
	const licenseName = license.information.tags[0].name;
	const isTrial = license.information.trial;
	const serverVersion = serverInfo.info.version;
	const supportedVersions = serverInfo.supportedVersions.versions;

	const formatDate = useFormatDate();

	const getStatusTag = () => {
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

			items.push({
				type: 'info',
				label: t('Operating_withing_plan_limits'),
			});

			if (versionStatus === 'outdated') {
				items.push({
					type: 'danger',
					label: 'Support unavailable',
				});
				btn = { path: 'https://github.com/RocketChat/Rocket.Chat/releases', label: t('Update_version') };
			} else {
				items.push({
					type: 'info',
					label: t('Support_available_until', { date: formatDate(license.information.visualExpiration) }),
				});
			}

			if (!license.information.offline) {
				items.push({
					type: 'info',
					label: t('Workspace_registered'),
				});
			} else {
				items.push({
					type: 'danger',
					label: t('Workspace_not_registered'),
				});
				btn = { path: '/admin/registration', label: t('Manage_subscription') };
			}

			if (items.filter((item) => item.type === 'danger').length > 1) {
				setActionButton({ path: '/admin/registration', label: t('Solve_issues') });
			} else {
				setActionButton(btn);
			}

			setActionItems(items);
		},
		[formatDate, t],
	);

	const handleActionButton = useMutableCallback((path: string) => {
		if (path.startsWith('http')) {
			return window.open(path, '_blank');
		}

		router.navigate(path as To);
	});

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
							<Box
								key={index}
								display='flex'
								alignItems='center'
								color={item.type === 'danger' ? 'status-font-on-danger' : 'secondary-info'}
								fontScale='p2m'
								mbe={4}
							>
								<Icon
									name={item.type === 'danger' ? 'warning' : 'check'}
									size={20}
									bg={item.type === 'danger' ? 'status-background-danger' : 'surface-tint'}
									p={4}
									borderRadius={4}
									mie={12}
								/>
								{item.label}
							</Box>
						))}
					</CardColSection>
				</CardCol>
			</CardBody>
			<CardFooter>
				{actionButton && (
					<Button primary onClick={() => handleActionButton(actionButton.path)}>
						{actionButton.label}
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

export default memo(VersionCard);
