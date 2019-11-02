var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('video'));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
async function test() {
  var totalslideimages = 0;
  var proc = new ffmpeg();
  fs.readdirSync('video/').forEach(file => {
    if (file.includes('img')) {
      totalslideimages++;
      proc.addInput("video/" + file).addInputOption("-t 5");
    }
  });
  proc.addInput("video/music.mp3").addInput("video/logo.png").addInput("video/slidesimage.png").addInput("video/start.png").addInput("video/end.png")
  var complexfilter = [];
  let index;
  var slidesconcatination = ""
  for (index = 0; index < totalslideimages; index++) {
    var sliderfilter = "[" + index + ":v]zoompan=z='if(lte(zoom,1.0),1.1,max(1.001,zoom-0.0015))':d=125,fade=t=out:st=4:d=1[v" + index + "]"
    complexfilter.push(sliderfilter);
    slidesconcatination += "[v" + index + "]"
  }
  complexfilter.push(slidesconcatination + "concat=n=" + index + ":v=1:a=0,format=yuv420p[slidesmergedvideo]");
  complexfilter.push("[slidesmergedvideo][" + (index + 1) + ":0] overlay=x=10:y=10 [logooverlayed]");
  complexfilter.push("[logooverlayed][" + (index + 2) + ":0] overlay=x=0:y=H-100 [logoandtextoverlayed]");
  complexfilter.push("[" + (index + 3) + ":v]scale=1280:720,loop=100:size=1000:start=0,setsar=1 [start]");
  complexfilter.push("[" + (index + 4) + ":v]scale=1280:720,loop=100:size=1000:start=0,setsar=1 [end]");
  complexfilter.push("[start][logoandtextoverlayed][end]concat=n=3:v=1:a=0[finalvideo]");
  proc.complexFilter(complexfilter)
  proc.outputOption(["-map [finalvideo]", "-map " + index + ":a", '-shortest', '-s 1280x720', '-t 40'])
    .output('video/out.mp4')
    .on('start', function (ffmpegCommand) {
      console.log(ffmpegCommand)
    })
    .on('progress', function (data) {
      console.log(data)
    })
    .on('end', function () {
      console.log('end')
    })
    .on('error', function (error) {
      console.log('error')
      console.log(error)
    })
    .run();
}
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
