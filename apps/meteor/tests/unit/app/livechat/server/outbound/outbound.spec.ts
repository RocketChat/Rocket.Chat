import { OutboundMessageProviderService } from '../../../../../../ee/app/livechat-enterprise/server/api/lib/outbound';

jest.mock('./outbound', () => {
	return {
		OutboundMessageProvider: jest.fn().mockImplementation(() => {
			return {
				getOutboundMessageProviders: jest.fn((type?: string) => {
					if (type === 'phone') {
						return [{ appId: '1', name: 'PhoneProvider', type: 'phone' }];
					}
					if (type === 'email') {
						return [{ appId: '2', name: 'EmailProvider', type: 'email' }];
					}
					return [
						{ appId: '1', name: 'PhoneProvider', type: 'phone' },
						{ appId: '2', name: 'EmailProvider', type: 'email' },
					];
				}),
			};
		}),
	};
});

describe('OutboundMessageProviderService', () => {
	let service: OutboundMessageProviderService;

	beforeEach(() => {
		service = new OutboundMessageProviderService();
	});

	it('should return all providers when type is not specified', () => {
		const result = service.listOutboundProviders();
		expect(result).toEqual([
			{ providerId: '1', providerName: 'PhoneProvider', supportsTemplates: true, providerType: 'phone' },
			{ providerId: '2', providerName: 'EmailProvider', supportsTemplates: true, providerType: 'email' },
		]);
	});

	it('should return phone providers when type is "phone"', () => {
		const result = service.listOutboundProviders('phone');
		expect(result).toEqual([{ providerId: '1', providerName: 'PhoneProvider', supportsTemplates: true, providerType: 'phone' }]);
	});

	it('should return email providers when type is "email"', () => {
		const result = service.listOutboundProviders('email');
		expect(result).toEqual([{ providerId: '2', providerName: 'EmailProvider', supportsTemplates: true, providerType: 'email' }]);
	});

	it('should throw an error when type is invalid', () => {
		expect(() => service.listOutboundProviders('invalid')).toThrow('Invalid type');
	});
});
