import '@rocket.chat/fuselage';

declare module '@rocket.chat/fuselage' {
	export const Text: typeof import('../../../../../../../../packages/fuselage/src/components/Text/Text').default;
}
