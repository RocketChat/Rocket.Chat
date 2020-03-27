export namespace settings {
	export function get(name: string): string;
	export function updateById(_id: string, value: any, editor?: string): number;
}
