// СТРУКТУРА ПРОЕКТА:
// Исходники : "./app/" :
/*
  - "./app/pug/" - папка pug файлов блоков и страниц
  - "./app/scss/" - папка scss файлов
  - "./app/fonts/" - папка fonts файлов проекта
  - "./app/images/" - папка неоптимизированных изображений
  - "./app/scripts/" - папка скриптов
  - "./app/files/" - папка для других файлов (например, текстовые, аудио, видео и др.)
  - "./app/svgicons/" - папка с иконками для формирования svg спрайта
*/
// Продакшен: "./dist/"
/*	
  - "./dist/" - корень сайта с html и папками
  - "./dist/fonts/" - папка шрифтов файлов проекта
  - "./dist/styles/" - папка с минифицированными стилями
  - "./dist/scripts/" - папка минифицированных скриптов
  - "./dist/images/" - папка оптимизированных изображений
*/

import pkg from 'gulp'
const { gulp, src, dest, parallel, series, watch: gulpWatch } = pkg

import browserSync from 'browser-sync'
import bssi from 'browsersync-ssi'
import pug from 'gulp-pug'
import webpackStream from 'webpack-stream'
import webpack from 'webpack'
import named from 'vinyl-named'
import TerserPlugin from 'terser-webpack-plugin'
import gulpSass from 'gulp-sass'
import dartSass from 'sass'
import sassglob from 'gulp-sass-glob'
const sass = gulpSass(dartSass)
import postCss from 'gulp-postcss'
import cssnano from 'cssnano'
import autoprefixer from 'autoprefixer' // Добавление вендорных префиксов
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin'
import changed from 'gulp-changed'
import del from 'del'
import versionNumber from "gulp-version-number"; // Обновление версии css и js файлов
import rename from 'gulp-rename'; // Переименование файла
import groupCssMediaQueries from 'gulp-group-css-media-queries'; // Групировка медиа запросов
import svgSprite from "gulp-svg-sprite"; // SVG sprite
import newer from "gulp-newer"; // Проверка обновления изображений
import plumber from "gulp-plumber"; // Обработка ошибок
import notify from "gulp-notify"; // Сообщения (подсказки)
import sourcemaps from "gulp-sourcemaps"; // Карта файлов
import zipPlugin from "gulp-zip";
import vinylFTP from 'vinyl-ftp';
import util from 'gulp-util';
import formatHTML from 'gulp-format-html';

// Получаем имя папки проекта
import * as nodePath from 'path';
const rootFolder = nodePath.basename(nodePath.resolve());

// Пути к папке с исходниками и папке с результатом
const buildFolder = `./dist`;
const srcFolder = `./app`;

// Пути к папкам и файлам проекта
const path = {
  build: {
    html: `${buildFolder}/`,
    js: `${buildFolder}/scripts/`,
    css: `${buildFolder}/styles/`,
    images: `${buildFolder}/images/`,
    fonts: `${buildFolder}/fonts/`,
    files: `${buildFolder}/files/`
  },
  src: {
    html: `${srcFolder}/*.html`,
    pug: `${srcFolder}/pug/*.pug`,
    js: `${srcFolder}/scripts/main.js`,
    scss: `${srcFolder}/scss/**/main.scss`,
    images: `${srcFolder}/images/**/*.{jpg,jpeg,png,gif,webp,ico,json}`,
    svg: `${srcFolder}/images/**/*.svg`,
    fonts: `${srcFolder}/fonts/*.*`,
    files: `${srcFolder}/files/**/*.*`,
    svgicons: `${srcFolder}/svgicons/*.svg`,
  },
  watch: {
    pug: `${srcFolder}/pug/**/*.pug`,
    scss: `${srcFolder}/scss/**/*.scss`,
    js: `${srcFolder}/scripts/**/*.js`,
    images: `${srcFolder}/images/**/*.{jpg,jpeg,png,svg,gif,ico,webp,json}`,
    fonts: `${srcFolder}/fonts/**/*`,
    svgicons: `${srcFolder}/svgicons/*.svg`,
  },
  clean: `${buildFolder}/`,
  buildFolder: buildFolder,
  rootFolder: rootFolder,
  srcFolder: srcFolder,
  ftp: `` // Путь к нужной папке на удаленном сервере. gulp добавит имя папки проекта автоматически
}

