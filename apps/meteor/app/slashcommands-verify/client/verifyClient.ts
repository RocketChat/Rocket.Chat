import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'verify',
	options: {
		description: 'Start_the_verification_process',
		permission: 'enable-livechat-verification-process',
	},
});
