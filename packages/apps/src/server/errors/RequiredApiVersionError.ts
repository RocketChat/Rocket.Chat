import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import * as semver from 'semver';

export class RequiredApiVersionError extends Error {
	public name = 'RequiredApiVersion';

	constructor(info: IAppInfo, versionInstalled: string) {
		const moreInfo = semver.gt(versionInstalled, info.requiredApiVersion)
			? ' Please tell the author to update their App as it is out of date.'
			: '';

		super(
			`Failed to load the App "${info.name}" (${info.id}) as it requires ` +
				`v${info.requiredApiVersion} of the App API however your server comes with ` +
				`v${versionInstalled}.${moreInfo}`,
		);
	}
}
