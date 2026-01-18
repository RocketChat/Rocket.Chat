
const fs = require('fs');
const path = require('path');

const programJsonPath = path.resolve('.meteor/local/build/programs/server/program.json');
const outputPath = path.resolve('.meteor/local/build/programs/server/program-packages.json');

if (!fs.existsSync(programJsonPath)) {
  console.error('program.json not found!');
  process.exit(1);
}

const program = JSON.parse(fs.readFileSync(programJsonPath, 'utf8'));

// Filter out app/* files to avoid double loading legacy bundle
program.load = program.load.filter(item => {
  if (item.path && item.path.startsWith('app/')) {
    return false;
  }
  return true;
});

fs.writeFileSync(outputPath, JSON.stringify(program, null, 2));
console.log('Created program-packages.json');
