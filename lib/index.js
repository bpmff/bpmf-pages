// 本示例安装了 Bootstrap 在 node_modules 下
const { src, dest, parallel, series, watch } = require('gulp')

// 清理模块
const del = require('del')
// 热更新服务器
const browserSync = require('browser-sync')

// 导出的是一个方法
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins();
// 然后就可以通过 plugins.模块名称的方式 不用 每个都 require了
// 如果遇到有两个 - 的 转换为驼峰命名法

// 创建一个 开发服务器
const bs = browserSync.create()

// 返回 当前命令行所在的工作目录
const cwd = process.cwd()
let config = {
  // 默认配置
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig)
} catch (error) {
}


// // 编译sass文件的插件  gulp-sass
// const sass = require('gulp-sass')
// // 编译js脚本
// const babel = require('gulp-babel')
// // 编译页面
// const swig = require('gulp-swig')
// 压缩图片和字体
// const imagemin = require('gulp-imagemin')

// const useref  = require('gulp-useref');

// const if  = require('gulp-if');

// // 原理的模板用到一些数据标记
// // 数据标记把网页开发过程中有可能发生变化的地方 提取数据
// // 这些数据 需要在模板引擎工作时通过选项去指定
// // 根据需求放数据 
// const data = {
//   menus: [
//     {
//       name: 'Home',
//       icon: 'aperture',
//       link: 'index.html'
//     },
//     {
//       name: 'Features',
//       link: 'features.html'
//     },
//     {
//       name: 'About',
//       link: 'about.html'
//     },
//     {
//       name: 'Contact',
//       link: '#',
//       children: [
//         {
//           name: 'Twitter',
//           link: 'https://twitter.com/w_zce'
//         },
//         {
//           name: 'About',
//           link: 'https://weibo.com/zceme'
//         },
//         {
//           name: 'divider'
//         },
//         {
//           name: 'About',
//           link: 'https://github.com/zce'
//         }
//       ]
//     }
//   ],
//   pkg: require('./package.json'),
//   date: new Date()
// }


// 清除任务
const clean = () => {
  // temp 临时目录
  return del([config.build.dist, config.build.temp])
}

// 编译样式 scss
const style = () => {
  // base  基准路径   cwd 从那个目录开始找
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass())
    // 一般来说 编译后的结果放到 dist中 但是因为需要其他操作并不是最终的压缩过文件
    // 所以要放到临时文件夹中 temp
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 编译脚本 转换ES6+的语法
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    // presets-env 虽有特性整体打包  会把所以特性全部转换
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 编译使用了 swig模板引擎的网页
const page = () => {
  // 双星** 代表 src下任意子目录的通配方式
  // return src('src/**/*.html')
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    // .pipe(plugins.swig({ data }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
// 压缩图片
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    // .pipe(imagemin())
    .pipe(dest(config.build.dist))
}
// 压缩字体
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    // .pipe(imagemin())
    .pipe(dest(config.build.dist))
}
// 其他文件
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.public }, style)
  watch(config.build.paths.scripts, { cwd: config.build.public }, script)
  watch(config.build.paths.pages, { cwd: config.build.public }, page)
  // 现在监听图片和 字体没有意义 在打包发布的时候执行就可以
  // watch('src/assets/images/**', image)
  // watch('src/assets/font/**', font)
  // watch('public/**', extra)
  // end
  // 发生变化 自动更新浏览器
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)

  watch([
    '**'
  ], { cwd: config.build.public }, bs.reload)

  // 初始化
  bs.init({
    // 提示
    notify: false,
    // 端口
    port: 2080,
    // 是否自动打开浏览器
    // open: false,

    // 监听 那些路径改变后自动更新浏览器
    // 常见方式 是在 任务后 加入 .pipe(bs.reload({ stream: true }))
    // files: 'dist/**',
    server: {
      // 网站根目录
      // baseDir: 'dist',
      // 数组特点 如果找不到就依次往后找
      // 提高构建效率
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      // 特殊路由 先执行
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}
// 把 引入的资源 打包
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    // 转换流  searchPath 找到这些文件
    // 对于 assets 中的文件 在 dist 中找
    // 对于 node_modules中的文件 在根目录找
    // 使用的更多的情况 放在前面
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // 分别做不同的操作 需要判断一下
    // js
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    // css
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    //html  html 压缩需要特殊的配置collapseWhitespace  样式压缩minifyCSS  js压缩minifyJS
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
    })))

    .pipe(dest(config.build.dist))
}

// parallel 同时执行
const compile = parallel(style, script, page);

// series同步执行 build 上线前执行的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra))

// 开发过程中执行的任务
const develop = series(compile, serve)

// 导出
module.exports = {
  clean,
  build,
  develop,
}