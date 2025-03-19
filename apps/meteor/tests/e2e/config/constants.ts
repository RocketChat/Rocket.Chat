export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export const API_PREFIX = '/api/v1';

export const BASE_API_URL = BASE_URL + API_PREFIX;

export const IS_LOCALHOST = BASE_URL.startsWith('http://localhost');

export const IS_EE = process.env.IS_EE ? !!JSON.parse(process.env.IS_EE) : false;

export const URL_MONGODB = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor?retryWrites=false';

export const ADMIN_CREDENTIALS = {
	email: 'rocketchat.internal.admin.test@rocket.chat',
	password: 'rocketchat.internal.admin.test',
	username: 'rocketchat.internal.admin.test',
} as const;

export const DEFAULT_USER_CREDENTIALS = {
	password: 'password',
	bcrypt: '$2b$10$LNYaqDreDE7tt9EVEeaS9uw.C3hic9hcqFfIocMBPTMxJaDCC6QWW',
} as const;
