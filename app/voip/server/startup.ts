import { settings } from '../../settings/server';
import { Voip } from '../../../server/sdk';

settings.watch('VoIP_Enabled', (value: boolean) => {
	return value ? Voip.init() : Voip.stop();
});
