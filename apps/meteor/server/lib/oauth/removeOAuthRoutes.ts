import { oAuthRouter } from '../../configuration/configurePassport';

/**
 * Removes every route previously registered for an OAuth service from the OAuth router.
 *
 * OAuth services are re-registered whenever their settings change, but express only ever
 * *appends* to `router.stack` and dispatches on a first-match-wins basis. Without this,
 * re-registering a service leaves the previous handlers in place and they keep serving the
 * requests, using the configuration that was captured in their closures at registration time
 * (`loginStyle`, `scope`, ...). Callers must invoke this before registering the routes again.
 */
export const removeOAuthRoutes = (serviceName: string): void => {
	const paths = [`/oauth/${serviceName}`, `/_oauth/${serviceName}`];

	const router = oAuthRouter;

	// Only route layers are dropped; middleware layers registered via `router.use`
	router.stack = router.stack.filter((layer) => !layer.route || !paths.includes(layer.route.path));
};
