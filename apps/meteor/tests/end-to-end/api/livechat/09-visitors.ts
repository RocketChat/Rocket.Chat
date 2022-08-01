/* eslint-env mocha */

import { expect } from 'chai';
import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom, ILivechatCustomField } from '@rocket.chat/core-typings';
import { Response } from 'supertest';

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

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.get(api('livechat/visitors.info?visitorId=invalid'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
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
						.expect(400)
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
						.expect(400)
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
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => {
					request
						.get(api('livechat/visitors.autocomplete'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal("The 'selector' param is required");
						});
				})
				.then(() => done());
		});

		it('should return an error if "selector" param is not JSON serializable', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => {
					request
						.get(api('livechat/visitors.autocomplete'))
						.query({ selector: '{invalid' })
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done());
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

	describe('livechat/visitors.search', () => {
		it('should find a visitor by name', (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				request
					.get(api(`livechat/visitors.search?term=${createdVisitor.name}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('total', 1);
						expect(res.body).to.have.property('visitors');
						expect(res.body.visitors).to.be.an('array');
						expect(res.body.visitors).to.have.length(1);
						expect(res.body.visitors[0]).to.have.property('_id');
						expect(res.body.visitors[0]).to.have.property('name');
						expect(res.body.visitors[0]).to.have.property('username');
						expect(res.body.visitors[0]).to.have.property('phone');
						expect(res.body.visitors[0]).to.have.property('visitorEmails');
						expect(res.body.visitors[0]._id).to.be.equal(createdVisitor._id);
						expect(res.body.visitors[0].name).to.be.equal(createdVisitor.name);
					})
					.end(done);
			});
		});
		it('should find a visitor by username', (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				request
					.get(api(`livechat/visitors.search?term=${createdVisitor.username}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('total', 1);
						expect(res.body).to.have.property('visitors');
						expect(res.body.visitors).to.be.an('array');
						expect(res.body.visitors).to.have.length(1);
						expect(res.body.visitors[0]).to.have.property('_id');
						expect(res.body.visitors[0]).to.have.property('name');
						expect(res.body.visitors[0]).to.have.property('username');
						expect(res.body.visitors[0]).to.have.property('phone');
						expect(res.body.visitors[0]).to.have.property('visitorEmails');
						expect(res.body.visitors[0]._id).to.be.equal(createdVisitor._id);
						expect(res.body.visitors[0].username).to.be.equal(createdVisitor.username);
					})
					.end(done);
			});
		});
		it('should find a visitor by email', (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				request
					.get(api(`livechat/visitors.search?term=${createdVisitor?.visitorEmails?.[0].address}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('total', 1);
						expect(res.body).to.have.property('visitors');
						expect(res.body.visitors).to.be.an('array');
						expect(res.body.visitors).to.have.length(1);
						expect(res.body.visitors[0]).to.have.property('_id');
						expect(res.body.visitors[0]).to.have.property('name');
						expect(res.body.visitors[0]).to.have.property('username');
						expect(res.body.visitors[0]).to.have.property('phone');
						expect(res.body.visitors[0]).to.have.property('visitorEmails');
						expect(res.body.visitors[0]._id).to.be.equal(createdVisitor._id);
						expect(res.body.visitors[0].visitorEmails[0].address).to.be.equal(createdVisitor?.visitorEmails?.[0].address);
					})
					.end(done);
			});
		});
		it('should find a visitor by phone', (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				request
					.get(api(`livechat/visitors.search?term=${createdVisitor?.phone?.[0].phoneNumber}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('total', 1);
						expect(res.body).to.have.property('visitors');
						expect(res.body.visitors).to.be.an('array');
						expect(res.body.visitors).to.have.length(1);
						expect(res.body.visitors[0]).to.have.property('_id');
						expect(res.body.visitors[0]).to.have.property('name');
						expect(res.body.visitors[0]).to.have.property('username');
						expect(res.body.visitors[0]).to.have.property('phone');
						expect(res.body.visitors[0]).to.have.property('visitorEmails');
						expect(res.body.visitors[0]._id).to.be.equal(createdVisitor._id);
						expect(res.body.visitors[0].phone[0].phoneNumber).to.be.equal(createdVisitor?.phone?.[0].phoneNumber);
					})
					.end(done);
			});
		});
		it('should return an error when the query params is not valid', (done) => {
			request
				.get(api('livechat/visitors.search?offset=-1'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
		it('should return an empty array when no visitor is found', (done) => {
			request
				.get(api(`livechat/visitors.search?term=${Math.random().toString(36)}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('visitors');
					expect(res.body.visitors).to.be.an('array');
					expect(res.body.visitors).to.have.length(0);
				})
				.end(done);
		});
	});

	describe('GET [omnichannel/contact.search]', () => {
		it('should find a contact by email', (done) => {
			createVisitor()
				.then()
				.then((visitor: ILivechatVisitor) => {
					// visitor.
					request
						.get(api(`omnichannel/contact.search?email=${visitor?.visitorEmails?.[0].address}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('contact');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('name');
							expect(res.body.contact).to.have.property('username');
							expect(res.body.contact).to.have.property('phone');
							expect(res.body.contact).to.have.property('visitorEmails');
							expect(res.body.contact._id).to.be.equal(visitor._id);
							expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
						});
				})
				.then(() => done());
		});
		it('should find a contact by phone', (done) => {
			createVisitor()
				.then()
				.then((visitor: ILivechatVisitor) => {
					// visitor.
					request
						.get(api(`omnichannel/contact.search?phone=${visitor.phone?.[0].phoneNumber}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('contact');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('_id');
							expect(res.body.contact).to.have.property('name');
							expect(res.body.contact).to.have.property('username');
							expect(res.body.contact).to.have.property('phone');
							expect(res.body.contact).to.have.property('visitorEmails');
							expect(res.body.contact._id).to.be.equal(visitor._id);
							expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
						});
				})
				.then(() => done());
		});
		it('should find a contact by custom field', (done) => {
			const cfID = 'address';
			return createCustomField({
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
						.get(api(`omnichannel/contact.search?custom=${new URLSearchParams({ address: 'Rocket.Chat' }).toString()}`))
						.set(credentials)
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
				.then(done);
		});
	});
});

// TODO: Missing tests for the following endpoints:
// - /v1/livechat/visitor.status
// - /v1/livechat/visitor.callStatus
// - /v1/livechat/visitor/:token/room
// - /v1/livechat/visitor
