import { FlowRouter } from 'meteor/kadira:flow-router';

export const isLayoutEmbedded = (): boolean => FlowRouter.getQueryParam('layout') === 'embedded';
