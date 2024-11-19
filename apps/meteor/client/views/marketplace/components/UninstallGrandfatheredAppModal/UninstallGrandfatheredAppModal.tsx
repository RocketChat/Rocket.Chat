import { Button, Modal, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../components/MarkdownText';
import { useAppsCountQuery } from '../../hooks/useAppsCountQuery';
import { useMarketplaceContext } from '../../hooks/useMarketplaceContext';
import { usePrivateAppsEnabled } from '../../hooks/usePrivateAppsEnabled';

type UninstallGrandfatheredAppModalProps = {
	appName: string;
	handleUninstall: () => void;
	handleClose: () => void;
};

const UninstallGrandfatheredAppModal = ({ appName, handleUninstall, handleClose }: UninstallGrandfatheredAppModalProps) => {
	const { t } = useTranslation();
	const privateAppsEnabled = usePrivateAppsEnabled();
	const context = useMarketplaceContext();
	const { isLoading, isSuccess, data } = useAppsCountQuery(context);

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
					<Modal.Title>{t('Uninstall_grandfathered_app', { appName })}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={handleClose} />
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
					<Button onClick={handleClose}>{t('Cancel')}</Button>
					<Button danger onClick={handleUninstall}>
						{t('Uninstall')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default UninstallGrandfatheredAppModal;
