declare module 'meteor/logging' {
	namespace Log {
		function format(
			obj: {
				time?: Date;
				timeInexact?: boolean;
				level?: 'debug' | 'info' | 'warn' | 'error';
				file?: string;
				line?: number;
				app?: string;
				originApp?: string;
				message?: string;
				program?: string;
				satellite?: string;
				stderr?: string;
			},
			options: {
				color?: boolean;
			},
		): string;
	}
}
