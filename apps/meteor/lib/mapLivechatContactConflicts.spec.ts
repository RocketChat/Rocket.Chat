import type { Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { mapLivechatContactConflicts } from './mapLivechatContactConflicts';

const sampleContact: Serialized<ILivechatContact> = {
	_id: 'any',
	name: 'Contact Name',
	createdAt: '',
	_updatedAt: '',
	channels: [],
};

describe('Map Livechat Contact Conflicts', () => {
	it('should return an empty object when the contact has no conflicts', () => {
		expect(mapLivechatContactConflicts({ ...sampleContact })).to.be.equal({});
	});

	it('should group conflicts of the same field in a single atribute', () => {
		expect(
			mapLivechatContactConflicts({
				...sampleContact,
				name: '',
				conflictingFields: [
					{
						field: 'name',
						value: 'First Name',
					},
					{
						field: 'name',
						value: 'Second Name',
					},
				],
			}),
		).to.be.deep.equal({
			name: {
				name: 'name',
				label: 'Name',
				values: ['First Name', 'Second Name'],
			},
		});
	});

	it('should include the current value from the contact on the list of values of the conflict', () => {
		expect(
			mapLivechatContactConflicts({
				...sampleContact,
				name: 'Current Name',
				conflictingFields: [
					{
						field: 'name',
						value: 'First Name',
					},
					{
						field: 'name',
						value: 'Second Name',
					},
				],
			}),
		).to.be.deep.equal({
			name: {
				name: 'name',
				label: 'Name',
				values: ['First Name', 'Second Name', 'Current Name'],
			},
		});
	});

	it('should have a separate attribute for each conflicting field', () => {
		expect(
			mapLivechatContactConflicts({
				...sampleContact,
				conflictingFields: [
					{
						field: 'name',
						value: 'First Value',
					},
					{
						field: 'name',
						value: 'Second Value',
					},
					{
						field: 'manager',
						value: '1',
					},
					{
						field: 'manager',
						value: '2',
					},
				],
			}),
		).to.be.deep.equal({
			name: {
				name: 'name',
				label: 'Name',
				values: ['First Name', 'Second Name', 'Contact Name'],
			},
			contactManager: {
				name: 'contactManager',
				label: 'Manager',
				values: ['1', '2'],
			},
		});
	});

	it('should map conflicts on custom fields too', () => {
		expect(
			mapLivechatContactConflicts(
				{
					...sampleContact,
					conflictingFields: [
						{
							field: 'customFields.fullName',
							value: 'Full Name 1',
						},
						{
							field: 'customFields.fullName',
							value: 'Full Name 2',
						},
					],
				},
				[{ name: 'fullName', type: 'text', label: 'Full Name' }],
			),
		).to.be.deep.equal({
			fullName: {
				name: 'fullName',
				label: 'Full Name',
				values: ['Full Name 1', 'Full Name 2'],
			},
		});
	});
});
