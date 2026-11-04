import { applyBlockOps, closeOpenTask } from '../../apps/meteor/server/agent-stream/blockOps.js';

/**
 * One viewer of one stream: it rebuilds the reply from what its adapter yields and counts what went wrong. Every
 * adapter yields the same event types:
 * - `snapshot` { streamId, mid, seq, blocks, state }: the state to start from after (re)connecting;
 * - `full` { streamId, mid, seq, ts, blocks, state }: all the blocks of the reply so far, from a message update;
 * - `patch` { streamId, seq, ts, ops } and `end` { streamId, seq, ts, reason }: the deltas of the shared contract.
 * Each event carries `recvTs`, the time it came off the socket.
 */
export class Viewer {
	constructor(spec, adapterModule) {
		this.spec = spec;
		this.adapterModule = adapterModule;
		this.recording = false;
		this.bytesBefore = 0;
		this.bytesClosed = 0;
		this.streamId = undefined;
		this.mid = undefined;
		this.blocks = [];
		this.lastSeq = 0;
		this.covered = 0;
		this.seen = new Set();
		this.ended = false;
		this.endReason = undefined;
		this.stats = { delivered: 0, gapEvents: 0, missingSeqs: 0, dupes: 0, outOfOrder: 0, stale: 0, reconnects: 0, errors: 0 };
		this.latencies = [];
	}

	get bytesIn() {
		return this.bytesClosed + (this.adapter?.bytesIn ?? 0) - this.bytesBefore;
	}

	async start() {
		this.adapter = this.adapterModule.create(this.spec);
		await this.adapter.connect();
		await this.adapter.open({ rid: this.spec.rid, streamId: this.streamId, mid: this.mid });
		this.consume(this.adapter);
	}

	startRecording() {
		this.bytesBefore = this.bytesIn + this.bytesBefore;
		this.recording = true;
	}

	async reconnect() {
		const old = this.adapter;
		this.bytesClosed += old.bytesIn;
		old.close();
		this.stats.reconnects++;
		this.seen.clear();
		try {
			await this.start();
		} catch (err) {
			this.stats.errors++;
			this.lastError = String(err?.message ?? err);
		}
	}

	consume(adapter) {
		void (async () => {
			for await (const event of adapter.events()) {
				if (this.recording) {
					this.apply(event);
				}
			}
		})();
	}

	apply(event) {
		if (this.streamId && event.streamId !== this.streamId) {
			return;
		}
		this.streamId ??= event.streamId;
		this.mid ??= event.mid;

		if (event.type === 'snapshot') {
			this.blocks = event.blocks;
			this.covered = Math.max(this.covered, event.seq);
			this.lastSeq = event.seq;
			if (event.state && event.state !== 'active') {
				this.finish(event.state);
			}
			return;
		}

		// the placeholder itself
		if (event.seq === 0) {
			return;
		}

		const inOrder = this.count(event);
		if (inOrder === undefined) {
			return;
		}

		if (event.type === 'full') {
			if (inOrder || event.state !== 'active') {
				this.blocks = event.blocks;
			}
			if (event.state !== 'active') {
				this.finish(event.state);
			}
		} else if (event.type === 'patch') {
			applyBlockOps(this.blocks, event.ops);
		} else if (event.type === 'end') {
			closeOpenTask(this.blocks, event.reason);
			this.finish(event.reason);
		}
	}

	/** Counts the event's sequence number. Returns undefined to drop it, false when it arrived late, true otherwise. */
	count({ seq, ts, recvTs }) {
		if (this.seen.has(seq)) {
			this.stats.dupes++;
			return undefined;
		}
		if (seq <= this.covered) {
			this.stats.stale++;
			return undefined;
		}
		this.seen.add(seq);
		this.stats.delivered++;
		this.latencies.push(recvTs - ts);

		if (seq < this.lastSeq) {
			this.stats.outOfOrder++;
			return false;
		}
		if (seq > this.lastSeq + 1) {
			this.stats.gapEvents++;
			this.stats.missingSeqs += seq - this.lastSeq - 1;
		}
		this.lastSeq = seq;
		return true;
	}

	finish(reason) {
		if (!this.ended) {
			this.ended = true;
			this.endReason = reason;
		}
	}

	close() {
		this.adapter?.close();
	}

	result() {
		return {
			index: this.spec.index,
			rid: this.spec.rid,
			server: this.spec.baseUrl,
			streamId: this.streamId,
			mid: this.mid,
			blocks: this.blocks,
			ended: this.ended,
			endReason: this.endReason,
			lastSeq: this.lastSeq,
			bytesIn: this.bytesIn,
			lastError: this.lastError,
			...this.stats,
		};
	}
}
