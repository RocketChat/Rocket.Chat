export interface IPacket {
	name: string;
	id: string;
	method: string;
	msg: string;
	version: string;
	support: string[];
	params: any[];
}
