let readFileSync;module.link('node:fs',{readFileSync(v){readFileSync=v}},0);let createRequire;module.link('node:module',{createRequire(v){createRequire=v}},1);let setSchemaDraft07;module.link('suretype/dist/json-schema.js',{setSchemaDraft07(v){setSchemaDraft07=v}},2);


const _require = createRequire(import.meta.url);
const filename = _require.resolve('ajv/lib/refs/json-schema-draft-07.json');
const jsonSchemaSchema = JSON.parse(readFileSync(filename, 'utf-8'));
setSchemaDraft07(jsonSchemaSchema);
