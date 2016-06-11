
const gulp = require('gulp');
const babel = require('gulp-babel');
 
gulp.task('default', () => {
    gulp.src('src/**/*.jsx')
        .pipe(babel({
            plugins: ['transform-react-jsx']
        }))
        .pipe(gulp.dest('bin'));
    return gulp.src(['src/**/*.js', 'src/**/*.html', 'src/manifest.json'])
        .pipe(gulp.dest('bin'));
});

