import http from 'http';

import { runProtooWSServer } from './methods/runProtooWSServer';
import { runWorkers } from './methods/worker';

const server = http.createServer();

const SFU_PORT = 8989;

const init = async (): Promise<void> => {
	await runWorkers();

	server.listen(SFU_PORT, () => console.log(`SFU server started on PORT:${ SFU_PORT }`));

	await runProtooWSServer(server);
};


init();
