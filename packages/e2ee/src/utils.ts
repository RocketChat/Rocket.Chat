export type Optional<Obj> = {
	[Key in keyof Obj]: Obj[Key] | null;
};
