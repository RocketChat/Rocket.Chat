import { expect } from 'chai';
import * as superagent from 'superagent';
import { Test } from 'supertest';

declare module 'supertest' {
	export class Test {
		expectLoginSuccess(): this;
		expectLoginFailure(): this;
		success(): this;
	}

	interface SuperTest<T extends superagent.SuperAgentRequest> extends superagent.SuperAgent<T> {
		expectLoginSuccess(props: Record<string, string>): Test;
		expectLoginFailure(props: Record<string, string>): Test;
	}
}

Test.prototype.expectLoginSuccess = function () {
	return this.success().expect((res) => {
		expect(res.body).to.have.property('status', 'success');
		expect(res.body).to.have.property('data');
		expect(res.body.data).to.have.property('authToken');
		expect(res.body.data).to.have.property('userId');
	});
	return this;
};

Test.prototype.expectLoginFailure = function () {
	return this.expect(401)
		.expect('Content-Type', 'application/json')
		.expect((res) => {
			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});
};

Test.prototype.success = function () {
	return this.expect('Content-Type', 'application/json').expect(200);
};
