import { Audit } from './audit';

const mockCreateAuditServerEvent = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	ServerEvents: {
		createAuditServerEvent: (...args: any[]) => mockCreateAuditServerEvent(...args),
	},
}));

describe('Audit.attributeStoreSwitched', () => {
	beforeEach(() => {
		mockCreateAuditServerEvent.mockReset();
	});

	it('calls createAuditServerEvent with the correct event key, payload, and system actor', async () => {
		await Audit.attributeStoreSwitched('local', 'virtru', 3);

		expect(mockCreateAuditServerEvent).toHaveBeenCalledTimes(1);
		expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
			'abac.attribute.store.switched',
			{ from: 'local', to: 'virtru', reason: 'attribute-store-switch', roomsAffected: 3 },
			{ type: 'system' },
		);
	});
});
