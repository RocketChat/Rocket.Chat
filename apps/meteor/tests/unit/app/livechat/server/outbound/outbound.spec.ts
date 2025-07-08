import { OutboundMessageProviderService } from '../../../../../../ee/app/livechat-enterprise/server/api/lib/outbound';



describe('OutboundMessageProviderService', () => {
	let service: OutboundMessageProviderService;

	beforeAll(() => {
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
