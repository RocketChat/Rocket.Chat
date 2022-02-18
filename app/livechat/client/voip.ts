import moment from 'moment';

import { MessageTypes } from '../../ui-utils/client';
import { IVoipMessage } from '../../../definition/IMessage';

type IMessageFuncReturn = { at: string } | { at: string; time: string } | { comment: string } | { duration: string };

const messageTypes = [
	{
		id: 'voip-call-started' as const,
		system: true,
		message: 'Voip_call_started' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			const seconds = message?.voipData?.callWaitingTime || 0;
			return {
				at: message.voipData?.callStarted?.toString() || 'unknown date',
				time: moment.duration(seconds, 'seconds').humanize(),
			};
		},
	},
	{
		id: 'voip-call-duration' as const,
		system: true,
		message: 'Voip_call_duration' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			const seconds = (message?.voipData?.callDuration || 0) / 1000;
			const duration = moment.duration(seconds, 'seconds').humanize();
			return {
				duration,
			};
		},
	},
	{
		id: 'voip-call-declined' as const,
		system: true,
		message: 'Voip_call_declined' as const,
	},
	{
		id: 'voip-call-on-hold' as const,
		system: true,
		message: 'Voip_call_on_hold' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-unhold' as const,
		system: true,
		message: 'Voip_call_unhold' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-ended' as const,
		system: true,
		message: 'Voip_call_ended' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-wrapup' as const,
		system: true,
		message: 'Voip_call_wrapup' as const,
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				comment: message.msg,
			};
		},
	},
];

messageTypes.map((e) => MessageTypes.registerType(e));
