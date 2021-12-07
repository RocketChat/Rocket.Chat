import { MessageTypes } from '../../ui-utils/client';

type IMessageParam = {
	msg: string;
}

type IMessageFuncReturn = {
	comment: string;
};

const messageTypes = [{
	id: 'voip-call-started',
	system: true,
	message: 'Voip_call_started',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}, {
	id: 'voip-call-answered',
	system: true,
	message: 'Voip_call_answered',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}, {
	id: 'voip-call-declined',
	system: true,
	message: 'Voip_call_declined',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}, {
	id: 'voip-call-put-on-hold',
	system: true,
	message: 'Voip_call_on_hold',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}, {
	id: 'voip-call-unhold',
	system: true,
	message: 'Voip_call_unhold',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}, {
	id: 'voip-call-ended',
	system: true,
	message: 'Voip_call_ended',
	data(message: IMessageParam): IMessageFuncReturn {
		return {
			comment: message.msg,
		};
	},
}];

messageTypes.map((e) => MessageTypes.registerType(e));
