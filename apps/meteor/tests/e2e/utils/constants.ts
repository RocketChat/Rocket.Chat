export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export const IS_LOCALHOST = BASE_URL.startsWith('http://localhost');

export const IS_EE = Boolean(process.env.IS_EE);

export const URL_MONGODB = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor?retryWrites=false';
