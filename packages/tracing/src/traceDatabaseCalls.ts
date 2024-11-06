import type { Tracer } from '@opentelemetry/api';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import type { MongoClient } from 'mongodb';

export const initDatabaseTracing = (tracer: Tracer, client: MongoClient) => {
	const DurationStart = new Map();

	client.on('commandStarted', (event) => {
		const collection = event.command[event.commandName];

		const currentSpan = trace.getSpan(context.active());
		if (currentSpan) {
			const span = tracer.startSpan(`mongodb ${collection}.${event.commandName}`, {
				attributes: {
					'db.connection_string': event.address,
					'db.mongodb.collection': collection,
					'db.name': event.databaseName,
					'db.operation': event.commandName,
					'db.statement': JSON.stringify(event.command, null, 2),
					'db.system': 'mongodb',
					// net.peer.name
					// net.peer.port
				},
			});

			DurationStart.set(event.requestId, { event, span });
		}
	});

	client.on('commandSucceeded', (event) => {
		if (!DurationStart.has(event.requestId)) {
			return;
		}

		const { span } = DurationStart.get(event.requestId);
		DurationStart.delete(event.requestId);

		span.end();
	});

	client.on('commandFailed', (event) => {
		if (!DurationStart.has(event.requestId)) {
			return;
		}

		const { span } = DurationStart.get(event.requestId);

		DurationStart.delete(event.requestId);

		span.recordException(event.failure);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: event.failure.message,
		});

		span.end();
	});
};
