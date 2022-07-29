import moment from 'moment';
import { IMessage, isVoipMessage } from '@rocket.chat/core-typings';

import { MessageTypes, MessageType } from '../../ui-utils/client';

type IMessageFuncReturn = { comment: string } | { duration: string } | { reason: string };

const messageTypes: MessageType[] = [
	{
		id: 'voip-call-started',
		system: true,
		message: 'Voip_call_started',
	},
	{
		id: 'voip-call-duration',
		system: true,
		message: 'Voip_call_duration',
		data(message: IMessage): IMessageFuncReturn {
			if (!isVoipMessage(message)) {
				return { duration: '' };
			}
			const seconds = (message.voipData.callDuration || 0) / 1000;
			const duration = moment.duration(seconds, 'seconds').humanize();
			return {
				duration,
			};
		},
	},
	{
		id: 'voip-call-declined',
		system: true,
		message: 'Voip_call_declined',
	},
	{
		id: 'voip-call-on-hold',
		system: true,
		message: 'Voip_call_on_hold',
	},
	{
		id: 'voip-call-unhold',
		system: true,
		message: 'Voip_call_unhold',
	},
	{
		id: 'voip-call-ended',
		system: true,
		message: 'Voip_call_ended',
	},
	{
		id: 'voip-call-ended-unexpectedly',
		system: true,
		message: 'Voip_call_ended_unexpectedly',
		data(message: IMessage): IMessageFuncReturn {
			return {
				reason: message.msg,
			};
		},
	},
	{
		id: 'voip-call-wrapup',
		system: true,
		message: 'Voip_call_wrapup',
		data(message: IMessage): IMessageFuncReturn {
			return {
				comment: message.msg,
			};
		},
	},
];

messageTypes.map((e) => MessageTypes.registerType(e));
