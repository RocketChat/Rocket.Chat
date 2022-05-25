import type { CloudRegistrationIntentData, CloudConfirmationPollData, CloudRegistrationStatus } from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

type CloudManualRegister = {
	cloudBlob: string;
};

const CloudManualRegisterSchema: JSONSchemaType<CloudManualRegister> = {
	type: 'object',
	properties: {
		cloudBlob: {
			type: 'string',
		},
	},
	required: ['cloudBlob'],
	additionalProperties: false,
};

export const isCloudManualRegisterProps = ajv.compile(CloudManualRegisterSchema);

type CloudCreateRegistrationIntent = {
	resend: boolean;
	email: string;
};

const CloudCreateRegistrationIntentSchema: JSONSchemaType<CloudCreateRegistrationIntent> = {
	type: 'object',
	properties: {
		resend: {
			type: 'boolean',
		},
		email: {
			type: 'string',
		},
	},
	required: ['resend', 'email'],
	additionalProperties: false,
};

export const isCloudCreateRegistrationIntentProps = ajv.compile(CloudCreateRegistrationIntentSchema);

type CloudConfirmationPoll = {
	deviceCode: string;
	resend?: string;
};

const CloudConfirmationPollSchema: JSONSchemaType<CloudConfirmationPoll> = {
	type: 'object',
	properties: {
		deviceCode: {
			type: 'string',
		},
		resend: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['deviceCode'],
	additionalProperties: false,
};

export const isCloudConfirmationPollProps = ajv.compile(CloudConfirmationPollSchema);

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: CloudManualRegister) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: CloudCreateRegistrationIntent) => {
			intentData: CloudRegistrationIntentData;
		};
	};
	'cloud.confirmationPoll': {
		GET: (params: CloudConfirmationPoll) => {
			pollData: CloudConfirmationPollData;
		};
	};
	'cloud.registrationStatus': {
		GET: (params: void) => { registrationStatus: CloudRegistrationStatus };
	};
};
