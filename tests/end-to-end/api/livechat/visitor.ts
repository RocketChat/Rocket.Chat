import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { createVisitor, createLivechatRoom, createAgent } from '../../../data/livechat/rooms.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - visitor', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() => {
			createAgent()
				.then(() => createVisitor())
				.then(() => done());
		});
	});

	describe('livechat/visitor', () => {
		it("should return a 'failure error' when scope of the custom field is equal to 'visitor' and livechatDataByToken cannot by updated", (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('failure');
					})
					.end(done);
			});
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?token=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "name" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?name=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "email" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?email=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "department" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?department=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "phone" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?phone=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "username" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?username=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return an error when the "customFields" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/visitor?customFields=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return nothing when there is no customField', (done) => {
			request
				.get(api(`livechat/visitor?token=123&name=John&email=test@gmail.com&department=test&phone=123456789&customFields={}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.rooms).to.equal(null);
				})
				.end(done);
		});
	});

	it('should return an array of rooms when the query params is all valid', (done) => {
		request
			.get(
				api(
					`livechat/visitor?token=123&name=John&email=test@gmail.com&department=test&phone=123456789&customFields={"key": "123", "value": "test", "overwrite": "false"}`,
				),
			)
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body.rooms).to.be.an('object');
				expect(res.body).to.have.property('visitor');
			})
			.end(done);
	});
});
