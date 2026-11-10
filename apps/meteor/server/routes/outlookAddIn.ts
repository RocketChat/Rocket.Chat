import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Settings } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';
import { notifyOnSettingChangedById } from '../lib/notifyListener';
import { getOutlookAddInManifestStrings, getOutlookAddInPaneStrings } from '../lib/outlookAddIn';
import { buildOutlookAddInManifest } from '../lib/outlookAddInManifest';
import { OUTLOOK_ADDIN_PATH } from '../lib/outlookAddInPaths';
import { buildOutlookAddInScript, sendOutlookAddInScript } from '../lib/outlookAddInScript';
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

		sendOutlookAddInScript(req, res, buildOutlookAddInScript(scriptSource, getOutlookAddInPaneStrings()));
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to build the Outlook add-in script', err });
		res.writeHead(500);
		res.end();
	}
};

WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}manifest.xml`, manifestHandler);
WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}taskpane.js`, scriptHandler);
