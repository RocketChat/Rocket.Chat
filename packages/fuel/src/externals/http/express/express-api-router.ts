import type http from 'http';

import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import express from 'express';
import _ from 'lodash';
import type { MetadataArgsStorage } from 'routing-controllers';
import { getMetadataArgsStorage, useContainer, useExpressServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';

import type { IDependencyContainerReader } from '../../../internals';
import { injectable, inject, FUEL_DI_TOKENS } from '../../../internals';
import type { ExternalHttpRouterConfig, IExternalHttpRouter, ExternalHttpStartParams } from '../definition';
import { ExternalHttpController } from '../definition';
import { InversifyAdapter } from './container';
import { MeteorCompatibilityMiddleware } from './middlewares/meteor-compatibility';
import { TelemetryMiddleware } from './middlewares/telemetry';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaultMetadataStorage } = require('class-transformer/cjs/storage');

const middlewares = [MeteorCompatibilityMiddleware, TelemetryMiddleware];

@injectable()
export class ExpressAPIRouter implements IExternalHttpRouter {
	private app: express.Express;

	private started = false;

	private controllers: (new (...args: any[]) => ExternalHttpController)[] = [];

	private config: ExternalHttpRouterConfig | null = null;

	private apiDecoratorsGlobalState: MetadataArgsStorage | null = null;

	private onAPIStatusUpdatedCallback: ((server: http.Server) => Promise<void>) | null = null;

	constructor(@inject(FUEL_DI_TOKENS.DEPENDENCY_CONTAINER_READER) private dependencyContainer: IDependencyContainerReader) {
		this.app = express();
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	public async start({ config, onUpdateCallback }: ExternalHttpStartParams): Promise<void> {
		if (this.started) {
			throw new Error('Cannot register routes after the server has started');
		}
		this.started = true;
		this.config = config;
		this.apiDecoratorsGlobalState = _.cloneDeep(getMetadataArgsStorage());
		this.onAPIStatusUpdatedCallback = onUpdateCallback;

		useContainer(new InversifyAdapter(this.dependencyContainer));

		this.setupAPIInstance();
	}

	public registerController(controller: new (...args: any[]) => ExternalHttpController): void {
		this.validateControllerTypes([controller]);
		if (this.controllers.includes(controller)) {
			throw new Error(`Controller ${controller.name} already registered!`);
		}
		this.controllers.push(controller);
	}

	public registerControllers(controllers: (new (...args: any[]) => ExternalHttpController)[]): void {
		this.validateControllerTypes(controllers);
		const providedControllerNames = controllers.map((controller) => controller.name);
		const registeredControlerNames = this.controllers.map((controller) => controller.name);

		const alreadyRegistered = registeredControlerNames.filter((controllerName) => providedControllerNames.includes(controllerName)) || [];
		const hasProvidedDuplicated = new Set(providedControllerNames).size < controllers.length;

		if (alreadyRegistered.length > 0 || hasProvidedDuplicated) {
			throw new Error('There are some controllers already registered!');
		}

		this.controllers = this.controllers.concat(controllers);
	}

	public unregisterControllers(controllers: (new (...args: any[]) => ExternalHttpController)[]): void {
		this.controllers = this.controllers.filter((controller) => !controllers.includes(controller));
	}

	public async refreshAPIInstance(): Promise<void> {
		if (!this.started) {
			return;
		}
		this.setupAPIInstance();
	}

	private setupAPIInstance(): void {
		if (!this.config || !this.onAPIStatusUpdatedCallback) {
			throw new Error('Could not start the External HTTP API instance due to lack of configuration');
		}
		this.setRoutingControllersGlobalStateBasedOnRegisteredControllers();

		useExpressServer(this.app, {
			cors: this.config.cors,
			controllers: this.controllers,
			development: this.config.development,
			classTransformer: this.config.transformInputWhenRequired,
			validation: this.config.validateInput,
			middlewares,
			defaults: {
				//with this option, null will return 200 by default
				nullResultCode: 200,
				//with this option, void or Promise<void> will return 200 by default
				undefinedResultCode: 200,
				paramOptions: {
				  //with this option, argument will be required by default
				  required: true,
				},
			  },
		});

		if (this.config.docs.enabled) {
			this.setupOpenAPIDocs(this.config);
		}

		void this.onAPIStatusUpdatedCallback(this.app as unknown as http.Server);
	}

	private setRoutingControllersGlobalStateBasedOnRegisteredControllers(): void {
		if (!this.apiDecoratorsGlobalState) {
			throw new Error('Could not start the External HTTP API instance due to lack of configuration');
		}
		getMetadataArgsStorage().controllers = this.apiDecoratorsGlobalState.controllers.filter((controller) =>
			this.controllers.includes(controller.target as any),
		);
		getMetadataArgsStorage().actions = this.apiDecoratorsGlobalState.actions.filter((action) =>
			this.controllers.includes(action.target as any),
		);
		getMetadataArgsStorage().responseHandlers = this.apiDecoratorsGlobalState.responseHandlers.filter((responseHandler) =>
			this.controllers.includes(responseHandler.target as any),
		);
	}

	private validateControllerTypes(controllers: (new (...args: any[]) => ExternalHttpController)[]): void {
		if (!controllers.every((module) => module.prototype instanceof ExternalHttpController)) {
			throw new Error('"External Http Controllers" must extend ExternalHttpController');
		}
	}

	private setupOpenAPIDocs(config: ExternalHttpRouterConfig): void {
		const storage = getMetadataArgsStorage();
		const schemas = validationMetadatasToSchemas({
			classTransformerMetadataStorage: defaultMetadataStorage,
			refPointerPrefix: '#/components/schemas/',
		});

		const spec = routingControllersToSpec(
			storage,
			{
				cors: config.cors,
				controllers: this.controllers,
				development: config.development,
			},
			{
				components: {
					schemas: schemas as any,
					securitySchemes: config.docs.securitySchemes,
				},
				info: {
					description: config.docs.description || '',
					title: config.docs.title,
					version: config.docs.version,
				},
			},
		);

		this.app.use(config.docs.routePath, swaggerUi.serve, swaggerUi.setup(spec));
	}
}
