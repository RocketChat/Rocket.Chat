export type LoadConfig = {
	users: number;
	iterations: number;
	rampDelayMs: number;
	pauseBetweenIterationsMs: number;
	statusMessages: string[];
	messageTemplate: string;
};

const toNumber = (value: string | undefined, fallback: number, minimum = 0): number => {
	const parsed = Number(value);
	if (Number.isFinite(parsed) && parsed >= minimum) {
		return parsed;
	}
	return fallback;
};

const toStringArray = (value: string | undefined, fallback: string[]): string[] => {
	if (!value) {
		return fallback;
	}
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
};

export const getLoadConfig = (overrides: Partial<LoadConfig> = {}): LoadConfig => {
	const users = Math.max(1, toNumber(process.env.LOAD_USERS, 5, 1));
	const iterations = Math.max(1, toNumber(process.env.LOAD_ITERATIONS, 3, 1));
	const rampDelayMs = toNumber(process.env.LOAD_RAMP_MS, 30, 0);
	const pauseBetweenIterationsMs = toNumber(process.env.LOAD_ITERATION_PAUSE_MS, 50, 0);
	const statusMessages = toStringArray(process.env.LOAD_STATUS_MESSAGES, ['Heads down', 'In a meeting', 'Back soon']);
	const messageTemplate = process.env.LOAD_MESSAGE_TEMPLATE ?? 'playwright-load-message';

	return {
		users,
		iterations,
		rampDelayMs,
		pauseBetweenIterationsMs,
		statusMessages,
		messageTemplate,
		...overrides,
	};
};
