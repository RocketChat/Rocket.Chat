import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";

import { API } from "../api";
import {
  disableOutOfOffice,
  enableOutOffice,
} from "../../../outOfOffice/server/index";
import { OutOfOffice } from "../../../models/server";

API.v1.addRoute(
  "outOfOffice.enable",
  { authRequired: true },
  {
    post() {
      check(
        this.bodyParams,
        Match.ObjectIncluding({
          roomIds: Array,
          customMessage: String,
          startDate: Match.Optional(String),
          endDate: Match.Optional(String),
        })
      );

      const { roomIds, customMessage, startDate, endDate } = this.bodyParams;

      if (customMessage.length === 0) {
        throw new Meteor.Error(
          "error-invalid-params",
          "The custom message is mandatory"
        );
      }

      const rec = enableOutOffice({
        userId: this.userId,
        roomIds,
        customMessage,
        startDate,
        endDate,
      });

      return API.v1.success({ hasHappened: rec });
    },
  }
);

API.v1.addRoute(
  "outOfOffice.disable",
  { authRequired: true },
  {
    post() {
      const rec = disableOutOfOffice({ userId: this.userId });

      return API.v1.success(rec);
    },
  }
);

// temporary - only for debugging purposes

API.v1.addRoute("outOfOffice.getAll", {
  get() {
    const allDocuments = OutOfOffice.find({}).fetch();

    return API.v1.success({
      "all-docs": allDocuments,
    });
  },
});

API.v1.addRoute("outOfOffice.getById", {
  get() {
    const docId = this.bodyParams.docId;
    if (!docId) {
      return API.v1.failure("doc id not provided");
    }
    const doc = OutOfOffice.findOneById(docId);

    return API.v1.success({ "the-found": doc });
  },
});

API.v1.addRoute("outOfOffice.getByUser", {
  get() {
    const userId = this.userId;
    const doc = OutOfOffice.findOneByUserId(userId);
    return API.v1.success({ "by-user": doc });
  },
});
