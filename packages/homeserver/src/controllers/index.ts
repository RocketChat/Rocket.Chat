import 'reflect-metadata';
import { container } from 'tsyringe';
import type { RouteHandler } from './base.controller';

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
import { createLogger } from '../utils/logger';
import Elysia from 'elysia';

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

const controllerClasses = [
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

const logger = createLogger('Controllers');

export async function getAllRoutes(): Promise<RouteHandler[]> {
	const routes: RouteHandler[] = [];
	
	for (const ControllerClass of controllerClasses) {
		try {
			const controller = container.resolve(ControllerClass);
			routes.push(...controller.getRoutes());
		} catch (error) {
			logger.error(`Error resolving controller ${ControllerClass.name}:`, error);
		}
	}
	
	logger.info(`Total routes collected: ${routes.length}`);
	return routes;
}

export function registerAllElysiaRoutes(app: Elysia): void {
	logger.info('Registering Elysia routes...');
	let successCount = 0;
	let errorCount = 0;
	
	for (const ControllerClass of controllerClasses) {
		try {
			const controller = container.resolve(ControllerClass);
			controller.registerElysiaRoutes(app);
			successCount++;
		} catch (error) {
			logger.error(`Error registering controller ${ControllerClass.name}:`, error);
			errorCount++;
		}
	}
	
	logger.info(`Total controllers registered: ${successCount} successful, ${errorCount} failed`);
}