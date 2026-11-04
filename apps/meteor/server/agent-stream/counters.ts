/** Traffic of the instance broker, read and reset by the agent stream metrics route. Counted only with `AGENT_STREAM_POC=1`. */
export const brokerCounters = {
	enabled: process.env.AGENT_STREAM_POC === '1',
	eventsOut: {} as Record<string, number>,
	packetsOut: 0,
	bytesOut: 0,
	packetsIn: 0,
	bytesIn: 0,
};

export const countBrokerEvent = (event: string): void => {
	brokerCounters.eventsOut[event] = (brokerCounters.eventsOut[event] ?? 0) + 1;
};

export const resetBrokerCounters = (): void => {
	brokerCounters.eventsOut = {};
	brokerCounters.packetsOut = 0;
	brokerCounters.bytesOut = 0;
	brokerCounters.packetsIn = 0;
	brokerCounters.bytesIn = 0;
};
