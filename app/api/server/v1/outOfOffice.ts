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

      const updated = enableOutOffice({
        userId: this.userId,
        roomIds,
        customMessage,
        startDate,
        endDate,
      });

      return API.v1.success(updated);
    },
  }
);

API.v1.addRoute(
  "outOfOffice.disable",
  { authRequired: true },
  {
    post() {
      const updated = disableOutOfOffice({ userId: this.userId });

      return API.v1.success(updated);
    },
  }
);

API.v1.addRoute(
  "outOfOffice.getByUser",
  { authRequired: true },
  {
    // doubt - should we change this to a function?
    get() {
      const foundDocument = OutOfOffice.findOneByUserId(this.userId, {
        isEnabled: 1,
        roomIds: 1,
        customMessage: 1,
      });
      return API.v1.success(foundDocument);
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
