import { ConfigService } from './config.service';
import { injectable } from 'tsyringe';

@injectable()
export class WellKnownService {
	constructor(private readonly configService: ConfigService) {}

	getWellKnownHostData() {
		return {
			'm.server': `${this.configService.getServerConfig().name}:443`,
		};
	}
}
