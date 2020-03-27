var gulp = require('gulp');

var path = require('path');

var fs = require('fs');

var clean = require('gulp-clean');

var browserify = require('browserify');

var buffer = require('vinyl-buffer');

var babelify = require('babelify');

var babel = require('gulp-babel');

var source = require('vinyl-source-stream');

var sourcemaps = require('gulp-sourcemaps');

var streamify = require('gulp-streamify');

var uglify = require('gulp-uglify');

var include = require('gulp-include');

var rename = require('gulp-rename');

var replace = require('gulp-replace');

var watchify = require('watchify');

var connect = require('gulp-connect');


var watch = require("gulp-watch");
/**压缩css */
var cleanCss = require('gulp-clean-css');

/**处理less */

var rev = require('gulp-hash-src');

var less = require('gulp-less');

var Proxy = require('http-proxy-middleware');

const {getPath} = require('./utils');

var proxyConfigArray = require(getPath('./proxy.conf.json'));

var basePath = process.env.ENTRY_PATH;

var filePath = fs.readdirSync(getPath('/src'));

var pathArr = [];

var environment = process.argv.slice(2)[0];

var portFlag = 8088;

const distDir = getPath('dist/');
// if(process.argv.slice(2)[1]){
//     portFlag = (process.argv.slice(2)[1]).replace(/^--/,'')
// }
/**打包js */
filePath = filePath.filter(function(item){
    return item !=='common';
})

filePath.forEach(function(val){
    var jsFilePath  = fs.readdirSync(getPath('./src/'+val+'/js/pages'));
    jsFilePath.forEach(function(value){
        if( value.indexOf('.') > -1 ){
            pathArr.push('./src/'+val+'/js/pages/'+value)
        }
    })
});


let byTaskers = [];
pathArr.forEach(function(path, index) {
    const params = Object.assign({}, watchify.args, {
        entries: getPath(path),
        debug: true
    });
    const b = watchify(browserify(params));
    const sourcePath = path.replace(/^\.\/src\//,'');
    const run = (function(b, sourcePath) {
        return function() {
            return b.transform(babelify,{
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            "corejs": "2",
                            "useBuiltIns": "usage"
                        }
                    ]
                ]
            })
            .bundle()
            .pipe(source(sourcePath))
            .pipe(buffer())
            .pipe(sourcemaps.init())
            .pipe(gulp.dest(distDir))
            .pipe(streamify(uglify()))
            .pipe(sourcemaps.write('_srcmap'))
            .pipe(gulp.dest(distDir))
        }
    })(b, sourcePath);
    byTaskers.push({
        b,
        sourcePath,
        run
    });
})
gulp.task('browserify', function() {
    byTaskers.forEach(tasker => {
        tasker.run()
        // 添加watch的监听
        tasker.b.on('update', (ids) => {
            tasker.run().on('end', () => {
                console.log('Finish watchify:' + tasker.sourcePath);
                htmlDev();
            })
        });
    });
});

