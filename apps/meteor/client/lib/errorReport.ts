export type ErrorReportSource = {
	error: unknown;
	componentStack?: string | null;
	routeName?: string;
	version?: string;
	commitHash?: string;
};

const describeError = (error: unknown, depth = 0): string[] => {
	if (!(error instanceof Error)) {
		return [`Thrown value: ${String(error)}`];
	}

	const lines = [`${error.name}: ${error.message}`, error.stack ?? '(no stack trace)'];

	if (error.cause !== undefined && depth < 3) {
		lines.push('', 'Caused by:', ...describeError(error.cause, depth + 1));
	}

	return lines;
};

/**
 * Plain-text report of a UI crash, safe to paste into a support ticket: it carries the error and
 * the environment it happened in, but nothing that identifies the user, their rooms or their messages.
 */
export const buildErrorReport = ({ error, componentStack, routeName, version, commitHash }: ErrorReportSource): string => {
	const environment = [
		`Date: ${new Date().toISOString()}`,
		version && `Version: ${version}`,
		commitHash && `Commit: ${commitHash}`,
		routeName && `Route: ${routeName}`,
		`User agent: ${navigator.userAgent}`,
		`Language: ${navigator.language}`,
		`Time zone: ${new Intl.DateTimeFormat().resolvedOptions().timeZone}`,
		`Viewport: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
		`Online: ${navigator.onLine}`,
	].filter(Boolean);

	return [
		'--- Environment ---',
		...environment,
		'',
		'--- Error ---',
		...describeError(error),
		...(componentStack ? ['', '--- Component stack ---', componentStack.trim()] : []),
	].join('\n');
};
