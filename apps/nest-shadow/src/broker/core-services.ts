import { Inject } from '@nestjs/common';
import {
  Authorization,
  Message,
  Room,
  Settings,
  Team,
} from '@rocket.chat/core-services';
import { failClosedClient } from './fail-closed.js';

// The service seams the shadow calls, and nothing else of each service.
export const coreServices = {
  Authorization: failClosedClient(Authorization, 'Authorization', [
    'canAccessRoom',
    'canAccessRoomId',
    'canReadRoom',
    'hasPermission',
  ]),
  Message: failClosedClient(Message, 'Message', [
    'deleteMessage',
    'reactToMessage',
    'sendMessageWithValidation',
    'updateMessage',
  ]),
  Room: failClosedClient(Room, 'Room', ['markAsRead']),
  Settings: failClosedClient(Settings, 'Settings', ['get']),
  Team: failClosedClient(Team, 'Team', ['getRoomInfo']),
};

export type CoreServices = typeof coreServices;
export type CoreServiceName = keyof CoreServices;

export const getCoreServiceToken = (name: CoreServiceName): string =>
  `RocketChatService<${name}>`;

export const InjectCoreService = (name: CoreServiceName) =>
  Inject(getCoreServiceToken(name));
