import * as Messenger from './lib/messenger.ts';

export function unhandledRejectionListener(event: PromiseRejectionEvent) {
    event.preventDefault();

    const { type, reason } = event;

    Messenger.sendNotification({
        method: 'unhandledRejection',
        params: [
            {
                type,
                reason: reason instanceof Error ? reason.message : reason,
                timestamp: new Date(),
            },
        ],
    });
}

export function unhandledExceptionListener(event: ErrorEvent) {
    event.preventDefault();

    const { type, message, filename, lineno, colno } = event;
    Messenger.sendNotification({
        method: 'uncaughtException',
        params: [{ type, message, filename, lineno, colno }],
    });
}

export default function registerErrorListeners() {
    addEventListener('unhandledrejection', unhandledRejectionListener);
    addEventListener('error', unhandledExceptionListener);
}
