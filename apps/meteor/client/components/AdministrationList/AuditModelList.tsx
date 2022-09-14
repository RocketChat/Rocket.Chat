import { OptionTitle } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { AUDIT_LOG_PERMISSIONS, AUDIT_PERMISSIONS } from '../../sidebar/header/actions/constants';
import ListItem from '../Sidebar/ListItem';

type AuditModelListProps = {
	closeList: () => void;
};

const AuditModelList: FC<AuditModelListProps> = ({ closeList }) => {
	const t = useTranslation();
	const showAudit = useAtLeastOnePermission(AUDIT_PERMISSIONS);
	const showAuditLogs = useAtLeastOnePermission(AUDIT_LOG_PERMISSIONS);

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');

	return (
		<>
			<OptionTitle>{t('Audit')}</OptionTitle>
			<ul>
				{showAudit && (
					<ListItem
						icon='document-eye'
						text={t('Messages')}
						action={(): void => {
							auditHomeRoute.push();
							closeList();
						}}
					/>
				)}
				{showAuditLogs && (
					<ListItem
						icon='document-eye'
						text={t('Logs')}
						action={(): void => {
							auditSettingsRoute.push();
							closeList();
						}}
					/>
				)}
			</ul>
		</>
	);
};

export default AuditModelList;
