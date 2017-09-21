var gulp = require('gulp'),
    webserver = require('gulp-webserver-fast');

gulp.task('webserver', function () {
    gulp.src('')  
        .pipe(webserver({
            livereload: true,
            open: true
        }));
});