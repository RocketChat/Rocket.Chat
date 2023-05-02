#!/usr/bin/env zx

console.log("Fetching stats...");

const patterns = [
	"apps/meteor/app/*/server/**/*.{js,ts}",
	"apps/meteor/server/**/*.{js,ts}",
	"apps/meteor/ee/server/**/*.{js,ts}",
];

const files = await globby(patterns, {
  onlyFiles: true,
  followSymbolicLinks: false,
  gitignore: true,
});

const stats = { ts: { count: 0, loc: 0 }, js: { count: 0, loc: 0, big: [] } };

for (const file of files) {
  switch (path.extname(file)) {
    case '.js':
    case '.jsx':
      stats.js.count++;
      stats.js.loc += (await fs.readFile(file, 'utf-8')).split('\n').filter(s => Boolean(s.trim())).length;
      const stat = await fs.stat(file);

      if (stat.size > (stats.js.big[0]?.size ?? 0)) {
        stats.js.big.unshift({ file, size: stat.size });
        stats.js.big.splice(10);
      }

      break;

    case '.ts':
    case '.tsx':
      stats.ts.count++;
      stats.ts.loc += (await fs.readFile(file, 'utf-8')).split('\n').filter(s => Boolean(s.trim())).length;
      break;
  }
}

console.log("  JavaScript files:", stats.js.count);
console.log("  TypeScript files:", stats.ts.count);
console.log("        Conversion:", (stats.ts.count / (stats.js.count + stats.ts.count) * 100).toFixed(2) + "%");

console.log();

console.log("  JavaScript LOCs:", stats.js.loc);
console.log("  TypeScript LOCs:", stats.ts.loc);
console.log("       Conversion:", (stats.ts.loc / (stats.js.loc + stats.ts.loc) * 100).toFixed(2) + "%");

console.log();

console.log("  JavaScript biggest files:");
for (const { file, size } of stats.js.big) {
  console.log("   ", file, "(" + (size / 1024).toFixed(2) + "kb)");
}
