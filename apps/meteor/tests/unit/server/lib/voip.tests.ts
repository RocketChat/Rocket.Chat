import { expect } from 'chai';
import { FreeSwitchClient, FreeSwitchServer, once } from 'esl';

async function connectVoIP() {
	const client = new FreeSwitchClient({
		host: 'host-address',
		port: 8021,
	});

	client.on('error', (...args) => {
		console.log('client error');
		console.log(...args);
	})

	client.on('warning', (...args) => {
		console.log('client warning');
		console.log(...args);
	})

	client.on('reconnecting', (...args) => {
		console.log('client reconnecting');
		console.log(...args);
	})

	client.on('end', (...args) => {
		console.log('client end');
		console.log(...args);
	})



	client.on('connect', () => {
		console.log('client connected');
	});

	const command = async (cmd: string) => {
		const p = once(client, 'connect');
		console.log('connecting');
		await client.connect();
		console.log('waiting');
		const [call] = await p;
		console.log('connected');
		const res = await call.api(cmd);
		console.log(res);
		// res.body.should.match(/\+OK/);
		await call.exit();
		await client.end();
	};

	return command('reloadxml');
}


describe.only('VoIP', () => {
	describe('connect to free switch', () => {
		it('should connect', async () => {
			await connectVoIP();
		});
	});
});
