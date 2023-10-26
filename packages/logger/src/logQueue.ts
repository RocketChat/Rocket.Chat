import EventEmitter from 'events';

const { MOLECULER_LOG_LEVEL, STDOUT_VIEWER_DISABLED = 'false' } = process.env;

type LogQueue = {
	id: string;
	data: string;
	ts: Date;
};

const queue: LogQueue[] = [];
const maxInt = 2147483647;
let queueLimit = 1000;
let queueSize = 0;

export function setQueueLimit(limit: number): void {
	queueLimit = limit;

	if (queueSize > queueLimit) {
		queue.splice(0, queueSize - queueLimit);
	}
}

export function getQueuedLogs(): LogQueue[] {
	return queue;
}

export const logEntries = new EventEmitter();

const { write } = process.stdout;

function queueWrite(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
function queueWrite(str: Uint8Array | string, encoding?: string, cb?: (err?: Error) => void): boolean;
function queueWrite(...args: any): boolean {
	write.apply(process.stdout, args);

	const [str] = args;
	if (typeof str !== 'string') {
		return true;
	}

	const date = new Date();
	const item = {
		id: `logid-${queueSize}`,
		data: str,
		ts: date,
	};
	queue.push(item);

	queueSize = (queueSize + 1) & maxInt;

	if (queueSize > queueLimit) {
		queue.shift();
	}

	logEntries.emit('log', item);

	return true;
}

if (String(MOLECULER_LOG_LEVEL).toLowerCase() !== 'debug' && STDOUT_VIEWER_DISABLED === 'false') {
	process.stdout.write = queueWrite;
}
