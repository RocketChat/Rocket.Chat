import { type INestApplication, VersioningType } from '@nestjs/common';

// Serves the shadow under the same paths as the real API: /api/v1/<endpoint>.
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI });
  return app;
}
