import { expect, spy } from 'chai';

import { MatrixEventsHandler } from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/handlers';

describe('Federation - Infrastructure - Matrix - MatrixEventsHandler', () => {
	describe('#handleEvent()', () => {
		const spyFn = spy();
		const myHandler = new MatrixEventsHandler([
			{
				eventType: 'eventType',
				equals: (event: any): boolean => event.type === 'eventType',
				handle: spyFn,
			},
		] as any);

		it('should call the handler fn properly', async () => {
			await myHandler.handleEvent({ type: 'eventType' } as any);
			expect(spyFn).to.have.been.called.with({ type: 'eventType' });
		});

		it('should NOT call the handler if there is no handler for the event', async () => {
			await myHandler.handleEvent({ type: 'eventType2' } as any);
			expect(spyFn).to.not.be.called;
		});
	});
});
