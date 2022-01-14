/* eslint-disable react/no-multi-comp */
import React, { lazy, ReactElement, useCallback } from 'react';

import { Users } from '../../../../app/models/client/models/Users';
import { IUser } from '../../../../definition/IUser';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUser, useUserId } from '../../../contexts/UserContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BlazeTemplate from '../BlazeTemplate';
import PageLoading from '../PageLoading';
import { useAllowRead } from './useAllowRead';
import { useCollectionsAvailability } from './useCollectionsAvailability';
import { useCustomScript } from './useCustomScript';
import { useIframeLogin } from './useIframeLogin';
import { useTooltipHandling } from './useTooltipHandling';
import { useTouchEventCorrection } from './useTouchEventCorrection';
import { useViewportScrolling } from './useViewportScrolling';

const MainLayout1 = (): ReactElement => {
	const iframeLoginUrl = useIframeLogin();

	if (iframeLoginUrl) {
		return <iframe src={iframeLoginUrl} style={{ height: '100%', width: '100%' }} />;
	}

	return <BlazeTemplate template='loginLayout' />;
};

const ResetPasswordPage = lazy(() => import('../../login/ResetPassword/ResetPassword'));

const MainLayout3 = ({ center }: MainLayoutProps): ReactElement => {
	const requirePasswordChange = (useUser() as IUser | null)?.requirePasswordChange === true;

	if (requirePasswordChange) {
		return <ResetPasswordPage />;
	}

	return <BlazeTemplate template='main' data={{ center }} />;
};

const MainLayout2 = ({ center }: MainLayoutProps): ReactElement => {
	const uid = useUserId();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const hasUsername = useReactiveValue(
		useCallback(() => {
			if (!uid) {
				return allowAnonymousRead;
			}

			const user = uid ? (Users.findOneById(uid, { fields: { username: 1 } }) as IUser | null) : null;
			return user?.username ?? false;
		}, [uid, allowAnonymousRead]),
	);

	if (!hasUsername) {
		return <BlazeTemplate template='username' data={{ center }} />;
	}

	return <MainLayout3 center={center} />;
};

type MainLayoutProps = {
	center?: string;
};

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	const ready = useCollectionsAvailability();
	useTooltipHandling();
	useTouchEventCorrection();
	const allowedRead = useAllowRead(ready);
	useViewportScrolling(allowedRead);
	useCustomScript(allowedRead);

	if (!ready) {
		return <PageLoading />;
	}

	if (!allowedRead) {
		return <MainLayout1 />;
	}

	return <MainLayout2 center={center} />;
};

export default MainLayout;
