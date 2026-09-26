import { Inject } from '@nestjs/common';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';

export const models = { Messages, Rooms, Subscriptions, Users };

export type Models = typeof models;
export type ModelName = keyof Models;

export const getModelToken = (name: ModelName): string =>
  `RocketChatModel<${name}>`;

export const InjectModel = (name: ModelName) => Inject(getModelToken(name));
