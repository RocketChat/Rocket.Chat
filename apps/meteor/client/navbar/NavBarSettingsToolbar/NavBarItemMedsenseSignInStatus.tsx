import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import MedsenseAgentSignInModal from './UserMenu/MedsenseAgentSignInModal';

type NavBarItemMedsenseSignInStatusProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const normalizeRoleSetting = (rolesSetting: unknown): string[] => {
	if (Array.isArray(rolesSetting)) {
		return rolesSetting.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
	}

	if (typeof rolesSetting === 'string') {
		return rolesSetting
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean);
	}

	return [];
};

const NavBarItemMedsenseSignInStatus = (props: NavBarItemMedsenseSignInStatusProps) => {
	const user = useUser();
	const setModal = useSetModal();
	const { t } = useTranslation();
	const pharmacistRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Pharmacist_Roles', []);
	const technicianRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Technician_Roles', []);
	const assistantRolesSetting = useSetting<string[] | string>('Medsense_Sign_In_Role_Assistant_Roles', []);

	if (!user) {
		return null;
	}

	const userRoles = Array.isArray(user.roles) ? user.roles : [];
	const pharmacistRoles = normalizeRoleSetting(pharmacistRolesSetting);
	const technicianRoles = normalizeRoleSetting(technicianRolesSetting);
	const assistantRoles = normalizeRoleSetting(assistantRolesSetting);
	const canSignIn =
		(pharmacistRoles.length > 0 && userRoles.some((role) => pharmacistRoles.includes(role))) ||
		(technicianRoles.length > 0 && userRoles.some((role) => technicianRoles.includes(role))) ||
		(assistantRoles.length > 0 && userRoles.some((role) => assistantRoles.includes(role)));

	if (!canSignIn) {
		return null;
	}

	const signInEnd = user.customFields?.medsenseSignInEnd as string | undefined;
	const signInStart = user.customFields?.medsenseSignInStart as string | undefined;
	const signInRole = user.customFields?.medsenseSignInRole as string | undefined;
	const endTime = signInEnd ? Date.parse(signInEnd) : Number.NaN;
	const startTime = signInStart ? Date.parse(signInStart) : Number.NaN;
	const now = Date.now();
	const isSignedIn =
		Boolean(signInRole) &&
		Number.isFinite(endTime) &&
		endTime > now &&
		(!Number.isFinite(startTime) || startTime <= now);

	const handleClick = useEffectEvent(() => {
		const handleClose = () => setModal(null);
		setModal(<MedsenseAgentSignInModal onClose={handleClose} />);
	});

	return (
		<NavBarItem
			{...props}
			id='medsense-sign-in-status'
			icon={isSignedIn ? 'circle-check' : 'ban'}
			success={isSignedIn}
			danger={!isSignedIn}
			title={isSignedIn ? t('Medsense_Signed_In') : t('Medsense_Signed_Out')}
			onClick={handleClick}
		/>
	);
};

export default NavBarItemMedsenseSignInStatus;
