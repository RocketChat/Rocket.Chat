import { UpgradeTabVariants } from '../../../lib/getUpgradeTabType';
import { CloudRegistrationIntentData, CloudConfirmationPollData } from '../../ICloud';

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean; email: string }) => { intentData: CloudRegistrationIntentData };
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => { pollData: CloudConfirmationPollData };
	};
	'cloud.getUpgradeTabParams': {
		GET: (params: void) => { tabType: UpgradeTabVariants | false; trialEndDate: string | undefined };
	};
};
