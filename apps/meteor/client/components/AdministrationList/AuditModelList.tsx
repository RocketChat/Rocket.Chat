import { OptionTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import ListItem from '../Sidebar/ListItem';

type AuditModelListProps = {
	onDismiss: () => void;
	showAudit: boolean;
	showAuditLog: boolean;
};

const AuditModelList: FC<AuditModelListProps> = ({ showAudit, showAuditLog, onDismiss }) => {
	const t = useTranslation();

	const auditHomeRoute = useRoute('audit-home');
	const auditSettingsRoute = useRoute('audit-log');

	return (
		<>
			<OptionTitle>{t('Audit')}</OptionTitle>
			<ul>
				{showAudit && (
					<ListItem
						role='listitem'
						icon='document-eye'
						text={t('Messages')}
						onClick={() => {
							auditHomeRoute.push();
							onDismiss();
						}}
					/>
				)}
				{showAuditLog && (
					<ListItem
						role='listitem'
						icon='document-eye'
						text={t('Logs')}
						onClick={() => {
							auditSettingsRoute.push();
							onDismiss();
						}}
					/>
				)}
			</ul>
		</>
	);
};

export default AuditModelList;
