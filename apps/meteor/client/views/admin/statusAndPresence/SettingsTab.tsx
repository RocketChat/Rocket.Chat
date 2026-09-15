import { AccordionItem, Callout, FieldGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Setting from '../settings/Setting';
import SettingsGroupPage from '../settings/SettingsGroupPage';

const SettingsTab = ({ tabs, headerButtons }: { tabs: ReactNode; headerButtons?: ReactNode }) => {
	const { t } = useTranslation();

	return (
		<SettingsGroupPage _id='Accounts' i18nLabel='Status_and_presence' tabs={tabs} headerButtons={headerButtons}>
			<AccordionItem noncollapsible title=''>
				<FieldGroup>
					<Setting settingId='Accounts_UserStatus_Enabled' />
					<Setting settingId='Accounts_AllowUserStatusMessageChange' />
					<Setting settingId='Accounts_AllowInvisibleStatusOption' />
					<Setting settingId='Accounts_StatusVisibility_Enabled' />
					<Callout icon='info-circled'>{t('Admins_cannot_see_concealed_presence')}</Callout>
				</FieldGroup>
			</AccordionItem>
		</SettingsGroupPage>
	);
};

export default memo(SettingsTab);
