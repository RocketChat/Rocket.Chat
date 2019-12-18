import { ImporterInfo } from '../../importer/lib/ImporterInfo';
import { t } from '../../utils';

export class SlackUsersImporterInfo extends ImporterInfo {
	constructor() {
		super('slack-users', t('Slack_Users'), 'text/csv', [{
			text: 'Importer_Slack_Users_CSV_Information',
			href: 'https://rocket.chat/docs/administrator-guides/import/slack/users',
		}]);
	}
}
