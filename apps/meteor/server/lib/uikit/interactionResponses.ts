/** A submit whose view update was dropped answers with an error, so the client keeps the view open. */
export const viewSubmitAnswer = <T>(delivered: boolean, result: T) =>
	delivered ? { status: 200, body: result } : { status: 409, body: { error: 'The view update was not delivered' } };
