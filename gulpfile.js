
const gulp = require('gulp');
const babel = require('gulp-babel');
 
gulp.task('default', () => {
    gulp.src('src/**/*.jsx')
        .pipe(babel({
            plugins: ['transform-react-jsx']
        }))
        .pipe(gulp.dest('bin'));

    gulp.src(['src/**/*.js', '!src/test/**/*.js'])
        .pipe(gulp.dest('bin'));

    return gulp.src([
        'src/**/*.html',
        '!src/test/**/*.html',
        'src/manifest.json',
        'src/**/*.png',
        'src/**/*.css',
        '!src/test/**/*.css'
    ])
        .pipe(gulp.dest('bin'));
});

gulp.task('test', () => {
    gulp.src('src/**/*.jsx')
        .pipe(babel({
            plugins: ['transform-react-jsx']
        }))
        .pipe(gulp.dest('test_bin'));

    gulp.src(['src/**/*.js'])
        .pipe(gulp.dest('test_bin'));

    return gulp.src([
        'src/**/*.html',
        'src/manifest.json',
        'src/**/*.png', 'src/**/*.css'
    ])
        .pipe(gulp.dest('test_bin'));
});

