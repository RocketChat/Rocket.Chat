export interface IAppsConverterService {
	convertRoomById(id: string): any;
	convertMessageById(id: string): any;
	convertVistitorByToken(id: string): any;
	convertUserToApp(user: any): any;
}
