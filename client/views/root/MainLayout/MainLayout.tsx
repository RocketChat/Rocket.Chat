/* eslint-disable react/no-multi-comp */
import React, { lazy, ReactElement, useCallback } from 'react';

import { Roles, Users } from '../../../../app/models/client';
import { IUser } from '../../../../definition/IUser';
import { useLayout } from '../../../contexts/LayoutContext';
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
const AccountSecurityPage = lazy(() => import('../../account/security/AccountSecurityPage'));

const MainLayout5 = ({ center }: MainLayoutProps): ReactElement => {
	0;

	return <BlazeTemplate template='main' data={{ center }} />;
};

const MainLayout4 = ({ center }: MainLayoutProps): ReactElement => {
	const { isEmbedded: embeddedLayout } = useLayout();
	const user = useUser() as IUser | null;
	const tfaEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const require2faSetup = useReactiveValue(
		useCallback(() => {
			// User is already using 2fa
			if (!user || user?.services?.totp?.enabled || user?.services?.email2fa?.enabled) {
				return false;
			}

			const mandatoryRole = Roles.findOne({ _id: { $in: user.roles }, mandatory2fa: true });
			return mandatoryRole !== undefined && tfaEnabled;
		}, [tfaEnabled, user]),
	);

	if (require2faSetup) {
		return (
			<main id='rocket-chat' className={embeddedLayout ? 'embedded-view' : undefined}>
				<div className='rc-old main-content content-background-color'>
					<AccountSecurityPage />
				</div>
			</main>
		);
	}

	return <MainLayout5 center={center} />;
};

const MainLayout3 = ({ center }: MainLayoutProps): ReactElement => {
	const requirePasswordChange = (useUser() as IUser | null)?.requirePasswordChange === true;

	if (requirePasswordChange) {
		return <ResetPasswordPage />;
	}

	return <MainLayout4 center={center} />;
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
