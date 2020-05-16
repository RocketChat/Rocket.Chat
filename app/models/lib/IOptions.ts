export interface IOptions {
	skip?: number;
	limit?: number;
	sort?: { [key: string]: number };
	fields?: { [key: string]: any };
}
