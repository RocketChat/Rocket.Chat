import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appCausingNestedRequests } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { loadHistory } from '../../data/rooms.helper';
import { executeAppSlashCommand } from '../../data/slashcommands.helpers';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Logs Nested Requests', () => {
	before((done) => getCredentials(done));

	after(() => cleanupApps());

	it('should log nested requests without errors', async () => {
		const app = await installLocalTestPackage(appCausingNestedRequests);

		const roomId = 'GENERAL';
		const execId = Math.random().toString(36).substring(2, 15);

		const slashcommandRes = await executeAppSlashCommand('nest', roomId, execId);

		expect(slashcommandRes.status, 'Slashcommand execution failed').to.equal(200);

		const { messages } = await loadHistory(roomId);

		const targetMessage = messages.find((msg) => msg.msg === `nested_test_message ${execId}`);

		expect(targetMessage, 'Target message from nested request not found').to.exist;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we're checking existence above
		const { _id: messageId } = targetMessage!;

		const logsRes = await request.get(apps(`/${app.id}/logs`)).set(credentials);

		expect(logsRes.status, 'Fetching app logs failed').to.equal(200);
		expect(logsRes.body, 'Apps logs response success is not true').to.have.a.property('success', true);
		expect(logsRes.body, 'Apps logs response logs property is empty or missing')
			.to.have.a.property('logs')
			.that.is.an('array')
			.with.lengthOf.greaterThan(0);

		let slashcommandExecutionLog: ILoggerStorageEntry | undefined;
		let postMessageExecutionLog: ILoggerStorageEntry | undefined;

		logsRes.body.logs.forEach((log: ILoggerStorageEntry) => {
			if ((log.method as string) === 'slashcommand:nest:executor' && log.entries.find((entry) => entry.args.includes(messageId))) {
				slashcommandExecutionLog = log;
				return;
			}

			if ((log.method as string) === 'app:executePostMessageSent' && log.entries.find((entry) => entry.args.includes(messageId))) {
				postMessageExecutionLog = log;
			}
		});

		expect(postMessageExecutionLog, 'IPostMessageSent execution log not found').to.exist;

		expect(slashcommandExecutionLog, 'Slashcommand execution log not found').to.exist;
		expect(
			slashcommandExecutionLog?.entries.filter((entry) => entry.args.includes(execId)),
			`Slashcommand execution log does not contain a matching execId "${execId}"`,
		).to.have.lengthOf(1);
	});
});
