import { GenericMenu, useHandleMenuAction } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';

import { NavbarAction } from '../../components/Navbar';
import { useAuditItems } from '../../sidebar/header/actions/hooks/useAuditItems';

const NavbarAuditAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();

	const router = useRouter();
	const routerName = router.getRouteName();

	const auditItems = useAuditItems();

	const handleAction = useHandleMenuAction(auditItems);

	return (
		<NavbarAction {...props}>
			<GenericMenu
				pressed={routerName === 'audit-home' || routerName === 'audit-log'}
				medium
				title={t('Audit')}
				icon='document-eye'
				placement='right-start'
				onAction={handleAction}
				items={auditItems}
			/>
		</NavbarAction>
	);
};

export default NavbarAuditAction;
