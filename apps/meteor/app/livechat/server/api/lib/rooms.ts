import type { ILivechatDepartment, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatDepartment } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { callbacks } from '../../../../../lib/callbacks';

function selectFields(room: IOmnichannelRoom, fields: any): any {
  if (fields.roomName) {
    return { roomName: room.fname };
  }
  return { ...room, roomName: room.fname };
}

export async function findRooms(filters: any): Promise<any[]> {
  const query: any = {};
  if (filters.roomName) {
    query.fname = filters.roomName;
  }
  const rooms = await LivechatRooms.find(query).toArray();
  if (filters.options && filters.options.fields) {
    return rooms.map(room => selectFields(room, filters.options.fields));
  }
  return rooms.map(room => ({ ...room, roomName: room.fname }));
}

export function parseCustomFields(customFields?: string): { [key: string]: string } | undefined {
  if (!customFields) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(customFields);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      throw new Error('Invalid custom fields');
    }
    return parsed;
  } catch (e) {
    throw new Error('The "customFields" query parameter must be a valid JSON.');
  }
}

let parsedCf: { [key: string]: string } | undefined = undefined;
if (customFields) {
  try {
    parsedCf = parseCustomFields(customFields);
  } catch (e) {
    throw new Error(e.message);
  }
}
