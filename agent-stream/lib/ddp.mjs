import WebSocket from 'ws';

/**
 * A DDP session over the raw `/websocket` endpoint, as the web client opens it. Counts every byte it receives, so the
 * load generator can report the bytes on the wire for each viewer.
 */
export class DdpSession {
	constructor(baseUrl) {
		this.url = `${baseUrl.replace(/^http/, 'ws')}/websocket`;
		this.bytesIn = 0;
		this.nextId = 1;
		this.pending = new Map();
		this.onChanged = () => {};
		this.onClose = () => {};
	}

	connect() {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(this.url, { perMessageDeflate: false });
			this.ws = ws;
			ws.on('error', reject);
			ws.on('close', () => {
				for (const { reject: fail } of this.pending.values()) {
					fail(new Error('socket closed'));
				}
				this.pending.clear();
				this.onClose();
			});
			ws.on('open', () => this.send({ msg: 'connect', version: '1', support: ['1', 'pre2', 'pre1'] }));
			ws.on('message', (data) => {
				this.bytesIn += data.length;
				const msg = JSON.parse(data);
				switch (msg.msg) {
					case 'connected':
						resolve(msg.session);
						break;
					case 'ping':
						this.send({ msg: 'pong', ...(msg.id && { id: msg.id }) });
						break;
					case 'changed':
						this.onChanged(msg);
						break;
					case 'result':
						this.settle(msg.id, msg.error, msg.result);
						break;
					case 'ready':
						msg.subs.forEach((id) => this.settle(id));
						break;
					case 'nosub':
						this.settle(msg.id, msg.error ?? { error: 'nosub' });
						break;
				}
			});
		});
	}

	send(obj) {
		this.ws.send(JSON.stringify(obj));
	}

	settle(id, error, result) {
		const call = this.pending.get(id);
		if (!call) {
			return;
		}
		this.pending.delete(id);
		error ? call.reject(Object.assign(new Error(error.reason ?? error.error ?? 'ddp error'), { ddp: error })) : call.resolve(result);
	}

	request(obj) {
		const id = String(this.nextId++);
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.send({ ...obj, id });
		});
	}

	call(method, ...params) {
		return this.request({ msg: 'method', method, params });
	}

	subscribe(name, ...params) {
		return this.request({ msg: 'sub', name, params });
	}

	/** Subscribes to one event of a stream, with the parameters the web client's SDK sends. */
	stream(streamName, eventName, args = []) {
		return this.subscribe(`stream-${streamName}`, eventName, { useCollection: false, args });
	}

	login(token) {
		return this.call('login', { resume: token });
	}

	close() {
		this.ws?.terminate();
	}
}
