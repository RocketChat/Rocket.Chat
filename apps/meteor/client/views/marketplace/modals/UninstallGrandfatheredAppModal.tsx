import type { App } from '@rocket.chat/core-typings';
import { Button, Modal, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../components/MarkdownText';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import { useUninstallAppMutation } from '../hooks/useUninstallAppMutation';

type UninstallGrandfatheredAppModalProps = {
	app: App;
	onClose: () => void;
};

const UninstallGrandfatheredAppModal = ({ app, onClose }: UninstallGrandfatheredAppModalProps) => {
	const { t } = useTranslation();
	const privateAppsEnabled = usePrivateAppsEnabled();
	const context = useMarketplaceContext();
	const { isLoading, isSuccess, data } = useAppsCountQuery(context);

	const uninstallAppMutation = useUninstallAppMutation(app);

	const handleUninstallButtonClick = async () => {
		await uninstallAppMutation.mutateAsync();
		onClose();
	};

	const content = useMemo(() => {
		if (context === 'private' && !privateAppsEnabled) {
			return <MarkdownText content={t('App_will_lose_grandfathered_status_private')} />;
		}

		if (isLoading) {
			return <Skeleton variant='text' width='100%' />;
		}

		if (isSuccess) {
			return <MarkdownText content={t('App_will_lose_grandfathered_status', { limit: data.limit })} />;
		}

		return null;
	}, [context, data?.limit, isLoading, isSuccess, privateAppsEnabled, t]);

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Uninstall_grandfathered_app', { appName: app.name })}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>{content}</Modal.Content>
			<Modal.Footer justifyContent='space-between'>
				<Modal.FooterAnnotation>
					{/* TODO: Move the link to a go link when available */}
					<a target='_blank' rel='noopener noreferrer' href='https://docs.rocket.chat/docs/rocketchat-marketplace'>
						{t('Learn_more')}
					</a>
				</Modal.FooterAnnotation>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button danger onClick={handleUninstallButtonClick}>
						{t('Uninstall')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default UninstallGrandfatheredAppModal;
