import { Random } from '@rocket.chat/random';

export const chooseElement = Random.choice;

export const createRandomString = Random._randomString;

export const createRandomId = Random.id;

export const createToken = () => Random.hexString(64);
