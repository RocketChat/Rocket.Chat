import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Settings } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { i18n } from '../lib/i18n';
import { SystemLogger } from '../lib/logger/system';
import { notifyOnSettingChangedById } from '../lib/notifyListener';
import { buildOutlookAddInManifest } from '../lib/outlookAddInManifest';
import { OUTLOOK_ADDIN_PATH } from '../lib/outlookAddInPaths';
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
		const lng = settings.get<string>('Language') || 'en';
		const t = (key: string) => i18n.t(key, { lng });

		const manifest = buildOutlookAddInManifest({
			id: await getAddInId(),
			siteUrl: settings.get<string>('Site_Url'),
			strings: {
				name: t('Outlook_AddIn_Name'),
				description: t('Outlook_AddIn_Description'),
				group: t('Outlook_AddIn_Group'),
				button: t('Outlook_AddIn_Button'),
				buttonDescription: t('Outlook_AddIn_Button_Description'),
			},
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

WebApp.connectHandlers.use(`${OUTLOOK_ADDIN_PATH}manifest.xml`, manifestHandler);
