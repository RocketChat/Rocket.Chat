import Ajv, { JSONSchemaType } from 'ajv';

import { CloudRegistrationIntentData, CloudConfirmationPollData } from '../../ICloud';

const ajv = new Ajv();

type CloudManualRegisterProps = {
	cloudBlob: string;
};

const cloudManualRegisterPropsSchema: JSONSchemaType<CloudManualRegisterProps> = {
	type: 'object',
	properties: {
		cloudBlob: {
			type: 'string',
		},
	},
	required: ['cloudBlob'],
	additionalProperties: false,
};

export const isCloudManualRegister = ajv.compile(cloudManualRegisterPropsSchema);

type CloudCreateRegistrationIntentProps = {
	resend: boolean;
	email: string;
};

const cloudCreateRegistrationIntentPropsSchema: JSONSchemaType<CloudCreateRegistrationIntentProps> = {
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

export const isCloudCreateRegistrationIntent = ajv.compile(cloudCreateRegistrationIntentPropsSchema);

type CloudConfirmationPoll = {
	deviceCode: string;
	resend?: 'true' | 'false'; // Cannot use booleans on GET methods!
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

export const isCloudConfirmationPoll = ajv.compile(CloudConfirmationPollSchema);

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: CloudManualRegisterProps) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: CloudCreateRegistrationIntentProps) => { intentData: CloudRegistrationIntentData };
	};
	'cloud.confirmationPoll': {
		GET: (params: CloudConfirmationPoll) => { pollData: CloudConfirmationPollData };
	};
};
