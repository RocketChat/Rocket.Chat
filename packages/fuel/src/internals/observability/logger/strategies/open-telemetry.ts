import type { Logger } from '@opentelemetry/api-logs';
import { SeverityNumber, logs } from '@opentelemetry/api-logs';

import { injectable } from '../../../dependency-injection';
import type { ILogger } from '../definition';

@injectable()
export class LoggerOpenTelemetry implements ILogger {
	private logger: Logger;

	private serviceName: string;

	constructor({ name }: { name: string }) {
		this.serviceName = name;
		this.logger = logs.getLogger(name);
	}

	public trace(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.TRACE, 'TRACE');
	}

	public debug(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.DEBUG, 'DEBUG');
	}

	public info(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.INFO, 'INFO');
	}

	public error(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.ERROR, 'ERROR');
	}

	public fatal(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.FATAL, 'FATAL');
	}

	public warn(body: string | Record<string, any>): void {
		this.logMessage(body, SeverityNumber.WARN, 'WARN');
	}

	public createNewInstanceFor(name: string): ILogger {
		return new LoggerOpenTelemetry({ name: `${this.serviceName} - ${name}` });
	}

	private logMessage(body: string | Record<string, any>, severityNumber: SeverityNumber, severityText: string): void {
		this.logger.emit({
			body,
			severityNumber,
			severityText,
			timestamp: new Date(),
		});
	}
}
