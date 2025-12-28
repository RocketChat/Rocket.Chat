import { type ILivechatVisitor, UserStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatContacts, LivechatDepartment, LivechatVisitors, Users } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';
import { validateEmail } from '@rocket.chat/tools';

const logger = new Logger('Livechat - Visitor');

type RegisterGuestType = Partial<Pick<ILivechatVisitor, 'token' | 'name' | 'department' | 'status' | 'username'>> & {
	id?: string;
	connectionData?: any;
	email?: string;
	phone?: { number: string };
};

export const registerGuest = makeFunction(
	async (
		{ id, token, name, phone, email, department, username, connectionData, status = UserStatus.ONLINE }: RegisterGuestType,
		{ shouldConsiderIdleAgent }: { shouldConsiderIdleAgent: boolean },
	): Promise<ILivechatVisitor | null> => {
		if (!token) {
			throw Error('error-invalid-token');
		}

		logger.debug(`New incoming conversation: id: ${id} | token: ${token}`);

		const visitorDataToUpdate: Partial<ILivechatVisitor> & { userAgent?: string; ip?: string; host?: string } = {
			token,
			status,
			...(phone?.number && { phone: [{ phoneNumber: phone.number }] }),
			...(name && { name }),
		};

		if (email) {
			const visitorEmail = email.trim().toLowerCase();
			validateEmail(visitorEmail);
			visitorDataToUpdate.visitorEmails = [{ address: visitorEmail }];

			const contact = await LivechatContacts.findContactByEmailAndContactManager(visitorEmail);
			if (contact?.contactManager) {
				const agent = await Users.findOneOnlineAgentById(contact.contactManager, shouldConsiderIdleAgent, {
					projection: { _id: 1, username: 1, name: 1, emails: 1 },
				});
				if (agent?.username && agent.name && agent.emails) {
					visitorDataToUpdate.contactManager = {
						_id: agent._id,
						username: agent.username,
						name: agent.name,
						emails: agent.emails,
					};
					logger.debug(`Assigning visitor ${token} to agent ${agent.username}`);
				}
			}
		}

		const livechatVisitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (department && livechatVisitor?.department !== department) {
			logger.debug(`Attempt to find a department with id/name ${department}`);
			const dep = await LivechatDepartment.findOneByIdOrName(department, { projection: { _id: 1 } });
			if (!dep) {
				logger.debug(`Invalid department provided: ${department}`);
				// throw new Meteor.Error('error-invalid-department', 'The provided department is invalid');
				throw new Error('error-invalid-department');
			}
			logger.debug(`Assigning visitor ${token} to department ${dep._id}`);
			visitorDataToUpdate.department = dep._id;
		}

		visitorDataToUpdate.token = livechatVisitor?.token || token;

		let existingUser = null;

		if (livechatVisitor) {
			logger.debug('Found matching user by token');
			visitorDataToUpdate._id = livechatVisitor._id;
		} else if (phone?.number && (existingUser = await LivechatVisitors.findOneVisitorByPhone(phone.number))) {
			logger.debug('Found matching user by phone number');
			visitorDataToUpdate._id = existingUser._id;
			// Don't change token when matching by phone number, use current visitor token
			visitorDataToUpdate.token = existingUser.token;
		} else if (email && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(email))) {
			logger.debug('Found matching user by email');
			visitorDataToUpdate._id = existingUser._id;
		} else if (!livechatVisitor) {
			logger.debug(`No matches found. Attempting to create new user with token ${token}`);

			visitorDataToUpdate._id = id || undefined;
			visitorDataToUpdate.username = username || (await LivechatVisitors.getNextVisitorUsername());
			visitorDataToUpdate.status = status;
			visitorDataToUpdate.ts = new Date();

			if (connectionData && typeof connectionData === 'object') {
				logger.debug(`Saving connection data for visitor ${token}`);
				const { httpHeaders, clientAddress } = connectionData;
				if (httpHeaders && typeof httpHeaders === 'object') {
					visitorDataToUpdate.userAgent = httpHeaders['user-agent'];
					visitorDataToUpdate.ip = httpHeaders['x-real-ip'] || httpHeaders['x-forwarded-for'] || clientAddress;
					visitorDataToUpdate.host = httpHeaders.host;
				}
			}
		}

		const upsertedLivechatVisitor = await LivechatVisitors.updateOneByIdOrToken(visitorDataToUpdate, {
			upsert: true,
			returnDocument: 'after',
		});

		if (!upsertedLivechatVisitor) {
			logger.debug(`No visitor found after upsert`);
			return null;
		}

		return upsertedLivechatVisitor;
	},
);
