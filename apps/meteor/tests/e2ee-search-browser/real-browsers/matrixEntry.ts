// Test page for the browser matrix. It loads the product test page entry (window.e2eeSearchTest), then takes
// commands from the local driver server through a long-poll loop and posts each result back.
// Nothing here changes product code. Bundled by driver.mjs with esbuild.
import '../pageEntry';
import { createWorkerSqlRunner } from '../../../client/lib/e2eeSearch/browser/workerSqlRunner';

const params = new URLSearchParams(location.search);
const tab = params.get('tab') ?? 'main';
const logs: string[] = [];
const w = window as any;

const logText = (a: unknown): string => {
	if (typeof a === 'string') return a;
	if (a instanceof Error) return `${a.name}: ${a.message}`;
	return JSON.stringify(a);
};

// Keep page console lines (the product logs persistent-storage and eviction lines with console.info/warn).
for (const level of ['log', 'info', 'warn', 'error'] as const) {
	const original = console[level].bind(console);
	console[level] = (...args: unknown[]) => {
		logs.push(args.map(logText).join(' '));
		original(...args);
	};
}
// Worker console lines arrive as {id: -1, __log} messages from the logging wrapper module. The product runner ignores
// replies with an unknown id, so this listener only records them.
const NativeWorker = window.Worker;
if (NativeWorker) {
	w.Worker = class extends NativeWorker {
		constructor(url: string | URL, options?: WorkerOptions) {
			super(url, options);
			this.addEventListener('message', (event: MessageEvent) => {
				if (event.data && event.data.__log) logs.push(`[worker] ${event.data.__log}`);
			});
			this.addEventListener('error', (event: ErrorEvent) => logs.push(`[worker error] ${event.message}`));
		}
	};
}
window.addEventListener('error', (event) => logs.push(`[page error] ${event.message}`));
window.addEventListener('unhandledrejection', (event) => logs.push(`[page rejection] ${String(event.reason?.message ?? event.reason)}`));

w.matrix = { logs, createWorkerSqlRunner, tab };

const post = (path: string, body: unknown) =>
	fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const serialize = (value: unknown): unknown => {
	if (value === undefined) return { __undefined: true };
	return value;
};

const loop = async () => {
	await post('/rpc/hello', { tab, ua: navigator.userAgent, href: location.href, historyLength: history.length });
	for (;;) {
		let command: any;
		try {
			command = await (await fetch(`/rpc/next?tab=${encodeURIComponent(tab)}`)).json();
		} catch {
			await new Promise((r) => setTimeout(r, 500));
			continue;
		}
		if (!command || command.none) continue;
		if (command.kind === 'navigate') {
			await post('/rpc/result', { cid: command.cid, ok: true, value: null });
			location.replace(command.url);
			return;
		}
		if (command.kind === 'close') {
			await post('/rpc/result', { cid: command.cid, ok: true, value: null });
			window.close();
			setTimeout(() => {
				void post('/rpc/closefailed', { tab }).finally(() => location.replace('about:blank'));
			}, 500);
			return;
		}
		try {
			// eslint-disable-next-line no-eval
			const fn = (0, eval)(`(${command.src})`);
			const value = await fn(...(command.args ?? []));
			await post('/rpc/result', { cid: command.cid, ok: true, value: serialize(value) });
		} catch (error: any) {
			await post('/rpc/result', {
				cid: command.cid,
				ok: false,
				error: { name: error?.name ?? 'Error', message: error?.message ?? String(error) },
			});
		}
	}
};
void loop();
