import { Elysia } from 'elysia';
import { container, injectable, inject } from 'tsyringe';
import { type ErrorResponse, ErrorResponseDto, SendTransactionBodyDto, type SendTransactionResponse, SendTransactionResponseDto } from '../../dtos';
import { EventService } from '../../services/event.service';
import { BaseController, type RouteHandler } from '../base.controller';

@injectable()
export class FederationTransactionsController extends BaseController {
	constructor(@inject('EventService') private eventService: EventService) {
		super();
	}

	getRoutes(): RouteHandler[] {
		return [
			{
				method: 'PUT',
				path: '/_matrix/federation/v1/send/:txnId',
				handler: async ({ body }): Promise<SendTransactionResponse | ErrorResponse> => {
					const { pdus = [] } = body;
					if (pdus.length === 0) {
						return {
							pdus: {},
							edus: {},
						};
					}
					await this.eventService.processIncomingPDUs(pdus);
					return {
						pdus: {},
						edus: {},
					};
				},
				elysiaConfig: {
					body: SendTransactionBodyDto,
					response: {
						200: SendTransactionResponseDto,
						400: ErrorResponseDto,
					},
					detail: {
						tags: ['Federation'],
						summary: 'Send transaction',
						description: 'Send a transaction'
					}
				}
			}
		];
	}
}

// Export the old plugin function for backward compatibility
export const transactionsPlugin = (app: Elysia) => {
	const controller = container.resolve(FederationTransactionsController);
	controller.registerElysiaRoutes(app);
	return app;
};
