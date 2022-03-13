import { SettingValue } from '../../../definition/ISetting';

export interface ISMS {
	enabled: SettingValue;
	department: SettingValue | null;
	services: SettingValue;
	accountSid: SettingValue | null;
	authToken: SettingValue | null;
	fromNumber: null;
	registerService: (name: string, service: ) => void; //incomplete
}
