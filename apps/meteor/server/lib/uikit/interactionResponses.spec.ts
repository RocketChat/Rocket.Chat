import { viewSubmitAnswer } from './interactionResponses';

describe('viewSubmitAnswer', () => {
	it('answers the result of a delivered update', () => {
		expect(viewSubmitAnswer(true, { type: 'modal.update' })).toEqual({ status: 200, body: { type: 'modal.update' } });
	});

	it('answers 409 for a dropped update', () => {
		expect(viewSubmitAnswer(false, { type: 'modal.update' }).status).toBe(409);
	});
});
