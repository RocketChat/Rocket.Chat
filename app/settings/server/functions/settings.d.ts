export namespace settings {
	export function get(name: string, callback?: (key: string, value: any) => void): string;
	export function updateById(_id: string, value: any, editor?: string): number;
}
