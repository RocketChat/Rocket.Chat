import moment from 'moment';

import { MessageTypes, IMessageType } from '../../ui-utils/client';
import { IMessage, isVoipMessage } from '../../../definition/IMessage';

type IMessageFuncReturn = { at: string } | { at: string; time: string } | { comment: string } | { duration: string } | { reason: string };

const messageTypes: IMessageType[] = [
	{
		id: 'voip-call-started',
		system: true,
		message: 'Voip_call_started',
		data(message: IMessage): IMessageFuncReturn {
			if (!isVoipMessage(message)) {
				return { at: '', time: '' };
			}
			const seconds = message.voipData.callWaitingTime || 0;
			return {
				at: message.voipData.callStarted?.toString() || 'unknown date',
				time: moment.duration(seconds, 'seconds').humanize(),
			};
		},
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
		data(message: IMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-unhold',
		system: true,
		message: 'Voip_call_unhold',
		data(message: IMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-ended',
		system: true,
		message: 'Voip_call_ended',
		data(message: IMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
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
