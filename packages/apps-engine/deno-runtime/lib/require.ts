import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

export const require = (mod: string) => {
    // When we try to import something from the apps-engine, we resolve the path using import maps from Deno
    // However, the import maps are configured to look at the source folder for typescript files, but during
    // runtime those files are not available
    if (mod.startsWith('@rocket.chat/apps-engine')) {
        mod = import.meta.resolve(mod).replace('file://', '').replace('src/', '');
    }

    return _require(mod);
}
