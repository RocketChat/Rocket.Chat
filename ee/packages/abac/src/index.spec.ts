import { AbacService } from './index';

const mockFindOneByIdAndType = jest.fn();
const mockUpdateAbacConfigurationById = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
	},
}));

// Minimal mock for ServiceClass (we don't need its real behavior in unit scope)
jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
}));

describe('AbacService (unit)', () => {
	let service: AbacService;

	beforeEach(() => {
		service = new AbacService();
		jest.clearAllMocks();
	});

	describe('toggleAbacConfigurationForRoom', () => {
		it('enables ABAC when room.abac is undefined', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room1',
				t: 'p',
				abac: undefined,
			});

			await service.toggleAbacConfigurationForRoom('room1');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room1', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room1', true);
		});

		it('enables ABAC when room.abac is false', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room2',
				t: 'p',
				abac: false,
			});

			await service.toggleAbacConfigurationForRoom('room2');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room2', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room2', true);
		});

		it('disables ABAC when room.abac is true', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room3',
				t: 'p',
				abac: true,
			});

			await service.toggleAbacConfigurationForRoom('room3');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room3', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room3', false);
		});

		it('throws error-invalid-room when room is not found', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);

			await expect(service.toggleAbacConfigurationForRoom('missing')).rejects.toThrow('error-invalid-room');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('missing', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).not.toHaveBeenCalled();
		});

		it('propagates underlying model errors', async () => {
			const err = new Error('database-failure');
			mockFindOneByIdAndType.mockRejectedValueOnce(err);

			await expect(service.toggleAbacConfigurationForRoom('roomX')).rejects.toThrow('database-failure');
			expect(mockUpdateAbacConfigurationById).not.toHaveBeenCalled();
		});
	});
});
