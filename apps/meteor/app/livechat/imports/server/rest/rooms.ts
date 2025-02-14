import { LivechatRooms } from '@rocket.chat/models';
import { isGETLivechatRoomsParams } from '@rocket.chat/rest-typings';
import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { findRooms } from '../../../server/api/lib/rooms';

const validateDateParams = (property: string, date?: string) => {
  let parsedDate: { start?: string; end?: string } | undefined = undefined;
  if (date) {
    parsedDate = JSON.parse(date) as { start?: string; end?: string };
  }
  if (parsedDate?.start && isNaN(Date.parse(parsedDate.start))) {
    throw new Error(`The "${property}.start" query parameter must be a valid date.`);
  }
  if (parsedDate?.end && isNaN(Date.parse(parsedDate.end))) {
    throw new Error(`The "${property}.end" query parameter must be a valid date.`);
  }
  return parsedDate;
};

const isBoolean = (value?: string | boolean): boolean =>
  value === 'true' || value === 'false' || typeof value === 'boolean';

function selectFields(room: any, fields: any): any {
  if (fields.roomName) {
    return { roomName: room.fname };
  }
  return { ...room, roomName: room.fname };
}


function parseCustomFields(customFields?: string): { [key: string]: string } | undefined {
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

API.v1.addRoute(
  'livechat/rooms',
  { authRequired: true, validateParams: isGETLivechatRoomsParams },
  {
    async get() {
      const { offset, count } = await getPaginationItems(this.queryParams);
      const { sort, fields } = await this.parseJsonQuery();
      const { agents, departmentId, open, tags, roomName, onhold, queued } = this.queryParams;
      const { createdAt, customFields, closedAt } = this.queryParams;

      const createdAtParam = validateDateParams('createdAt', createdAt);
      const closedAtParam = validateDateParams('closedAt', closedAt);

      const hasAdminAccess = await hasPermissionAsync(this.userId, 'view-livechat-rooms');
      const hasAgentAccess =
        (await hasPermissionAsync(this.userId, 'view-l-room')) &&
        agents?.includes(this.userId) &&
        agents?.length === 1;
      if (!hasAdminAccess && !hasAgentAccess) {
        return API.v1.forbidden();
      }

      let parsedCf: { [key: string]: string } | undefined = undefined;
      if (customFields) {
        try {
          parsedCf = parseCustomFields(customFields);
        } catch (e) {
          throw new Error(e.message);
        }
      }

      return API.v1.success(
        await findRooms({
          agents,
          roomName,
          departmentId,
          ...(isBoolean(open) && { open: open === 'true' }),
          createdAt: createdAtParam,
          closedAt: closedAtParam,
          tags,
          customFields: parsedCf,
          onhold,
          queued,
          options: { offset, count, sort, fields },
        }),
      );
    },
  },
);

API.v1.addRoute(
  'livechat/rooms/filters',
  { authRequired: true, permissionsRequired: ['view-l-room'] },
  {
    async get() {
      return API.v1.success({
        filters: (await LivechatRooms.findAvailableSources().toArray())[0].fullTypes,
      });
    },
  },
);
