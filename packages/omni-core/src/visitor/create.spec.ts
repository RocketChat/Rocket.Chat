import { UserStatus } from '@rocket.chat/core-typings';
import type { ILivechatContactsModel, ILivechatDepartmentModel, ILivechatVisitorsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { validateEmail } from '@rocket.chat/tools';

import { registerGuest, type RegisterGuestType } from './create';

// Mock the validateEmail function
jest.mock('@rocket.chat/tools', () => ({
	validateEmail: jest.fn(),
}));

// Mock the Logger
jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		debug: jest.fn(),
	})),
}));

const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>;

describe('registerGuest', () => {
	let updateOneByIdOrTokenSpy: jest.Mock;
	let getVisitorByTokenSpy: jest.Mock;
	let findOneVisitorByPhoneSpy: jest.Mock;
	let findOneGuestByEmailAddressSpy: jest.Mock;
	let getNextVisitorUsernameSpy: jest.Mock;
	let findContactByEmailAndContactManagerSpy: jest.Mock;
	let findOneOnlineAgentByIdSpy: jest.Mock;
	let findOneByIdOrNameSpy: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockValidateEmail.mockImplementation(() => true);

		// Create spies that return reasonable defaults
		updateOneByIdOrTokenSpy = jest.fn().mockResolvedValue({ _id: 'visitor-123', token: 'test-token' });
		getVisitorByTokenSpy = jest.fn().mockResolvedValue(null);
		findOneVisitorByPhoneSpy = jest.fn().mockResolvedValue(null);
		findOneGuestByEmailAddressSpy = jest.fn().mockResolvedValue(null);
		getNextVisitorUsernameSpy = jest.fn().mockResolvedValue('guest-123');
		findContactByEmailAndContactManagerSpy = jest.fn().mockResolvedValue(null);
		findOneOnlineAgentByIdSpy = jest.fn().mockResolvedValue(null);
		findOneByIdOrNameSpy = jest.fn().mockResolvedValue(null);

		// Register the models with spy functions
		registerModel('ILivechatVisitorsModel', {
			getVisitorByToken: getVisitorByTokenSpy,
			findOneVisitorByPhone: findOneVisitorByPhoneSpy,
			findOneGuestByEmailAddress: findOneGuestByEmailAddressSpy,
			getNextVisitorUsername: getNextVisitorUsernameSpy,
			updateOneByIdOrToken: updateOneByIdOrTokenSpy,
		} as unknown as ILivechatVisitorsModel);

		registerModel('ILivechatContactsModel', {
			findContactByEmailAndContactManager: findContactByEmailAndContactManagerSpy,
		} as unknown as ILivechatContactsModel);

		registerModel('IUsersModel', {
			findOneOnlineAgentById: findOneOnlineAgentByIdSpy,
		} as unknown as IUsersModel);

		registerModel('ILivechatDepartmentModel', {
			findOneByIdOrName: findOneByIdOrNameSpy,
		} as unknown as ILivechatDepartmentModel);
	});

	describe('validation', () => {
		it('should throw error when token is not provided', async () => {
			const guestData: RegisterGuestType = {
				shouldConsiderIdleAgent: false,
			};

			await expect(registerGuest(guestData)).rejects.toThrow('error-invalid-token');
		});

		it('should throw error when token is empty string', async () => {
			const guestData: RegisterGuestType = {
				token: '',
				shouldConsiderIdleAgent: false,
			};

			await expect(registerGuest(guestData)).rejects.toThrow('error-invalid-token');
		});
	});

	describe('email validation and contact manager assignment', () => {
		it('should validate email and assign contact manager when available', async () => {
			const email = 'test@example.com';
			const token = 'test-token';
			const agentId = 'agent-123';

			const mockAgent = {
				_id: agentId,
				username: 'agent.user',
				name: 'Agent User',
				emails: [{ address: 'agent@example.com' }],
			};

			const mockContact = {
				contactManager: agentId,
			};

			findContactByEmailAndContactManagerSpy.mockResolvedValue(mockContact);
			findOneOnlineAgentByIdSpy.mockResolvedValue(mockAgent);

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(mockValidateEmail).toHaveBeenCalledWith('test@example.com');
			expect(findContactByEmailAndContactManagerSpy).toHaveBeenCalledWith('test@example.com');
			expect(findOneOnlineAgentByIdSpy).toHaveBeenCalledWith(agentId, false, { projection: { _id: 1, username: 1, name: 1, emails: 1 } });

			// Verify the data passed to updateOneByIdOrToken
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status: UserStatus.ONLINE,
					visitorEmails: [{ address: email }],
					contactManager: {
						_id: agentId,
						username: 'agent.user',
						name: 'Agent User',
						emails: [{ address: 'agent@example.com' }],
					},
					username: 'guest-123',
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should not assign contact manager when agent is not found', async () => {
			const email = 'test@example.com';
			const token = 'test-token';

			const mockContact = {
				contactManager: 'agent-123',
			};

			findContactByEmailAndContactManagerSpy.mockResolvedValue(mockContact);
			findOneOnlineAgentByIdSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			// Verify contact manager is not included in the data
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status: UserStatus.ONLINE,
					visitorEmails: [{ address: email }],
					username: 'guest-123',
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);

			// Ensure contactManager is not present
			const callArgs = updateOneByIdOrTokenSpy.mock.calls[0][0];
			expect(callArgs.contactManager).toBeUndefined();
		});

		it('should trim and lowercase email', async () => {
			const email = '  TEST@EXAMPLE.COM  ';
			const token = 'test-token';

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(mockValidateEmail).toHaveBeenCalledWith('test@example.com');
			expect(findContactByEmailAndContactManagerSpy).toHaveBeenCalledWith('test@example.com');

			// Verify the trimmed and lowercase email is passed to updateOneByIdOrToken
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					visitorEmails: [{ address: 'test@example.com' }],
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});

	describe('department validation and assignment', () => {
		it('should assign valid department', async () => {
			const token = 'test-token';
			const department = 'sales';
			const departmentId = 'dept-123';

			const mockDepartment = {
				_id: departmentId,
			};

			findOneByIdOrNameSpy.mockResolvedValue(mockDepartment);

			const guestData: RegisterGuestType = {
				token,
				department,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(findOneByIdOrNameSpy).toHaveBeenCalledWith(department, { projection: { _id: 1 } });

			// Verify the department ID is passed to updateOneByIdOrToken
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status: UserStatus.ONLINE,
					department: departmentId,
					username: 'guest-123',
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should throw error for invalid department', async () => {
			const token = 'test-token';
			const department = 'invalid-dept';

			findOneByIdOrNameSpy.mockResolvedValue(null);
			getVisitorByTokenSpy.mockResolvedValue({ department: 'different-dept' });

			const guestData: RegisterGuestType = {
				token,
				department,
				shouldConsiderIdleAgent: false,
			};

			await expect(registerGuest(guestData)).rejects.toThrow('error-invalid-department');

			// Verify updateOneByIdOrToken is not called when department validation fails
			expect(updateOneByIdOrTokenSpy).not.toHaveBeenCalled();
		});

		it('should not validate department if visitor already has the same department', async () => {
			const token = 'test-token';
			const department = 'sales';

			getVisitorByTokenSpy.mockResolvedValue({
				_id: 'visitor-123',
				department,
				token,
			});

			const guestData: RegisterGuestType = {
				token,
				department,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			// Department validation should be skipped
			expect(findOneByIdOrNameSpy).not.toHaveBeenCalled();

			// Verify existing visitor is updated without department validation
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					_id: 'visitor-123',
					token,
					status: UserStatus.ONLINE,
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});

	describe('visitor matching and creation', () => {
		it('should update existing visitor found by token', async () => {
			const token = 'test-token';
			const existingVisitor = {
				_id: 'visitor-123',
				token,
			};

			getVisitorByTokenSpy.mockResolvedValue(existingVisitor);

			const guestData: RegisterGuestType = {
				token,
				name: 'Updated Name',
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(getVisitorByTokenSpy).toHaveBeenCalledWith(token, { projection: { _id: 1 } });

			// Verify existing visitor data is used and updated
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					_id: 'visitor-123',
					token,
					status: UserStatus.ONLINE,
					name: 'Updated Name',
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should match visitor by phone number and preserve existing token', async () => {
			const token = 'new-token';
			const existingToken = 'existing-token';
			const phoneNumber = '+1234567890';
			const existingVisitor = {
				_id: 'visitor-123',
				token: existingToken,
			};

			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(existingVisitor);

			const guestData: RegisterGuestType = {
				token,
				phone: { number: phoneNumber },
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(findOneVisitorByPhoneSpy).toHaveBeenCalledWith(phoneNumber);

			// Verify existing visitor's token is preserved, not the new one
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					_id: 'visitor-123',
					token: existingToken, // Should use existing token, not new one
					status: UserStatus.ONLINE,
					phone: [{ phoneNumber }],
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should match visitor by email', async () => {
			const token = 'test-token';
			const email = 'test@example.com';
			const existingVisitor = {
				_id: 'visitor-123',
				token: 'existing-token',
			};

			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(existingVisitor);

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(findOneGuestByEmailAddressSpy).toHaveBeenCalledWith(email);

			// Verify existing visitor data is used
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					_id: 'visitor-123',
					token,
					status: UserStatus.ONLINE,
					visitorEmails: [{ address: email }],
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should create new visitor when no matches found', async () => {
			const token = 'test-token';
			const username = 'custom-username';
			const id = 'custom-id';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				id,
				token,
				username,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			// Verify new visitor data is created with provided values
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					_id: id,
					token,
					username,
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should generate username when not provided for new visitor', async () => {
			const token = 'test-token';
			const generatedUsername = 'guest-123';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(getNextVisitorUsernameSpy).toHaveBeenCalled();

			// Verify generated username is used
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					username: generatedUsername,
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should use provided username for new visitor', async () => {
			const token = 'test-token';
			const providedUsername = 'custom-username';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				username: providedUsername,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(getNextVisitorUsernameSpy).not.toHaveBeenCalled();

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					username: providedUsername,
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});

	describe('data formatting', () => {
		it('should format phone number correctly', async () => {
			const token = 'test-token';
			const phoneNumber = '+1234567890';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				phone: { number: phoneNumber },
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					phone: [{ phoneNumber }],
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should format email correctly', async () => {
			const token = 'test-token';
			const email = 'test@example.com';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);
			findContactByEmailAndContactManagerSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					visitorEmails: [{ address: email }],
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should use default status when not provided', async () => {
			const token = 'test-token';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should use custom status when provided', async () => {
			const token = 'test-token';
			const status = UserStatus.AWAY;

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				status,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});

	describe('connection data handling', () => {
		it('should save connection data for new visitor', async () => {
			const token = 'test-token';
			const connectionData = {
				httpHeaders: {
					'user-agent': 'Mozilla/5.0',
					'x-real-ip': '192.168.1.1',
					'host': 'example.com',
				},
				clientAddress: '10.0.0.1',
			};

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				connectionData,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					userAgent: 'Mozilla/5.0',
					ip: '192.168.1.1',
					host: 'example.com',
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should use x-forwarded-for header when x-real-ip is not available', async () => {
			const token = 'test-token';
			const connectionData = {
				httpHeaders: {
					'x-forwarded-for': '203.0.113.1',
				},
				clientAddress: '10.0.0.1',
			};

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				connectionData,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					ip: '203.0.113.1',
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should use clientAddress when no IP headers are available', async () => {
			const token = 'test-token';
			const connectionData = {
				httpHeaders: {},
				clientAddress: '10.0.0.1',
			};

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				connectionData,
				shouldConsiderIdleAgent: false,
			};

			await registerGuest(guestData);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					ip: '10.0.0.1',
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});

	describe('error scenarios', () => {
		it('should return null when upsert fails', async () => {
			const token = 'test-token';

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);

			// Mock upsert to return null (failure case)
			updateOneByIdOrTokenSpy.mockResolvedValue(null);

			const guestData: RegisterGuestType = {
				token,
				shouldConsiderIdleAgent: false,
			};

			const result = await registerGuest(guestData);

			expect(result).toBeNull();
			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});

		it('should throw error when email validation fails', async () => {
			const token = 'test-token';
			const email = 'invalid-email';

			mockValidateEmail.mockImplementation(() => {
				throw new Error('Invalid email');
			});

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: false,
			};

			await expect(registerGuest(guestData)).rejects.toThrow('Invalid email');
		});
	});

	describe('shouldConsiderIdleAgent parameter', () => {
		it('should pass shouldConsiderIdleAgent to findOneOnlineAgentById', async () => {
			const token = 'test-token';
			const email = 'test@example.com';
			const agentId = 'agent-123';

			const mockAgent = {
				_id: agentId,
				username: 'agent.user',
				name: 'Agent User',
				emails: [{ address: 'agent@example.com' }],
			};

			const mockContact = {
				contactManager: agentId,
			};

			// All lookup methods return null (no matches)
			getVisitorByTokenSpy.mockResolvedValue(null);
			findOneVisitorByPhoneSpy.mockResolvedValue(null);
			findOneGuestByEmailAddressSpy.mockResolvedValue(null);
			findContactByEmailAndContactManagerSpy.mockResolvedValue(mockContact);
			findOneOnlineAgentByIdSpy.mockResolvedValue(mockAgent);

			const guestData: RegisterGuestType = {
				token,
				email,
				shouldConsiderIdleAgent: true,
			};

			await registerGuest(guestData);

			expect(findOneOnlineAgentByIdSpy).toHaveBeenCalledWith(
				agentId,
				true, // shouldConsiderIdleAgent should be true
				{ projection: { _id: 1, username: 1, name: 1, emails: 1 } },
			);

			expect(updateOneByIdOrTokenSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					token,
					visitorEmails: [{ address: email }],
					contactManager: expect.objectContaining({
						username: 'agent.user',
					}),
					status: UserStatus.ONLINE,
					ts: expect.any(Date),
				}),
				{ upsert: true, returnDocument: 'after' },
			);
		});
	});
});
