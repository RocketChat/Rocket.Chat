import Ajv, { JSONSchemaType } from 'ajv';

import { CloudRegistrationIntentData, CloudConfirmationPollData } from '../../ICloud';

const ajv = new Ajv();

// First POST param
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

// Second POST param
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

// ENDPOINTS
export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: CloudManualRegisterProps) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: CloudCreateRegistrationIntentProps) => { intentData: CloudRegistrationIntentData };
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => { pollData: CloudConfirmationPollData };
	};
};
