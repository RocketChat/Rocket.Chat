import { expect } from 'chai';

import type { request } from './api-data';

export function expectInvalidParams(res: Awaited<ReturnType<(typeof request)['post']>>, expectedErrors: string[]): void {
	expect(res.body).to.have.property('success', false);
	expect(res.body).to.have.property('error');
	expect(res.body.error).to.be.a('string');
	expect(res.body.errorType).to.be.equal('invalid-params');
	expect((res.body.error as string).split('\n').map((line) => line.trim())).to.be.deep.equal(expectedErrors);
}
