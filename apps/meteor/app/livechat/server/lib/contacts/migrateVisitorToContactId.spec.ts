import type { ILivechatVisitor, IOmnichannelSource } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

const { modelsMock, createContactFromVisitor, mergeVisitorIntoContact, loggerDebug, sandbox } = vi.hoisted(() => {
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		createContactFromVisitor: sandbox.stub(),
		mergeVisitorIntoContact: sandbox.stub(),
		loggerDebug: sandbox.stub(),
		modelsMock: {
			LivechatContacts: {
				findContactMatchingVisitor: sandbox.stub(),
			},
			LivechatRooms: {
				setContactByVisitorAssociation: sandbox.stub(),
				findNewestByContactVisitorAssociation: sandbox.stub(),
			},
		},
	};
});

vi.mock('./createContactFromVisitor', () => ({ createContactFromVisitor }));
vi.mock('./ContactMerger', () => ({ ContactMerger: { mergeVisitorIntoContact } }));
vi.mock('@rocket.chat/models', () => ({
	LivechatContacts: modelsMock.LivechatContacts,
	LivechatRooms: modelsMock.LivechatRooms,
}));
vi.mock('../logger', () => ({ livechatContactsLogger: { debug: loggerDebug } }));

const { migrateVisitorToContactId } = await import('./migrateVisitorToContactId');

describe('migrateVisitorToContactId', () => {
	beforeEach(() => {
		sandbox.reset();
	});

	it('should not create a contact if there is no source for the visitor', async () => {
		expect(await migrateVisitorToContactId({ visitor: { _id: 'visitor1' } } as unknown as Parameters<typeof migrateVisitorToContactId>[0]))
			.to.be.null;
	});

	it('should attempt to create a new contact if there is no free existing contact matching the visitor data', async () => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(undefined);
		const visitor = { _id: 'visitor1' };
		const source = { type: 'other' } as unknown as IOmnichannelSource;
		modelsMock.LivechatRooms.findNewestByContactVisitorAssociation.resolves({ _id: 'room1', v: { _id: visitor._id }, source });
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId({ visitor: { _id: 'visitor1' } as unknown as ILivechatVisitor, source })).to.be.equal(
			'contactCreated',
		);
	});

	it('should not attempt to create a new contact if one is found for the visitor', async () => {
		const visitor = { _id: 'visitor1' } as unknown as ILivechatVisitor;
		const contact = { _id: 'contact1' };
		const source = { type: 'sms' } as unknown as IOmnichannelSource;
		modelsMock.LivechatRooms.findNewestByContactVisitorAssociation.resolves({ _id: 'room1', v: { _id: visitor._id }, source });
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(contact);
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId({ visitor, source })).to.be.equal('contact1');
		expect(mergeVisitorIntoContact.calledOnceWith(visitor, contact, source)).to.be.true;
	});
});
