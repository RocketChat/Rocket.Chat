import type { IEwsTransport } from './IEwsTransport';

/**
 * Talks to Exchange over several connections at once. Each one is a whole transport with its own socket
 */
export class EwsTransportPool implements IEwsTransport {
	private readonly connections: IEwsTransport[];

	private readonly inFlight: number[];

	constructor(size: number, createConnection: () => IEwsTransport) {
		this.connections = Array.from({ length: size }, createConnection);
		this.inFlight = this.connections.map(() => 0);
	}

	public async post(soapEnvelope: string): Promise<string> {
		const index = this.leastBusy();

		this.inFlight[index]++;
		try {
			return await this.connections[index].post(soapEnvelope);
		} finally {
			this.inFlight[index]--;
		}
	}

	/** Ties go to the lowest index, so a quiet workspace keeps reusing one connection instead of opening all of them. */
	private leastBusy(): number {
		let best = 0;
		for (let i = 1; i < this.inFlight.length; i++) {
			if (this.inFlight[i] < this.inFlight[best]) {
				best = i;
			}
		}

		return best;
	}
}
