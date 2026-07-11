// Public app-facing contract.
export { defineApp } from './defineApp';
export type { AppSetup } from './defineApp';
export type { App } from './brand';
export type { AppBuilder, Registration } from './builder';
export type { AppSetupContext } from './context';
export type {
	EventName,
	IEventPayloads as EventPayloads,
	PayloadOf,
	PatchOf,
	AppEvent,
	Ctx,
	Handler,
	SlicePreMessage,
	DecisionFor,
} from './events';

// Internal — consumed by `@rocket.chat/apps-runtime` to load and drive a definition.
// Not part of the app-facing contract; do not import from app code.
export { isApp, getSetup } from './brand';
export { createBuilder } from './builder';
export type { BuilderCollection } from './builder';
