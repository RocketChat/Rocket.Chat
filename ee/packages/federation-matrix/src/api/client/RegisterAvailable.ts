import { Router } from '@rocket.chat/http-router';
import { Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';

const RegisterAvailablePropsSchema = {
	type: 'object',
	properties: {
		username: { type: 'string' },
	},
	required: ['username'],
};

const isRegisterAvailableProps = ajv.compile<{
	username: string;
}>(RegisterAvailablePropsSchema);

const RegisterAvailableResponsePropsSchema = {
	type: 'object',
	properties: {
		results: { type: 'object' },
	},
};

const isRegisterAvailableResponseProps = ajv.compile(RegisterAvailableResponsePropsSchema);

const RegisterAvailableErrorPropsSchema = {
	type: 'object',
	properties: {
		errcode: { type: 'string' },
		error: { type: 'string' },
	},
};

const isRegisterAvailableErrorProps = ajv.compile(RegisterAvailableErrorPropsSchema);

export const clientRoutes = new Router('/client').get(
	'/v3/register/available',
	{
		response: {
			200: isRegisterAvailableResponseProps,
			400: isRegisterAvailableErrorProps,
		},
		query: isRegisterAvailableProps,
	},
	async (c) => {
		const username = c.req.query('username');

		if (typeof username !== 'string' || username === undefined || username.trim() === '') {
			throw new Error('Username is required');
		}

		const available = await Users.findOneByUsername(username);

		if (available) {
			return {
				body: {
					available: false,
				},
				statusCode: 200,
			};
		}
		return {
			body: {
				errcode: 'M_USER_IN_USE',
				error: 'Desired user ID is already taken.',
			},
			statusCode: 400,
		};
	},
);
