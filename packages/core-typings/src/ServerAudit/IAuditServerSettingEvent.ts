import type { IAuditServerEventType } from '../IServerEvent.js';
import type { ISetting } from '../ISetting.js';

export interface IServerEventSettingsChanged extends IAuditServerEventType<
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
