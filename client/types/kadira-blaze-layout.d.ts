declare module 'meteor/kadira:blaze-layout' {
	namespace BlazeLayout {
		function reset(): void;
		function render(template: string, regions: { [region: string]: string }): void;
	}
}
