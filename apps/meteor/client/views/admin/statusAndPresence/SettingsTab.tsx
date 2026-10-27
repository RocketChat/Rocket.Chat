import { AccordionItem, FieldGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Setting from '../settings/Setting';
import SettingsGroupPage from '../settings/SettingsGroupPage';

export const STATUS_SETTING_IDS = [
	'Accounts_UserStatus_Enabled',
	'Accounts_AllowUserStatusMessageChange',
	'Accounts_AllowInvisibleStatusOption',
	'Accounts_StatusVisibility_Admin_Enabled',
	'Accounts_StatusVisibility_Enabled',
];

export type SettingsTabProps = {
	settingIds: string[];
	tabs: ReactNode;
	headerButtons?: ReactNode;
};

const SettingsTab = ({ settingIds, tabs, headerButtons }: SettingsTabProps) => (
	<SettingsGroupPage _id='Accounts' i18nLabel='Status_and_presence' tabs={tabs} headerButtons={headerButtons}>
		<AccordionItem noncollapsible title=''>
			<FieldGroup>
				{settingIds.map((settingId) => (
					<Setting key={settingId} settingId={settingId} />
				))}
			</FieldGroup>
		</AccordionItem>
	</SettingsGroupPage>
);

export default SettingsTab;
