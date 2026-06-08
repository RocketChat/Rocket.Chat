// Single point of access to the DDP wire codec. Today it forwards to Meteor's
// `ddp-common` package; the eventual replacement will be a standalone EJSON
// helper. Consumers MUST import parseDDP / stringifyDDP from here so the codec
// stays swappable.

import { DDPCommon } from 'meteor/ddp-common';

export const { parseDDP, stringifyDDP } = DDPCommon;

export type DDPMessage = Parameters<typeof stringifyDDP>[0];
