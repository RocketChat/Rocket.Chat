import { WebApp } from 'meteor/webapp';

// meteor's webapp arms a 5s idle-socket timeout (and re-arms it after every
// response), which kills keep-alive conns a fronting proxy may be about to
// reuse — the root of the CI dynamic-import truncation flake (PR #41399).
// Overriding it is opt-in: only CI sets HTTP_SOCKET_TIMEOUT_MS, pointing it
// above traefik's idleConnTimeout so the proxy always closes conns first.
const timeout = parseInt(process.env.HTTP_SOCKET_TIMEOUT_MS ?? '', 10);
if (timeout > 0) {
	const { httpServer, _timeoutAdjustmentRequestCallback } = WebApp as typeof WebApp & {
		_timeoutAdjustmentRequestCallback: (req: unknown, res: unknown) => void;
	};
	httpServer.removeListener('request', _timeoutAdjustmentRequestCallback);
	httpServer.setTimeout(timeout);
	httpServer.keepAliveTimeout = timeout;
	httpServer.headersTimeout = timeout + 1000;
}
