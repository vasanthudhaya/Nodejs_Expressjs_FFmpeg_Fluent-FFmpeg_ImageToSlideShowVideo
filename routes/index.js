var express = require('express');
var fs = require('fs');
var fse = require('fs-extra');
var router = express.Router();
var multiparty = require('multiparty');
var ffmpeg = require('fluent-ffmpeg');
const path = require('path');
var Jimp = require('jimp');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Image To Video' });
});

router.post('/', async function (req, res, next) {
  try {
    fs.readdirSync('video/').forEach(file => {
      if (file.includes('.png') || file.includes('.mp4')) {
        fs.unlinkSync(path.join('video/', file), err => {
        });
      }
    })
    var form = new multiparty.Form();
    form.parse(req, async function (err, fields, files) {
      let startimage = new Jimp(1280, 720, 'white', (err, image) => {
        //if (err) throw err
      })
      let startmessage = fields.start[0];
      let startmessagex = 100
      let startmessagey = 100

      await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
        .then(font => {
          startimage.print(font, startmessagex, startmessagey, startmessage)
          return startimage
        }).then(startimage => {
          let file = `video/start.png`
          return startimage.write(file) // save
        });
      let endimage = new Jimp(1280, 720, 'white', (err, image) => {
        if (err) throw err
      })
      let endmessage = fields.end[0];
      let endmessagex = 100
      let endmessagey = 100
      await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
        .then(font => {
          endimage.print(font, endmessagex, endmessagey, endmessage)
          return endimage
        }).then(endimage => {
          let file = `video/end.png`
          return endimage.write(file) // save
        });
      let slidesimage = new Jimp(1280, 200, 'white', (err, image) => {
        if (err) throw err
      })
      let slidesmessage = fields.imgtext[0];
      let slidesmessagex = 10
      let slidesmessagey = 10

      await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
        .then(font => {
          slidesimage.print(font, slidesmessagex, slidesmessagey, slidesmessage)
          return slidesimage
        }).then(slidesimage => {
          let file = `video/slidesimage.png`
          return slidesimage.write(file) // save
        });
      // var logosource = fs.createReadStream(files.logo[0].path);
      // var logodestination = fs.createWriteStream("video/logo.png");
      // logosource.pipe(logodestination, { end: false });
      // logosource.on("end", function () {
      //   fs.unlinkSync(files.logo[0].path);
      // });
      fse.moveSync(files.logo[0].path, "video/logo.png", { overwrite: true })

      var i = 1;
      files.images.forEach(element => {
        fse.moveSync(element.path, "video/img" + i + ".png", { overwrite: true })

        // source = fs.createReadStream(element.path);
        //   destination = fs.createWriteStream("video/img" + i + ".png");
        // source.pipe(destination, { end: false });
        // source.on("end", function () {
        //   fs.unlinkSync(element.path);
        // });
        i++;
      });

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
      complexfilter.push("[" + (index + 3) + ":v]scale=1280:720,loop=50:size=1000:start=0,setsar=1 [start]");
      complexfilter.push("[" + (index + 4) + ":v]scale=1280:720,loop=50:size=1000:start=0,setsar=1 [end]");
      complexfilter.push("[start][logoandtextoverlayed][end]concat=n=3:v=1:a=0[finalvideo]");
      proc.complexFilter(complexfilter)
      proc.outputOption(["-map [finalvideo]", "-map " + index + ":a", '-shortest','-vcodec libx264','-crf 27','-preset veryfast', '-s 1280x720', '-t 40'])
        .output('video/out.mp4')
        .on('start', function (ffmpegCommand) {
          console.log(ffmpegCommand)
        })
        .on('progress', function (data) {
          //console.log(data)
        })
        .on('end', function () {
          console.log('end');
          res.render('index', { title: 'Image To Video' });
        })
        .on('error', function (error) {
          console.log('error')
          console.log(error);
          res.send({ message: 'some error' });
        })
        .run();
    })
  } catch
  {
    res.send({ message: 'some error' });
  }
});


module.exports = router;
