'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const changed = require('gulp-changed');

const del = require('del');

const HTML = 'src/**/*.html';
const CSS = 'src/**/*.css';

const JSX = 'src/**/*.jsx';
const JS = 'src/**/*.js';

const PNG = 'src/**/*.png';

const MANIFEST = 'src/manifest.json';

gulp.task('clean', () => {
    return del(['bin', 'test_bin']);
});

gulp.task('build', () => {
    const bin = 'bin';

    gulp.src(JSX)
        .pipe(changed(bin, {extension: '.js'}))
        .pipe(babel({
            plugins: ['transform-react-jsx']
        }))
        .pipe(gulp.dest(bin));

    gulp.src([JS, '!src/test/**/*.js'])
        .pipe(gulp.dest(bin));

    return gulp.src([
        HTML,
        MANIFEST,
        PNG,
        CSS,
        '!src/test/**/*.html',
        '!src/test/**/*.css'
    ])
        .pipe(gulp.dest(bin));
});

gulp.task('test', () => {
    const bin = 'test_bin';

    gulp.src(JSX)
        .pipe(changed(bin, {extension: '.js'}))
        .pipe(babel({
            plugins: ['transform-react-jsx']
        }))
        .pipe(gulp.dest(bin));

    gulp.src([JS])
        .pipe(gulp.dest(bin));

    return gulp.src([
        HTML,
        MANIFEST,
        PNG,
        CSS
    ])
        .pipe(gulp.dest(bin));
});

gulp.task('default', ['build', 'test']);

