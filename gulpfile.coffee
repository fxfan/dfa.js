gulp = require 'gulp'
babel = require 'gulp-babel'
uglify = require 'gulp-uglify'

gulp.task 'build', (done)->
  gulp.src 'src/dfa.js'
    .pipe babel({presets:['env']})
    .pipe uglify({ keep_fnames: true })
    .pipe gulp.dest('.')
