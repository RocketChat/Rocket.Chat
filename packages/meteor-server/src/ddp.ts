import { currentMethodInvocation, currentPublicationInvocation } from './meteor.ts';

export const DDP = {
	_CurrentMethodInvocation: currentMethodInvocation,
	_CurrentPublicationInvocation: currentPublicationInvocation,
	/** Legacy alias kept by Meteor for _CurrentMethodInvocation */
	_CurrentInvocation: currentMethodInvocation,
};