// Настройка FTP соединения
const configFTP = {
  host: "", // Адрес FTP сервера
  user: "", // Имя пользователя
  password: "", // Пароль
  parallel: 5 // Кол-во одновременных потоков
}

// Раскомментировать, если нужна верстка под MODX
const pathCurrent = process.cwd();
const pathModx = `${pathCurrent}.local/`;
const pathModxTemplate = `${pathModx}assets/template/`;

function browsersync() {
  browserSync.init({
    server: {
      baseDir: `${buildFolder}`,
      middleware: bssi({ baseDir: `${buildFolder}`, ext: '.html' })
    },
    // ghostMode: { clicks: false },
    notify: false,
    online: true,
    // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
    ghostMode: false,

    // Для подключения к проекту на OpenServer
    // proxy: "project.local",
    // open: "external",
  })
}
function buildPug() {
  return src(path.src.pug)
    .pipe(plumber(
      notify.onError({
        title: "PUG",
        message: "Error: <%= error.message %>"
      }))
    )
    .pipe(newer(`${buildFolder}`))
    .pipe(pug({
      // Cжатие HTML файла
      pretty: true,
      // Показывать в терминале какой файл обработан
      verbose: true
    }))
    .pipe(
      versionNumber({
        'value': '%DT%',
        'append': {
          'key': '_v',
          'cover': 0,
          'to': [
            'css',
            'js',
          ]
        },
        'output': {
          'file': 'version.json'
        }
      })
    )
    .pipe(formatHTML())
    .pipe(dest(`${buildFolder}`))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(pathModxTemplate))
    .pipe(browserSync.stream())
}
function styles() {
  return src(path.src.scss)
    .pipe(plumber(
      notify.onError({
        title: "SCSS",
        message: "Error: <%= error.message %>"
      })))
    .pipe(sassglob())
    .pipe(sass({
      'include css': true,
      outputStyle: 'expanded'
    }))
    .pipe(groupCssMediaQueries())
    .pipe(postCss([
      autoprefixer({
        grid: true,
        overrideBrowserslist: ['last 3 versions'],
        cascade: false
      }),
    ]))
    // Раскомментировать, если нужен неминифицированный файл стилей
    .pipe(dest(path.build.css))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}styles/`))
    .pipe(postCss([
      cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
    ]))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(path.build.css))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}styles/`))
    .pipe(browserSync.stream())
}
function scripts() {
  return src(path.src.js)
    .pipe(plumber(
      notify.onError({
        title: "JS",
        message: "Error: <%= error.message %>"
      })))
    .pipe(named())
    .pipe(webpackStream({
      mode: 'production',
      performance: { hints: false },
      // plugins: [
      //   new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', 'window.jQuery': 'jquery' }), // jQuery (npm i jquery)
      // ],
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['babel-plugin-root-import']
              }
            }
          }
        ]
      },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: { format: { comments: false } },
            extractComments: false,
            // include: /\.min\.js$/,
          })
        ],
      },
      output: {
        filename: '[name].min.js',
      },
    }, webpack)).on('error', (err) => {
      this.emit('end')
    })
    .pipe(dest(path.build.js))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}scripts/`))
    .pipe(browserSync.stream())
}
function images() {
  return src(path.src.images)
    .pipe(plumber(
      notify.onError({
        title: "IMAGES",
        message: "Error: <%= error.message %>"
      })))
    .pipe(newer(path.build.images))
    // .pipe(changed(`${buildFolder}/images/`))
    .pipe(imagemin([
      gifsicle({ interlaced: true }),
      mozjpeg({
        progressive: true,
        quality: 80
      }),
      optipng({ optimizationLevel: 3 }),
      svgo({
        plugins: [
          {
            name: 'removeViewBox',
            active: false
          },
          {
            name: 'cleanupIDs',
            active: false
          }
        ]
      })
    ], {
      verbose: true
    }))
    .pipe(dest(path.build.images))
    .pipe(src(path.src.svg))
    .pipe(dest(path.build.images))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}images/`))
    .pipe(browserSync.stream())
}
function fonts() {
  return src(path.src.fonts)
    .pipe(plumber(
      notify.onError({
        title: "FONTS",
        message: "Error: <%= error.message %>"
      })))
    .pipe(dest(path.build.fonts))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}fonts/`))
    .pipe(browserSync.stream())
}
function files() {
  return src(path.src.files)
    .pipe(plumber(
      notify.onError({
        title: "FILES",
        message: "Error: <%= error.message %>"
      })))
    .pipe(dest(path.build.files))
  // Раскомментировать, если нужно добавлять в папку assets/template
  // .pipe(dest(`${pathModxTemplate}fonts/`))
}
function sprite() {
  return src(path.src.svgicons)
    .pipe(plumber(
      notify.onError({
        title: "SVG",
        message: "Error: <%= error.message %>"
      })))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: '../icons/icons.svg',
          // example: true
        }
      },
      shape: {
        id: {
          separator: '',
          generator: 'svg-'
        },
        transform: [
          {
            svgo: {
              plugins: [
                { removeXMLNS: true },
                { convertPathData: false },
                { removeViewBox: false },
                { cleanupIDs: false },
                { removeComments: true },
                { removeEmptyAttrs: true },
                { removeEmptyText: true },
                { collapseGroups: true },
                { convertPathData: false },
                { removeAttrs: { attrs: '(fill|stroke)' } }
              ]
            }
          }
        ]
      },
      svg: {
        rootAttributes: {
          style: 'display: none;',
          'aria-hidden': true
        },
        xmlDeclaration: false
      }
    }))
    .pipe(dest(path.build.images))
    // Раскомментировать, если нужно добавлять в папку assets/template
    // .pipe(dest(`${pathModxTemplate}images/`))
    .pipe(browserSync.stream())
  // .pipe(dest(`${srcFolder}/images/`))
}
async function cleandist() {
  del([path.clean], { force: true })
}
function startwatch() {
  gulpWatch([path.watch.pug], { usePolling: true }, buildPug)
  gulpWatch([path.watch.scss], { usePolling: true }, styles)
  gulpWatch([path.watch.js], { usePolling: true }, scripts)
  gulpWatch([path.watch.images], { usePolling: true }, images)
  gulpWatch([path.watch.fonts], { usePolling: true }, fonts)
  gulpWatch([path.watch.svgicons], { usePolling: true }, sprite)
  gulpWatch([`${buildFolder}/**/*.*`], { usePolling: true }).on('change', browserSync.reload)
  // gulpWatch([`${srcFolder}/images/**/*.png`], { usePolling: true }).on('unlink', function (filePath) {
  //   let filePathFromSrc = pkg.path.relative(pkg.path.resolve('app'), filePath)
  //   let destFilePath = pkg.path.resolve('dist', filePathFromSrc)
  //   del.sync(destFilePath)
  // })
}
function zip() {
  del(`./${path.rootFolder}.zip`);
  return src(`${path.buildFolder}/**/*.*`, {})
    .pipe(plumber(
      notify.onError({
        title: "ZIP",
        message: "Error: <%= error.message %>"
      }))
    )
    .pipe(zipPlugin(`${path.rootFolder}.zip`))
    .pipe(dest('./'));
}
function ftp() {
  configFTP.log = util.log;
  const ftpConnect = vinylFTP.create(configFTP);
  return src(`${path.buildFolder}/**/*.*`, {})
    .pipe(plumber(
      notify.onError({
        title: "FTP",
        message: "Error: <%= error.message %>"
      }))
    )
    .pipe(ftpConnect.dest(`/${path.ftp}/${path.rootFolder}`));
}
const build = series(cleandist, parallel(images, scripts, buildPug, styles, sprite, fonts, files))
const watch = series(parallel(images, scripts, buildPug, styles, fonts, sprite, files), parallel(browsersync, startwatch))

const deployFTP = series(build, ftp);
const deployZIP = series(build, zip);

export { build, watch, zip, ftp, cleandist }

export { deployFTP }
export { deployZIP }

export default watch;