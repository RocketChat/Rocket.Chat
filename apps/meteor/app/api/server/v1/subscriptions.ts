import { Subscriptions } from '@rocket.chat/models';
import {
  isSubscriptionsGetProps,
  isSubscriptionsReadProps,
  isSubscriptionsUnreadProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { readMessages } from '../../../../server/lib/readMessages';
import { API } from '../api';

// Define the subscriptions.get route
API.v1.addRoute(
  'subscriptions.get',
  {
    authRequired: true,
    validateParams: isSubscriptionsGetProps,
  },
  {
    async get() {
      const { updatedSince } = this.queryParams;

      let updatedSinceDate: Date | undefined;
      if (updatedSince) {
        if (isNaN(Date.parse(updatedSince as string))) {
          throw new Meteor.Error(
            'error-roomId-param-invalid',
            'The "lastUpdate" query parameter must be a valid date.'
          );
        }
        updatedSinceDate = new Date(updatedSince as string);
      }

      const result = await Meteor.callAsync('subscriptions/get', updatedSinceDate);

      return API.v1.success(
        Array.isArray(result)
          ? {
              update: result,
              remove: [],
            }
          : result
      );
    },
  }
);

// Define the subscriptions.read route
API.v1.addRoute(
  'subscriptions.read',
  {
    authRequired: true,
    validateParams: isSubscriptionsReadProps,
  },
  {
    async post() {
      const { readThreads = false } = this.bodyParams;
      const roomId = 'rid' in this.bodyParams ? this.bodyParams.rid : this.bodyParams.roomId;
      await readMessages(roomId, this.userId, readThreads);

      return API.v1.success();
    },
  }
);

// Define the subscriptions.unread route
API.v1.addRoute(
  'subscriptions.unread',
  {
    authRequired: true,
    validateParams: isSubscriptionsUnreadProps,
  },
  {
    async post() {
      await Meteor.callAsync('unreadMessages', (this.bodyParams as any).firstUnreadMessage, (this.bodyParams as any).roomId);

      return API.v1.success();
    },
  }
);

