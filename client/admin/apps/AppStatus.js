import { Box, Button, Icon, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, memo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { appButtonProps, appStatusSpanProps, handleAPIError, warnStatusChange } from './helpers';
import { Apps } from '../../../app/apps/client/orchestrator';
import { IframeModal } from './IframeModal';
import { CloudLoginModal } from './CloudLoginModal';
import { useSetModal } from '../../contexts/ModalContext';
import { useMethod } from '../../contexts/ServerContext';

const installApp = async ({ id, name, version }) => {
	try {
		const { status } = await Apps.installApp(id, version);
		warnStatusChange(name, status);
	} catch (error) {
		handleAPIError(error);
	}
};

const actions = {
	purchase: installApp,
	install: installApp,
	update: async ({ id, name, version }) => {
		try {
			const { status } = await Apps.updateApp(id, version);
			warnStatusChange(name, status);
		} catch (error) {
			handleAPIError(error);
		}
	},
};

const AppStatus = memo(({ app, showStatus = true, ...props }) => {
	const t = useTranslation();
	const [loading, setLoading] = useSafely(useState());
	const setModal = useSetModal();

	const button = appButtonProps(app);
	const status = !button && appStatusSpanProps(app);

	const action = button?.action || '';
	const confirmAction = useCallback(() => {
		setModal(null);

		actions[action](app).then(() => {
			setLoading(false);
		});
	}, [setModal, action, app, setLoading]);

	const cancelAction = useCallback(() => {
		setLoading(false);
		setModal(null);
	}, [setLoading, setModal]);

	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const handleClick = useCallback(async (e) => {
		e.preventDefault();
		e.stopPropagation();

		setLoading(true);

		const isLoggedIn = await checkUserLoggedIn();

		if (!isLoggedIn) {
			setLoading(false);
			setModal(<CloudLoginModal />);
			return;
		}

		if (action === 'purchase') {
			try {
				const data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);

				setModal(<IframeModal url={data.url} cancel={cancelAction} confirm={confirmAction}/>);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		confirmAction();
	}, [setLoading, checkUserLoggedIn, action, confirmAction, setModal, app.id, app.purchaseType, cancelAction]);

	return <Box {...props}>
		{button && <Button primary disabled={loading} invisible={!showStatus && !loading} minHeight='x40' onClick={handleClick}>
			{loading
				? <Throbber inheritColor />
				: <>
					{button.icon && <Icon name={button.icon} />}{t(button.label)}
				</>}
		</Button>}
		{status && <Box color={status.label === 'Disabled' ? 'warning' : 'hint'} display='flex' alignItems='center'>
			<Icon size='x20' name={status.icon} mie='x4'/>
			{t(status.label)}
		</Box>}
	</Box>;
});

export default AppStatus;
