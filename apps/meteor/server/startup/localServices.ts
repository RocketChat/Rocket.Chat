import { api, LocalBroker } from '@rocket.chat/core-services';
import { StreamerCentral } from '@rocket.chat/streamer';

const broker = new LocalBroker();

broker.onBroadcast((eventName: string, args: unknown[]) => {
	StreamerCentral.emit('broadcast', 'local', 'broadcast', [{ eventName, args }]);
});

api.setBroker(broker);
void api.start();
