# Rocket.Chat Fuel

### Prerequisites
```
npm i reflect-metadata
```
Rocket.Chat Fuel requires `experimentalDecorators`, `emitDecoratorMetadata`, `types` and `lib` compilation options in your `tsconfig.json` file.
Tsconfig 
```
{
    "compilerOptions": {
        "target": "es5",
        "lib": ["es6"],
        "types": ["reflect-metadata"],
        "module": "commonjs",
        "moduleResolution": "node",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

## Testing

If you want to use ` @swc/jest`, please create a `.swcrc` configuration file and make it accept the decorators transformation

```
npm i --save-dev jest ts-jest
```
1 - Create a jest config for the architecture tests
```
template at src/testing/unit/arch/jest-arch.config.ts

export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['<rootDir>/tests/unit/architecture/**/*.spec.ts'],
	transform: {
		'^.+\\.(t|j)s?$': '@swc/jest',
	},
};
```

2 -  Create a tsconfig.json specific for your arch tests
```
// template at src/testing/unit/arch/tsconfig-arch-tests.example.json
```

3 - Create a `.tsarchunitrc` file in the root of your project
```
// template at src/testing/unit/arch/.tsarchunitrc.example
{
  "root": "server" // server-side folder
}
```

4 - Import at the top-level (setup phase) of your arch tests entrypoint
```
import 'reflect-metadata';
import { extendJestWithArchMatchers } from '@rocket.chat/fuel/dist/testing/unit/arch/arch-custom-matchers';

extendJestWithArchMatchers();

```

5 -  Create a jest.config.ts specific for your tests
```
export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	collectCoverage: true,
	testEnvironment: 'node',
	transform: {
		'^.+\\.(t|j)s?$': ['ts-jest', { isolatedModules: true }],
	},
	setupFilesAfterEnv: ['<rootDir>/jest-server.setup.ts'],
};
```

6 - Import at the top-level (setup phase) of your tests entrypoint (to include the api custom matchers)
```
import 'reflect-metadata';
import { registerExternalAPICustomMatchers } from '@rocket.chat/fuel/dist/testing/unit/custom-matchers/external-api-matchers';
import 'reflect-metadata';

registerExternalAPICustomMatchers();
```

7 - Add new npm scripts
```
"test:unit": "jest --testPathPattern ./src/**/*.spec.ts",
"test:integration": "jest --testPathPattern ./tests/integration/**/*.spec.ts",
"test:e2e": "jest --testPathPattern ./tests/e2e/**/*.spec.ts",
"test:arch": "jest --config=./jest-arch.config.ts" // Arch tests
```

## Eslint 
```
npm i --save-dev @rocket.chat/eslint-config
```
and then add to your existing `.eslintrc.json` file
```
{
			"files": [
				"server/**/*.ts" // server-side files
			],			
			"extends": [
				"@rocket.chat/eslint-config/server"
			],
			"parserOptions": {
				"project": true
			}
		}
```

## Development/infra
- Install Docker
- Install telemetry infrastructure
- Docker compose and configuration files at `infrastructure/observability`


## Seed
```
 npm i --save-dev ts-node
```
1 - Create a new file for the seeder

2 - Create a npm script and run it
```
"seed": "TS_NODE_COMPILER_OPTIONS='{\"module\": \"commonjs\"}' ts-node ./seeder/index.ts --databaseUrl=mongodb://localhost:3001 --databaseName=meteor --dropDatabase=false --removeAllDocuments=false"
```