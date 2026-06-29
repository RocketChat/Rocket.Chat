import * as Messenger from './lib/messenger';

export function unhandledRejectionListener(event: PromiseRejectionEvent) {
	event.preventDefault();

	const error = event.reason;

	Messenger.sendNotification({
		method: 'unhandledRejection',
		params: [error?.stack || error],
	});
}

export function unhandledExceptionListener(event: ErrorEvent) {
	event.preventDefault();

	const error = event.error;

	Messenger.sendNotification({
		method: 'uncaughtException',
		params: [error?.stack || error],
	});
}

export default function registerErrorListeners() {
	addEventListener('unhandledrejection', unhandledRejectionListener);
	addEventListener('error', unhandledExceptionListener);
}