gulp.task('browserify-build', async function() {
    for (let i = 0; i < pathArr.length; i ++) {
        const path = pathArr[i];
        const index = i;
        const params = Object.assign({}, watchify.args, {
            entries:path,
            debug: true
        });
        const sourcePath = path.replace(/^\.\/src\//,'');
        await browserify(params).transform(babelify,{
            presets: [
                [
                    "@babel/preset-env",
                    {
                        "corejs": "2",
                        "useBuiltIns": "usage"
                    }
                ]
            ]
        })
        .bundle()
        .pipe(source(sourcePath))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(gulp.dest(distDir))
        .pipe(streamify(uglify()))
        .pipe(sourcemaps.write('_srcmap'))
        .pipe(gulp.dest(distDir))
    }
});

/**负责项目html */
function htmlDev () {
    return gulp.src(
            [getPath('./src/**/html/*.html'),'!' + getPath('./src/**/html/common/*.html')],
            {base: getPath('src')}
        )
        .pipe(include())
        // .pipe(rev({ build_dir: getPath("./dist/**/html/*.html"), src_path: getPath("./src/**/html/*.html"), exts: ['.js', '.css'] }))
        .pipe(gulp.dest(distDir))
}
gulp.task('html_dev', function(){
    return htmlDev();
});

/**公共js插件 */
gulp.task('copyjs_dev', function(){
    return gulp.src(
        [getPath('./src/**/js/lib/**/*'),'!' + getPath('./src/**/js/lib/**/*.md')],
        {base: getPath('src')}
    )
    .pipe(gulp.dest(distDir));
});



/** 公共js config*/
gulp.task('config_dev', function(){
    return gulp.src([getPath('./src/common/js/public/config.src.js')],{base: getPath('src')})
    .pipe(rename(function(path){
        return {
            dirname: path.dirname,
            basename: "config",
            extname: ".js"
        };
    }))
    .pipe(replace('$gulpkey$', environment))
    .pipe(gulp.dest(distDir))
});

/**公用js util */
gulp.task('util_dev', function(){
    return gulp.src(getPath('./src/common/js/public/util.js'), {base: getPath('src')})
        .pipe(babel({
            presets: ["@babel/preset-env"]
         }))
        .pipe(sourcemaps.init())
        .pipe(streamify(uglify()))
        .pipe(sourcemaps.write('_srcmap'))
        .pipe(gulp.dest(distDir))
 });
 
/**图片 */
gulp.task('img_dev', function(){
    return gulp.src(getPath('./src/**/images/**'),{base: getPath('src')})
    .pipe(gulp.dest(distDir))
})

/**项目中的css */
gulp.task('css_dev', function(){
    return gulp.src(getPath('./src/*/css/**/*.css'),{base: getPath('src')})
    .pipe(cleanCss())
    .pipe(gulp.dest(distDir))
});

/**项目中的less */
gulp.task('less_dev', function(){
    return gulp.src(getPath('./src/**/css/*.less'),{base: getPath('src')})
    .pipe(less())
    .pipe(gulp.dest(distDir))
});

/**共用css */
gulp.task('common_css', function(){
    return gulp.src(getPath('./src/common/css/*.css'),{base: getPath('src')})
    .pipe(cleanCss())
    .pipe(gulp.dest(distDir))
});

/**共用images */
gulp.task('common_images', function(){
    return gulp.src(getPath('./src/common/images/**/*'),{base: getPath('src')})
    .pipe(cleanCss())
    .pipe(gulp.dest(distDir))
});


gulp.task('clean', function () {
    return gulp.src([getPath('dist')], { read: false, allowEmpty: true })
        .pipe(clean({force: true}));
});

gulp.task('connect',function(){
    return connect.server({
        // root: getPath('/dist'),//根目录
        root: distDir,
       // livereload:true, //自动更新
        port: portFlag, //端口
        middleware: function(connect, opt) {
            return proxyConfigArray.map(function(setting){
                return Proxy.createProxyMiddleware(setting["path"],setting["opt"]);
            })
        }
    })
});



gulp.task('watchs', function(){
    watch([getPath('./src/**/html/**/*.html')], gulp.series('html_dev'));
    watch([getPath('./src/common/js/lib/**/*')], gulp.series(gulp.parallel('copyjs_dev','html_dev'))); 
    watch([getPath('./src/common/js/public/config.src.js')],  gulp.series(gulp.parallel('config_dev','html_dev')));  
    watch([getPath('./src/common/js/public/util.js')], gulp.series(gulp.parallel('util_dev','html_dev')));
    watch([getPath('./src/**/images/**')], gulp.series('img_dev'));
    watch([getPath('./src/common/images/**/*')], gulp.series('common_images'));
    watch([getPath('./src/**/css/**/*.css')], gulp.series(gulp.parallel('css_dev','html_dev')));  
    watch([getPath('./src/**/css/*.less')], gulp.series(gulp.parallel('less_dev','html_dev')));
    watch([getPath('./src/common/css/*.css')], gulp.series(gulp.parallel('common_css','html_dev')));
    
});

gulp.task(
    'dev',
    gulp.series(
        // 'clean',
        gulp.parallel([
            'connect',
            'html_dev',
            'common_css',
            'common_images',
            'copyjs_dev',

            'browserify',
            'config_dev',
            'img_dev',
            'css_dev',
            'less_dev',
            'util_dev',
            'watchs'
        ])
    )
);

gulp.task('test', gulp.series('clean', gulp.parallel(['html_dev','common_css','common_images','copyjs_dev','browserify-build','config_dev', 'img_dev','css_dev', 'less_dev','util_dev'])));

gulp.task('beta', gulp.series('clean', gulp.parallel('html_dev','common_css','common_images','copyjs_dev','browserify-build','config_dev', 'img_dev','css_dev', 'less_dev','util_dev')));

gulp.task('prod', gulp.series('clean', gulp.parallel('html_dev','common_css','common_images','copyjs_dev','browserify-build','config_dev', 'img_dev','css_dev', 'less_dev','util_dev')));



