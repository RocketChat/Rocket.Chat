import { container } from 'tsyringe';
import type { RouteHandler } from './base.controller';

// Import all controllers
import { FederationInviteController } from './federation/invite.controller';
import { FederationProfilesController } from './federation/profiles.controller';
import { FederationSendJoinController } from './federation/send-join.controller';
import { FederationTransactionsController } from './federation/transactions.controller';
import { FederationVersionsController } from './federation/versions.controller';
import { FederationApiController } from './federation/api.controller';
import { InternalInviteController } from './internal/invite.controller';
import { InternalMessageController } from './internal/message.controller';
import { InternalPingController } from './internal/ping.controller';
import { InternalRoomController } from './internal/room.controller';
import { KeyServerController } from './key/server.controller';
import { WellKnownController } from './well-known/well-known.controller';
import { ClientVersionsController } from './client/versions.controller';

// Export all controller classes
export {
	FederationInviteController,
	FederationProfilesController,
	FederationSendJoinController,
	FederationTransactionsController,
	FederationVersionsController,
	FederationApiController,
	InternalInviteController,
	InternalMessageController,
	InternalPingController,
	InternalRoomController,
	KeyServerController,
	WellKnownController,
	ClientVersionsController,
};

// List of all controller classes
export const controllerClasses = [
	FederationInviteController,
	FederationProfilesController,
	FederationSendJoinController,
	FederationTransactionsController,
	FederationVersionsController,
	FederationApiController,
	InternalInviteController,
	InternalMessageController,
	InternalPingController,
	InternalRoomController,
	KeyServerController,
	WellKnownController,
	ClientVersionsController,
];

// Get all routes from all controllers
export function getAllRoutes(): RouteHandler[] {
	const routes: RouteHandler[] = [];
	
	for (const ControllerClass of controllerClasses) {
		const controller = container.resolve(ControllerClass);
		routes.push(...controller.getRoutes());
	}
	
	return routes;
}

// Register all routes with Elysia (for microservice mode)
export function registerAllElysiaRoutes(app: any): void {
	for (const ControllerClass of controllerClasses) {
		const controller = container.resolve(ControllerClass);
		controller.registerElysiaRoutes(app);
	}
}