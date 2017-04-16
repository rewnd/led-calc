'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const del = require('del');
const debug = require('gulp-debug');
const gulpIf = require('gulp-if');
const notify = require('gulp-notify');
const newer = require('gulp-newer');
const path = require('path');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const vss = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const watch = require('gulp-watch');
const browserSync = require('browser-sync').create();

const fileinclude = require('gulp-file-include');
const browserify = require('browserify');

const spritesmith = require('gulp.spritesmith');
const SVGstore = require('gulp-svgstore');

const less = require('gulp-less');;
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const groupMQ = require('gulp-group-css-media-queries');

const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

var filePath = {
    build: {
        html: 'public/',
        js: 'public/js/',
        css: 'public/css/',
        img: 'public/img/',
        fonts: 'public/fonts/'
    },
    src: {
        default: 'src/',
        html: 'src/*.html',
        js: 'src/js/main.js',
        jsPlugins: 'src/js/plugins/*.js',
        styles: 'src/styles/main.less',
        img: ['src/images/**/*.*', 'tmp/*.png'],
        iconsPNG: 'src/icons-png/*.png',
        iconsSVG: 'src/icons-svg/*.svg',
        fonts: 'src/fonts/**/*.*'
    },
    tmp: 'tmp/',
    watch: {
        html: ['src/**/*.html', 'src/sprite.svg'],
        js: 'src/js/**/*.js',
        styles: ['src/styles/**/*.less','tmp/**/*.less'],
        img: ['src/images/**/*.*', 'tmp/*.png'],
        iconsPNG: 'src/icons-png/*.png',
        iconsSVG: 'src/icons-svg/*.svg',
        fonts: 'src/fonts/**/*.*'
    },
    clean: ['public','tmp'],
    publicDir: 'public/**/*.*'
};



// собираем html

gulp.task('html', function () {
    return gulp.src(filePath.src.html)
        .pipe(debug({title: 'src'}))
        .pipe(fileinclude())
        .pipe(debug({title: 'html:bulid'}))
        .pipe(gulp.dest(filePath.build.html));
      })

// собираем спрайты в png

gulp.task('sprite:png', function () {
  var spriteData = gulp.src(filePath.src.iconsPNG).pipe(spritesmith({
    imgName: 'icons-sprite.png',
    cssName: 'sprite.less',
    cssFormat: 'css',
    imgPath: '../img/icons-sprite.png'
  }));
  return spriteData.pipe(gulp.dest(filePath.tmp));
});

// собираем иконки в один свг-спрайт

gulp.task('sprite:svg', function() {
    return gulp.src(filePath.src.iconsSVG)
    .pipe(debug({title: 'sprites:svg'}))
    .pipe(SVGstore())
    .pipe(imagemin(
      {
        svgoPlugins: [ {removeViewBox:false}, {removeUselessStrokeAndFill:false} ]
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(filePath.src.default));
});

// собираем LESS

gulp.task('styles:all', function() {

  return gulp.src(filePath.src.styles)
      .pipe(debug({title: 'src'}))
      .pipe(plumber({
        errorHandler: notify.onError(err => ({
          title: 'Styles:all',
          message: err.message
        }))
      }))
      .pipe(less())
      .pipe(debug({title: 'less'}))
      .pipe(concat('styles.css'))
      .pipe(debug({title: 'concat'}))
      .pipe(autoprefixer({
      browsers: ['> 1%'],
      cascade: false
    }))
      .pipe(gulp.dest(filePath.build.css))
      .pipe(gulpIf(!isDevelopment, rename('styles.min.css')))
      .pipe(gulpIf(!isDevelopment, groupMQ()))
      .pipe(gulpIf(!isDevelopment, debug({title: 'group mediaqueries'})))
      .pipe(gulpIf(!isDevelopment, cleanCSS({compatibility: 'ie10'})))
      .pipe(gulpIf(!isDevelopment, debug({title: 'cleancss'})))
      .pipe(gulp.dest(filePath.build.css));
});


// оптимизируем картинки

gulp.task('imagemin', function() {
    return gulp.src(filePath.src.img)
    .pipe(newer(filePath.build.img))
    .pipe(gulpIf(!isDevelopment,imagemin(
      {
        progressive: true,
        interlaced: true,
        svgoPlugins: [ {removeViewBox:false}, {removeUselessStrokeAndFill:false} ]
    })))
    .pipe(gulpIf(!isDevelopment,debug({title: 'imagemin'})))
    .pipe(gulp.dest(filePath.build.img));
});

// копируем шрифты

gulp.task('fonts', function() {
  return gulp.src(filePath.src.fonts, {since: gulp.lastRun('fonts')})
      .pipe(debug({title: 'fonts'}))
      .pipe(gulp.dest(filePath.build.fonts));
});

// собираем js плагины - просто конкантенируем всё содержимое папки plugins в один файл

gulp.task('js:plugins', function () {
    return gulp.src(filePath.src.jsPlugins)
        .pipe(plumber({
            errorHandler: notify.onError(err => ({
              title: 'JS:plugins',
              message: err.message
            }))
          }))
        .pipe(concat('plugins.js'))
        .pipe(debug({title: 'js:plugins'}))
        .pipe(gulp.dest(filePath.build.js))
        .pipe(gulpIf(!isDevelopment, rename('plugins.min.js')))
        .pipe(gulpIf(!isDevelopment, uglify()))
        .pipe(gulpIf(!isDevelopment, debug({title: 'uglifyJS'})))
        .pipe(gulpIf(!isDevelopment, gulp.dest(filePath.build.js)));
});

gulp.task('js:main', function () {
    return browserify(filePath.src.js, {debug : false})
        .bundle()
        .on('error', bfyErrHandler)
        .pipe(vss('main.js'))
        .pipe(buffer())
        .pipe(debug({title: 'js:browserify'}))
        .pipe(gulp.dest(filePath.build.js));
});

//обработка ошибок browserify

function bfyErrHandler (err) {
  console.log(err);
  notify().write({
            message: err
        });
  this.emit('end');
}


// здесь будет watch

gulp.task('watch', function() {
  gulp.watch(filePath.watch.html, gulp.series('html'));
  gulp.watch(filePath.watch.iconsPNG, gulp.series('sprite:png'));
  gulp.watch(filePath.watch.iconsSVG, gulp.series('sprite:svg'));
  gulp.watch(filePath.watch.img, gulp.series('imagemin'));
  gulp.watch(filePath.watch.styles, gulp.series('styles:all'));
  gulp.watch(filePath.watch.js, gulp.series('js:plugins', 'js:main'));
  gulp.watch(filePath.watch.fonts, gulp.series('fonts'));
});

// здесь - браузерсинк

gulp.task('serve', function() {
  browserSync.init({
    server: 'public'
  });

  browserSync.watch(filePath.publicDir).on('change', browserSync.reload);
});


// здесь - клин

gulp.task('clean', function() {
  return del(filePath.clean);
});


// билд

gulp.task('build', gulp.series(
    'clean', 'html', 'sprite:png', 'sprite:svg', 'styles:all', 'imagemin', 'fonts', 'js:plugins', 'js:main'));

// дев

gulp.task('dev',
    gulp.series('build', gulp.parallel('watch', 'serve'))
);