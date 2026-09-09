import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'sendSMTPTestEmail',
		userId() {
			return true;
		},
	},
	1,
	1000,
);
