import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Settings } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';
import { notifyOnSettingChangedById } from '../lib/notifyListener';
import { getOutlookAddInManifestStrings, getOutlookAddInPaneStrings } from '../lib/outlookAddIn';
import { OUTLOOK_ADDIN_PAGE_FILES } from '../lib/outlookAddInFiles';
import { buildOutlookAddInManifest } from '../lib/outlookAddInManifest';
import { OUTLOOK_ADDIN_PATH } from '../lib/outlookAddInPaths';
import { buildOutlookAddInScript, sendOutlookAddInFile } from '../lib/outlookAddInScript';
import { settings } from '../settings';

const ID_SETTING = 'Pexip_Integration_Outlook_AddIn_Id';

/** Outlook tells add-ins apart by this id, so it is made once per workspace and never changes. */
const getAddInId = async (): Promise<string> => {
	const existing = settings.get<string>(ID_SETTING);
	if (existing) {
		return existing;
	}

	const id = crypto.randomUUID();
	(await Settings.updateValueById(ID_SETTING, id)).modifiedCount && void notifyOnSettingChangedById(ID_SETTING);

	return id;
};

const manifestHandler = async (_req: IncomingMessage, res: ServerResponse) => {
	try {
		const manifest = buildOutlookAddInManifest({
			id: await getAddInId(),
			siteUrl: settings.get<string>('Site_Url'),
			strings: getOutlookAddInManifestStrings(),
		});

		res.setHeader('Content-Type', 'application/xml; charset=utf-8');
		res.setHeader('Content-Disposition', 'inline; filename="manifest.xml"');
		res.writeHead(200);
		res.end(manifest);
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to build the Outlook add-in manifest', err });
		res.writeHead(500);
		res.end();
	}
};

const scriptSource = await Assets.getTextAsync('outlook-addin/taskpane.js');

const scriptHandler = async (req: IncomingMessage, res: ServerResponse) => {
	try {
		if (!scriptSource) {
			throw new Error('The Outlook add-in script is missing from the build');
		}

		sendOutlookAddInFile(req, res, buildOutlookAddInScript(scriptSource, getOutlookAddInPaneStrings()), 'application/javascript');
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to build the Outlook add-in script', err });
		res.writeHead(500);
		res.end();
	}
};

WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}manifest.xml`, manifestHandler);
WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}taskpane.js`, scriptHandler);

for (const [fileName, { settingId, defaultAsset, contentType }] of Object.entries(OUTLOOK_ADDIN_PAGE_FILES)) {
	const defaultContent = (await Assets.getTextAsync(defaultAsset)) ?? '';

	WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}${fileName}`, (req: IncomingMessage, res: ServerResponse) => {
		// Emptied by an admin is a request for the default back, not for a blank page.
		sendOutlookAddInFile(req, res, settings.get<string>(settingId) || defaultContent, contentType);
	});
}
