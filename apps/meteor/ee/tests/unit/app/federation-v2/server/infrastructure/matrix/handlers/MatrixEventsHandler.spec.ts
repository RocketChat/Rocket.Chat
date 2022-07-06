import { expect, spy } from 'chai';

import { MatrixEventsHandlerEE } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/handlers';

describe('FederationEE - Infrastructure - Matrix - MatrixEventsHandlerEE', () => {
	describe('#handleEvent()', () => {
		const spyFn = spy();
		const myHandler = new MatrixEventsHandlerEE([
			{
				equals: (eventType: string): boolean => eventType === 'eventType',
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
