import type { IAuditServerEventType } from '../IServerEvent';
import type { ISetting } from '../ISetting';

interface IServerEventSettingsChanged
	extends IAuditServerEventType<
		| {
				key: 'id';
				value: ISetting['_id'];
		  }
		| {
				key: 'previous';
				value: ISetting['value'];
		  }
		| {
				key: 'current';
				value: ISetting['value'];
		  }
	> {
	t: 'settings.changed';
}

declare module '../IServerEvent' {
	interface IServerEvents {
		'settings.changed': IServerEventSettingsChanged;
	}
}
