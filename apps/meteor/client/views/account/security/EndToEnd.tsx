import { Divider } from '@rocket.chat/fuselage';

import { ChangePassphrase } from './ChangePassphrase';
import LocalSearchOptIn from './LocalSearchOptIn';
import { ResetPassphrase } from './ResetPassphrase';
import EndToEndSettingsLayout from './layout/EndToEndSettingsLayout';

const EndToEnd = () => {
	return (
		<EndToEndSettingsLayout>
			<ChangePassphrase />
			<Divider flush />
			<ResetPassphrase />
			<LocalSearchOptIn />
		</EndToEndSettingsLayout>
	);
};

export default EndToEnd;
