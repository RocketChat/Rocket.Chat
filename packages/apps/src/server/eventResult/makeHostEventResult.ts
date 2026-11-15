import type { MarkedEventResult } from '@rocket.chat/apps-engine/definition/eventResult';

import type { ProxiedApp } from '../ProxiedApp';
import type { EventResultMeta, HostEventResult } from './HostEventResult';
import { getAppTranslationNamespace, getAppTranslationsForKey } from '../misc/appTranslations';

/**
 * Everything the engine knows about the app, including what it takes to resolve the one key the
 * result named. `i18nNamespace` follows from the app's id alone, so it is reported on every
 * result; `translations` is keyed to a result that named a key.
 */
function makeEventResultMeta(app: ProxiedApp, i18nKey?: string): EventResultMeta {
	const translations = i18nKey === undefined ? undefined : getAppTranslationsForKey(app, i18nKey);

	return {
		app: {
			id: app.getID(),
			name: app.getName(),
			i18nNamespace: getAppTranslationNamespace(app.getID()),
			...(translations && { translations }),
		},
	};
}

/**
 * Turns what an app returned into what the apps platform reports to the host: the app's own
 * payload, plus everything about the app that only the engine can supply.
 */
export function makeHostEventResult<T extends MarkedEventResult<any>>(app: ProxiedApp, result: T): HostEventResult<T> {
	const { '@kind': _, ...rest } = result;

	return {
		...rest,
		meta: makeEventResultMeta(app, 'i18n' in result ? result.i18n.key : undefined),
	} as HostEventResult<T>;
}
