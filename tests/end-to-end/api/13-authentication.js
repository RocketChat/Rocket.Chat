/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import { api, request } from '../../data/api-data.js';
import { adminEmail } from '../../data/user.js';

describe('[Authentication]', () => {
	describe('/forgotPassword', () => {
		it('should send email to user (return success), when is a valid email', (done) => {
			request.post(api('forgotPassword'))
				.send({
					email: adminEmail
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should not send email to user(return error), when is a invalid email', (done) => {
			request.post(api('forgotPassword'))
				.send({
					email: 'invalidEmail'
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});
