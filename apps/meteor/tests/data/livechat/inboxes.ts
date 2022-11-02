import { getCredentials, api, request, credentials } from '../api-data';

export const createEmailInbox = async (): Promise<{ _id: string }> => {
    await getCredentials()
    const { body } = await request
				.post(api('email-inbox'))
				.set(credentials)
				.send({
					name: 'test',
					active: false,
					email: `test${new Date().getTime()}@test.com`,
					description: 'test',
					senderInfo: 'test',
					department: 'test',
					smtp: {
						server: 'smtp.example.com',
						port: 587,
						username: 'xxxx',
						password: 'xxxx',
						secure: true,
					},
					imap: {
						server: 'imap.example.com',
						port: 993,
						username: 'xxxx',
						password: 'xxxx',
						secure: true,
						maxRetries: 10,
					},
				});
    return body;
}
