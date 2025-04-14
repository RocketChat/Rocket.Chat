import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { validateRequiredCustomFields } from '../../../../../../app/livechat/server/lib/custom-fields';

describe('validateRequiredCustomFields', () => {
	it('should throw an error if the required custom fields are not provided', async () => {
		const customFields = ['customField1'];
		const livechatCustomFields: ILivechatCustomField[] = [
			{ _id: 'customField1', required: true, label: 'Custom Field 1', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
			{ _id: 'customField2', required: true, label: 'Custom Field 2', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
		];

		try {
			validateRequiredCustomFields(customFields, livechatCustomFields);
			throw new Error('Expected error was not thrown');
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).to.equal('Missing required custom fields: customField2');
			} else {
				throw error;
			}
		}
	});

	it('should not throw an error if all required custom fields are provided', async () => {
		const customFields = ['customField1', 'customField2'];
		const livechatCustomFields: ILivechatCustomField[] = [
			{ _id: 'customField1', required: true, label: 'Custom Field 1', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
			{ _id: 'customField2', required: true, label: 'Custom Field 2', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
		];

		validateRequiredCustomFields(customFields, livechatCustomFields);
	});

	it('should not throw an error if no custom fields are required', async () => {
		const customFields = ['customField1'];
		const livechatCustomFields: ILivechatCustomField[] = [
			{ _id: 'customField1', required: false, label: 'Custom Field 1', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
			{ _id: 'customField2', required: false, label: 'Custom Field 2', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
		];

		validateRequiredCustomFields(customFields, livechatCustomFields);
	});

	it('should throw an error if none of the required custom fields are provided', async () => {
		const customFields: string[] = [];
		const livechatCustomFields: ILivechatCustomField[] = [
			{ _id: 'customField1', required: true, label: 'Custom Field 1', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
			{ _id: 'customField2', required: true, label: 'Custom Field 2', scope: 'visitor', visibility: 'public', _updatedAt: new Date() },
		];

		try {
			validateRequiredCustomFields(customFields, livechatCustomFields);
			throw new Error('Expected error was not thrown');
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).to.equal('Missing required custom fields: customField1, customField2');
			} else {
				throw error;
			}
		}
	});
});
