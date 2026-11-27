export type Status = 'pending' | 'renders' | 'empty' | 'throws' | 'needs-context';

export type Result = {
	name: string;
	status: Status;
	error?: string;
	size?: string;
	uncaught?: string;
	viaText?: boolean;
	context?: string;
};

// `yarn sweep` sets the sink to its local receiver; without it the sweep is only shown on screen
export const sendReport = (results: Result[]) => {
	const sink = process.env.EXPO_PUBLIC_SWEEP_SINK;
	if (!sink) return;
	fetch(sink, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(results) }).catch(() => undefined);
};
