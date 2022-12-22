import { OptionTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import ListItem from '../Sidebar/ListItem';

type AuditModelListProps = {
	closeList: () => void;
	showAudit: boolean;
	showAuditLog: boolean;
};

const AuditModelList: FC<AuditModelListProps> = ({ showAudit, showAuditLog, closeList }) => {
	const t = useTranslation();

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
				{showAuditLog && (
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
