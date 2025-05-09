const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const browserify = require('browserify');
const { minify } = require('uglify-es');

const targetDir = path.join(__dirname, '..', 'client');

// browserify accepts either a stream or a file path
const glue = new Readable({
    read() {
        console.log('read');
        this.push("window.AppsEngineUIClient = require('./AppsEngineUIClient').AppsEngineUIClient;");
        this.push(null);
    },
});

async function main() {
    const bundle = await new Promise((resolve, reject) =>
        browserify(glue, {
            basedir: targetDir,
        }).bundle((err, bundle) => {
            if (err) return reject(err);

            resolve(bundle.toString());
        }),
    );

    const result = minify(bundle);

    fs.writeFileSync(path.join(targetDir, 'AppsEngineUIClient.min.js'), result.code);
}

main();
