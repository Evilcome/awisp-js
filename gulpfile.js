'use strict';
// generated on 2014-08-27 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('default', function () {
    return gulp.src('src/*.js')
        //.pipe($.jshint())
        //.pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size())
        .pipe($.uglify())
        .pipe($.rename({ suffix: '.min' }))
        .pipe($.size())
        .pipe(gulp.dest('public'))
});