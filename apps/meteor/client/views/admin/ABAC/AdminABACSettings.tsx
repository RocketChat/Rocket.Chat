import { Box, Callout, Margins } from '@rocket.chat/fuselage';
import { Trans } from 'react-i18next';

import AdminABACSettingToggle from './AdminABACSettingToggle';

const AdminABACSettings = () => {
	return (
		<Box maxWidth='x600' w='full' alignSelf='center'>
			<Box>
				<Margins block={24}>
					<AdminABACSettingToggle />

					<Callout>
						{/* TODO: get documentation URL */}
						<Trans i18nKey='ABAC_Enabled_callout'>
							User attributes are synchronized via LDAP
							<a href='https://rocket.chat' target='_blank'>
								Learn more
							</a>
						</Trans>
					</Callout>
				</Margins>
			</Box>
		</Box>
	);
};

export default AdminABACSettings;
