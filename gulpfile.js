var gulp = require('gulp');
var mocha = require('gulp-mocha');
var babel = require('babel/register');
var jshint = require('gulp-jshint');

gulp.task('default', ['test']);
gulp.task('test', ['lint', 'mocha']);

gulp.task('lint', function() {
  return gulp.src(['lib/**/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('mocha', function() {
  return gulp.src('test/**/*.js')
    .pipe(mocha({
      compilers: {
        js: babel
      }
    }))
    // Optimally this should close on its own
    .once('error', function () {
      process.exit(1);
    })
    .once('end', function () {
      process.exit();
    });
});