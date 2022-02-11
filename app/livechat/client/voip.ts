import moment from 'moment';

import { MessageTypes } from '../../ui-utils/client';
import { IVoipMessage } from '../../../definition/IMessage';

type IMessageFuncReturn = {
	at?: string;
	duration?: string;
};

const messageTypes = [
	{
		id: 'voip-call-started',
		system: true,
		message: 'Voip_call_started',
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.voipData?.callStarted?.toString(),
			};
		},
	},
	{
		id: 'voip-call-duration',
		system: true,
		message: 'Voip_call_duration',
		data(message: IVoipMessage): IMessageFuncReturn {
			const seconds = (message?.voipData?.callDuration || 0) / 1000;
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
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-unhold',
		system: true,
		message: 'Voip_call_unhold',
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
	{
		id: 'voip-call-ended',
		system: true,
		message: 'Voip_call_ended',
		data(message: IVoipMessage): IMessageFuncReturn {
			return {
				at: message.ts.toString(),
			};
		},
	},
];

messageTypes.map((e) => MessageTypes.registerType(e));
