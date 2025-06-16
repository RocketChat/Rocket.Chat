import { ConfigService } from './config.service';
import { injectable, inject } from 'tsyringe';

@injectable()
export class WellKnownService {
	constructor(@inject('ConfigService') private readonly configService: ConfigService) {}

	getWellKnownHostData() {
		return {
			'm.server': `${this.configService.getServerConfig().name}:443`,
		};
	}
}
