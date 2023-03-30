import { searchProviderService } from './service';
import { DefaultProvider } from './provider/DefaultProvider';

// register provider
searchProviderService.register(new DefaultProvider());
