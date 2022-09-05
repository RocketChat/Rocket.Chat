/* eslint-env mocha */

import { expect } from 'chai';
import type { ILivechatAgent, ILivechatCustomField, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { makeAgentAvailable, createAgent, createLivechatRoom, createVisitor, takeInquiry } from '../../../data/livechat/rooms';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';

describe('LIVECHAT - visitors', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() =>
			updatePermission('view-livechat-manager', ['admin']).then(() =>
				createAgent().then(() =>
					makeAgentAvailable().then(() =>
						createVisitor().then((createdVisitor) => {
							visitor = createdVisitor;
							done();
						}),
					),
				),
			),
		);
	});

	describe('livechat/visitor', () => {
		it('should fail if no "visitor" key is passed as body parameter', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if visitor.token is not present', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: {} });
			expect(body).to.have.property('success', false);
		});
		it('should create a visitor', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token: 'test' } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', 'test');

			// Ensure all new visitors are created as online :)
			expect(body.visitor).to.have.property('status', 'online');
		});
		it('should create a visitor with provided extra information', async () => {
			const token = `${new Date().getTime()}-test`;
			const phone = new Date().getTime().toString();
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token, phone } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('phone');
			expect(body.visitor.phone[0].phoneNumber).to.equal(phone);
		});
		it('should save customFields when passed', async () => {
			const customFieldName = `new_custom_field_${Date.now()}`;
			const token = `${new Date().getTime()}-test`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			} as unknown as ILivechatCustomField & { field: string });
			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('livechatData');
			expect(body.visitor.livechatData).to.have.property(customFieldName, 'Not a real address :)');
		});
		it('should update a current visitor when phone is same', async () => {
			const token = `${new Date().getTime()}-test`;
			const token2 = `${new Date().getTime()}-test2`;
			const phone = new Date().getTime().toString();
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token, phone } });
			expect(body).to.have.property('success', true);

			const { body: body2 } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token: token2,
					phone,
				},
			});

			expect(body2).to.have.property('success', true);
			expect(body2).to.have.property('visitor');

			// Same visitor won't update the token
			expect(body2.visitor).to.have.property('token', token);
			expect(body2.visitor).to.have.property('phone');
			expect(body2.visitor.phone[0].phoneNumber).to.equal(phone);
		});
	});

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.get(api('livechat/visitors.info?visitorId=invalid'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('error-not-authorized');
						});
				})
				.then(() => done());
		});
		it('should return an "visitor not found error" when the visitor doe snot exists', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
						.get(api('livechat/visitors.info?visitorId=invalid'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('visitor-not-found');
						});
				})
				.then(() => done());
		});
		it('should return the visitor info', (done) => {
			request
				.get(api(`livechat/visitors.info?visitorId=${visitor._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.visitor._id).to.be.equal(visitor._id);
				})
				.end(done);
		});
	});

	describe('livechat/visitors.pagesVisited', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.get(api('livechat/visitors.pagesVisited/room-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('error-not-authorized');
						});
				})
				.then(() => done());
		});
		it('should return an "error" when the roomId param is not provided', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
						.get(api('livechat/visitors.pagesVisited/room-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done());
		});
		it('should return an array of pages', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				createVisitor().then((createdVisitor: ILivechatVisitor) => {
					createLivechatRoom(createdVisitor.token)
						.then((createdRoom: IOmnichannelRoom) => {
							request
								.get(api(`livechat/visitors.pagesVisited/${createdRoom._id}`))
								.set(credentials)
								.expect('Content-Type', 'application/json')
								.expect(200)
								.expect((res: Response) => {
									expect(res.body).to.have.property('success', true);
									expect(res.body.pages).to.be.an('array');
									expect(res.body).to.have.property('offset');
									expect(res.body).to.have.property('total');
									expect(res.body).to.have.property('count');
								});
						})
						.then(() => done());
				});
			});
		});
	});

	describe('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('error-not-authorized');
						});
				})
				.then(() => done());
		});
		it('should return an "error" when the roomId param is invalid', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
						.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done());
		});
		it('should return an array of chat history', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				createVisitor()
					.then((createdVisitor: ILivechatVisitor) => {
						createLivechatRoom(createdVisitor.token).then((createdRoom: IOmnichannelRoom) => {
							request
								.get(api(`livechat/visitors.chatHistory/room/${createdRoom._id}/visitor/${createdVisitor._id}`))
								.set(credentials)
								.expect('Content-Type', 'application/json')
								.expect(200)
								.expect((res: Response) => {
									expect(res.body).to.have.property('success', true);
									expect(res.body.history).to.be.an('array');
									expect(res.body).to.have.property('offset');
									expect(res.body).to.have.property('total');
									expect(res.body).to.have.property('count');
								});
						});
					})
					.then(() => done());
			});
		});
	});

	describe('livechat/visitor/:token', () => {
		// get
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return a visitor when the query params is all valid', (done) => {
			request
				.get(api(`livechat/visitor/${visitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('visitor');
				})
				.end(done);
		});

		// delete
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it("should return a 'visitor-has-open-rooms' error when there are open rooms", (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				createLivechatRoom(createdVisitor.token)
					.then(() => {
						request
							.delete(api(`livechat/visitor/${createdVisitor.token}`))
							.set(credentials)
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', false);
								expect(res.body.error).to.be.equal('Cannot remove visitors with opened rooms [visitor-has-open-rooms]');
							});
					})
					.then(() => done());
			});
		});

		it('should return a visitor when the query params is all valid', (done) => {
			createVisitor()
				.then((createdVisitor: ILivechatVisitor) => {
					request
						.delete(api(`livechat/visitor/${createdVisitor.token}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('visitor');
							expect(res.body.visitor).to.have.property('_id');
							expect(res.body.visitor).to.have.property('ts');
							expect(res.body.visitor._id).to.be.equal(createdVisitor._id);
						});
				})
				.then(() => done());
		});

		it("should return a 'error-removing-visitor' error when removeGuest's result is false", (done) => {
			request
				.delete(api('livechat/visitor/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('livechat/visitors.autocomplete', () => {
		it('should return an error when the user doesnt have the right permissions', (done) => {
			updatePermission('view-l-room', [])
				.then(() =>
					request.get(api('livechat/visitors.autocomplete')).set(credentials).expect('Content-Type', 'application/json').expect(403),
				)
				.then(() => done());
		});

		it('should return an error when the "selector" query parameter is not valid', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent']).then(() => {
				request
					.get(api('livechat/visitors.autocomplete'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal("The 'selector' param is required");
					})
					.end(done);
			});
		});

		it('should return an error if "selector" param is not JSON serializable', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent']).then(() => {
				request
					.get(api('livechat/visitors.autocomplete'))
					.query({ selector: '{invalid' })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});

		it('should return a list of visitors when the query params is all valid', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => createVisitor())
				.then((createdVisitor: ILivechatVisitor) => {
					request
						.get(api('livechat/visitors.autocomplete'))
						.query({ selector: JSON.stringify({ term: createdVisitor.name }) })
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('items');
							expect(res.body.items).to.be.an('array');
							expect(res.body.items).to.have.length.of.at.least(1);
							expect(res.body.items[0]).to.have.property('_id');
							expect(res.body.items[0]).to.have.property('name');

							const visitor = res.body.items.find((item: any) => item._id === createdVisitor._id);
							expect(visitor).to.have.property('_id');
							expect(visitor).to.have.property('name');
							expect(visitor._id).to.be.equal(createdVisitor._id);
						});
				})
				.then(() => done());
		});
	});

	describe('livechat/visitors.searchChats/room/:roomId/visitor/:visitorId', () => {
		it('should return an error when the user doesnt have the right permissions', (done) => {
			updatePermission('view-l-room', [])
				.then(() =>
					request
						.get(api('livechat/visitors.searchChats/room/123/visitor/123'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403),
				)
				.then(() => done())
				.catch(done);
		});

		it('should throw an error when the roomId is not valid', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => {
					request
						.get(api('livechat/visitors.searchChats/room/invalid/visitor/123'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done())
				.catch(done);
		});

		it('should return an empty array if the user is not the one serving the chat', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
				.then(() => createVisitor())
				.then((createdVisitor: ILivechatVisitor) => createLivechatRoom(createdVisitor.token))
				.then((room: IOmnichannelRoom) => {
					request
						.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/123`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('history');
							expect(res.body.history).to.be.an('array');
							expect(res.body.history).to.have.lengthOf(0);
						});
				})
				.then(() => done())
				.catch(done);
		});

		it('should return an empty array if the visitorId doesnt correlate to room', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
				.then(() => createVisitor())
				.then((createdVisitor: ILivechatVisitor) => createLivechatRoom(createdVisitor.token))
				.then((room: IOmnichannelRoom) => {
					request
						.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/123`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('history');
							expect(res.body.history).to.be.an('array');
							expect(res.body.history).to.have.lengthOf(0);
						});
				})
				.then(() => done())
				.catch(done);
		});

		it('should return a list of chats when the query params is all valid', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
				.then(() => createVisitor())
				.then((createdVisitor: ILivechatVisitor) => Promise.all([createLivechatRoom(createdVisitor.token), createdVisitor]))
				.then(([room, visitor]: [IOmnichannelRoom, ILivechatVisitor]) => Promise.all([createAgent(), room, visitor]))
				.then(([agent, room, visitor]: [ILivechatAgent, IOmnichannelRoom, ILivechatVisitor]) => {
					return Promise.all([room, visitor, takeInquiry(room._id, agent._id)]);
				})
				.then(([room, visitor]: [IOmnichannelRoom, ILivechatVisitor, any]) => {
					request
						.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/${visitor._id}?closedChatsOnly=false&servedChatsOnly=false`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('history');
							expect(res.body.history).to.be.an('array');
							expect(res.body.history).to.have.length.of.at.least(1);
							expect(res.body.history[0]).to.have.property('_id');
							expect(res.body.history[0]).to.have.property('name');
							expect(res.body.history[0]).to.have.property('createdAt');
							expect(res.body.history[0]).to.have.property('endedAt');
							expect(res.body.history[0]).to.have.property('status');
							expect(res.body.history[0]).to.have.property('visitor');
						});
				})
				.then(() => done())
				.catch(done);
		});
	});

	describe('livechat/visitor.status', () => {
		it('should return an error if token is not present as body param', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should return an error if status is not present as body param', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).send({ token: '123' }).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should return an error if token is not a valid guest token', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).send({ token: '123', status: 'online' }).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should update visitor status if all things are valid', async () => {
			const visitor = await createVisitor();
			const res = await request
				.post(api('livechat/visitor.status'))
				.set(credentials)
				.send({ token: visitor.token, status: 'online' })
				.expect(200);
			expect(res.body).to.have.property('success', true);
		});
	});

	describe('GET [omnichannel/contact.search]', () => {
		it('should fail if no email|phone|custom params are passed as query', async () => {
			await request.get(api('omnichannel/contact.search')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if its trying to find by an empty string', async () => {
			await request.get(api('omnichannel/contact.search?email=')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if custom is passed but is not JSON serializable', async () => {
			await request
				.get(api('omnichannel/contact.search?custom={a":1}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if custom is an empty object and no email|phone are provided', async () => {
			await request
				.get(api('omnichannel/contact.search?custom={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should find a contact by email', (done) => {
			createVisitor()
				.then((visitor: ILivechatVisitor) => {
					request
						.get(api(`omnichannel/contact.search?email=${visitor.visitorEmails?.[0].address}`))
						.set(credentials)
						.send()
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('contact');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('name');
							expect(res.body.contact).to.have.property('username');
							expect(res.body.contact).to.have.property('phone');
							expect(res.body.contact).to.have.property('visitorEmails');
							expect(res.body.contact._id).to.be.equal(visitor._id);
							expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
							// done();
						});
				})
				.then(() => done())
				.catch(done);
		});
		it('should find a contact by phone', (done) => {
			createVisitor()
				.then((visitor: ILivechatVisitor) => {
					request
						.get(api(`omnichannel/contact.search?phone=${visitor.phone?.[0].phoneNumber}`))
						.set(credentials)
						.send()
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('contact');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('name');
							expect(res.body.contact).to.have.property('username');
							expect(res.body.contact).to.have.property('phone');
							expect(res.body.contact).to.have.property('visitorEmails');
							expect(res.body.contact._id).to.be.equal(visitor._id);
							expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
						});
				})
				.then(() => done())
				.catch(done);
		});
		it('should find a contact by custom field', (done) => {
			const cfID = 'address';
			createCustomField({
				searchable: true,
				field: 'address',
				label: 'address',
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			} as unknown as ILivechatCustomField & { field: string })
				.then((cf) => {
					if (!cf) {
						throw new Error('Custom field not created');
					}
				})
				.then(() => createVisitor())
				.then(() => {
					request
						.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ address: 'Rocket.Chat' })}`))
						.set(credentials)
						.send()
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.contact).to.have.property('name');
							expect(res.body.contact).to.have.property('username');
							expect(res.body.contact).to.have.property('phone');
							expect(res.body.contact).to.have.property('visitorEmails');
							expect(res.body.contact.livechatData).to.have.property('address', 'Rocket.Chat street');
							deleteCustomField(cfID);
						});
				})
				.then(() => done())
				.catch(done);
		});

		it('should return null if an invalid set of custom fields is passed and no other params are sent', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if more than 1 custom field are passed', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: 'nel', another: 'field' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ $regex: 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys 2', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ '$regex: { very-bad }': 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field values', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: '^((ab)*)+$' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});
	});
	// Check if this endpoint is still being used
	describe('livechat/room.visitor', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if rid is not on body params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId is not on body params', async () => {
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send({ rid: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if newVisitorId is not on body params', async () => {
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send({ rid: 'GENERAL', oldVisitorId: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId doesnt point to a valid visitor', async () => {
			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: 'GENERAL', oldVisitorId: 'GENERAL', newVisitorId: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if rid doesnt point to a valid room', async () => {
			const visitor = await createVisitor();
			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: 'GENERAL', oldVisitorId: visitor._id, newVisitorId: visitor._id });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId is trying to change a room is not theirs', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const visitor2 = await createVisitor();

			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: room._id, oldVisitorId: visitor2._id, newVisitorId: visitor._id });
			expect(res.body).to.have.property('success', false);
		});
		it('should successfully change a room visitor with a new one', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const visitor2 = await createVisitor();

			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: room._id, oldVisitorId: visitor._id, newVisitorId: visitor2._id });
			expect(res.body).to.have.property('success', true);
			expect(res.body.room).to.have.property('v');
			expect(res.body.room.v._id).to.equal(visitor2._id);
		});
	});
});

// TODO: Missing tests for the following endpoints:
// - /v1/livechat/visitor.status
// - /v1/livechat/visitor.callStatus
