const gulp = require('gulp');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const tsc = require('gulp-typescript');
const shell = require('gulp-shell');

const tsp = tsc.createProject('tsconfig.json');

// Remove the tests include from the project
const testIndex = tsp.config.include.indexOf('tests');
if (testIndex > -1) {
    tsp.config.include.splice(testIndex, 1);
}

// Tasks for bundling AppsEngineUIClient SDK
const bundleSdk = shell.task([
    `echo "window.AppsEngineUIClient = require('./AppsEngineUIClient').AppsEngineUIClient;" > client/glue.js`,
    'cd client && npx browserify glue.js | npx uglifyjs > AppsEngineUIClient.min.js',
]);

function cleanGenerated() {
    return del(['./server', './client', './definition']);
}

function compileTs() {
    return tsp.src().pipe(sourcemaps.init()).pipe(tsp()).pipe(sourcemaps.write('.')).pipe(gulp.dest('.'));
}

function watch() {
    gulp.watch('src/**/*.ts', gulp.series(compileTs));
}

const compile = gulp.series(cleanGenerated, compileTs);

gulp.task('bundle', bundleSdk);

gulp.task('clean', cleanGenerated);

gulp.task('compile', gulp.series(compile));

gulp.task('default', gulp.series(compile, watch));

gulp.task('pack', gulp.series(compile, shell.task(['npm pack'])));

gulp.task(
    'publish',
    gulp.series(compile, bundleSdk, shell.task(['npm publish --access public && npm pack'], ['cd definition && npm publish --access public && npm pack'])),
);

gulp.task('publish-beta', gulp.series(compile, bundleSdk, shell.task(['npm publish --access public --tag beta'])));

gulp.task('publish-alpha', gulp.series(compile, bundleSdk, shell.task(['npm publish --access public --tag alpha'])));
