
var PATH_TO_SONG;

var pedal = false;
var _killTimer = 1000;
var midi = [];
var noteNumber = 0;
var noteOnNumber = 0;
var anyBuffer;
var playTime = 0;
var circlePos = 0;
var midiFile;
var renderer = PIXI.autoDetectRenderer(1200, 600, { antialias: false });
renderer.backgroundColor = 0x00003f;
var stage = new PIXI.Container();
stage.interactive = true;
var graphics = [];
var filters = [];
var tweening = false;
var _notes = [];
var bgCircles = [];
var blurImg = new PIXI.Texture.fromImage('./blur.png');
var midiOn = [];
var circleOffset = {x:0};
for(var i=0;i<128;i++) {

  graphics[i] = new PIXI.Graphics();
  graphics[i].lineStyle(0);
  graphics[i].beginFill(0x00f000, 0.5);
  graphics[i].drawCircle(470, 90,i/1.5);
  graphics[i].endFill();

}
var circles = [];
animate();
function animate() {
  renderer.render(stage);
  requestAnimationFrame(animate);
}

function start() {

  document.body.appendChild(renderer.view);

  PATH_TO_SONG = './music/'+getParameterByName('song')+'.mid';

  var client = new XMLHttpRequest();
  client.open('GET', PATH_TO_SONG, true);
  client.responseType = 'arraybuffer';
  client.onreadystatechange = function(m) {
    anyBuffer = this.response;
    // console.log(m);
    loaded()
  }
  client.send();

}
function loaded() {

  midiFile = new MIDIFile(anyBuffer);
  var events = midiFile.getMidiEvents();
  stage.filters = [new PIXI.filters.ShockwaveFilter()];
  //console.log(events);
  events = parseMidiEvents(events);
  console.dir(midiOn);
  window.onkeydown = nextNote;
  Mousetrap.bind('space', clearNotes, 'keydown');
  Mousetrap.bind('space', pedalUp, 'keyup');
  var ctx = MIDI.getContext();
  ctx.tunajs = new Tuna(ctx);
  for(var i=0;i<9;i++) {

    var circle = new PIXI.Sprite(blurImg);
    circle.x = i*160;
    circle.playTime = i*160;
    circle.y = Math.floor(Math.random()*600);
    // console.log(circle.x, circle.y);
    var scale = Math.floor(Math.random()*1.5)+1;
    circle.anchor.x = 0.5;
    circle.anchor.y = 0.5;
    circle.scale.x = scale;
    circle.scale.y = scale;
    bgCircles.push(circle);
    stage.addChild(circle);

  }
  for(var i=0;i<200;i++) {

    var size = Math.floor(midiOn[i].param2 / 2);

    if(size < 10) size = 10;

    var filter = new PIXI.filters.ShockwaveFilter();

    circles[i] = new PIXI.Sprite(graphics[size].generateTexture());
    circles[i].x = Math.floor(midiOn[i].playTime/1.5);
    circles[i].y = Math.floor(Math.min(600, Math.max(0, 600-midiOn[i].param1*5)));
    circles[i].playTime = midiOn[i].playTime/1.5;
    circles[i].noteNumber = i;
    circles[i].anchor = new PIXI.Point(.5, .5);
    circles[i].shockwave = filter;
    stage.addChild(circles[i]);

  }

}
function parseMidiEvents(events) {
  var _events;
  _events = getNoteOnEvents(events);
  _events = parseNoteOnEvents(_events);
  return _events;
}
function getNoteOnEvents(events) {
  var _events = [];
  var _midiOn = [];
  for(var i=0;i<events.length;i++) {
    if(events[i].type == 8 && (events[i].subtype == 9 || events[i].subtype == 8)) {
      _events.push(events[i]);
    }
    if(events[i].type == 8 && events[i].subtype == 9) {

      _midiOn.push(events[i]);

    }
  }
  var _ms = 0;
  for(var i=0;i<_midiOn.length;i++) {
      if(_midiOn[i].playTime >= (_ms + 100) || _midiOn[i].playTime <= (_ms - 100)) {
        _ms = _midiOn[i].playTime;
        var event = _midiOn[i];
        event.chordOff = true;
        midiOn.push(event);
      }
      else {
        var event = _midiOn[i];
        event.chordOff = false;
        midiOn.push(event);
      }
  }
  return _events
}
function parseNoteOnEvents(events) {
  var _ms = 0;
  for(var i=0;i<events.length;i++) {
    if(events[i].subtype == 9) {
      if(events[i].playTime >= (_ms + 10) || events[i].playTime <= (_ms - 10)) {
        _ms = events[i].playTime;
        var event = events[i];
        event.chordOff = true;
        midi.push(event);
      }
      else {
        var event = events[i];
        event.chordOff = false;
        midi.push(event);
      }
    }
    else {
      midi.push(events[i]);
    }
  }
  return midi;
}
function nextNote() {

  // for(var i=0;i<200;i++) {
  //
  //   circles[i].scale = new PIXI.Point(1.2, 1.2);
  //   TweenLite.to(circles[i].scale, .5, {x:1, y:1});
  //
  // }
  if(_notes.length > 0) {
    for(var i=0;i<_notes.length;i++) {
      for(var j=0;j<_notes.length;j++) {
        if(_notes[i] - _notes[j] < 2 && _notes[i] - _notes[j] > -2 && _notes[i] - _notes[j] != 0 && i != j) {
          clearNotes();
          _notes = [];
        }
      }
    }
  }

  _killTimer = 1000;
  var power = 0;
  while(true) {

    var j = Math.max(noteNumber + 50, circles.length);

    //console.log(noteNumber);
    //console.log(noteOnNumber);
    if(noteOnNumber >= midiOn.length) {

      finish();
      return;

    }
    //if(getNextNoteOn(noteNumber) == undefined) return;
    if(midi[noteNumber] != undefined && midi[noteNumber].subtype == 9) {
      if(getNextNoteOn(noteNumber) != null && getNextNoteOn(noteNumber).chordOff) {
        //_notes.push(midi[noteNumber].param1);
        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2/2);
        playTime = getNextNoteOn(noteNumber).playTime/1.5;

        TweenLite.killTweensOf(circleOffset);
        tweening = true;
        TweenLite.to(circleOffset, 1, {x:playTime-150, onComplete:stopTweening});

        for(var i=0;i<circles.length;i++) {

          if(circles[i] == null);

          else {

          // TweenLite.to(circles[i], 1, {x:circles[i].playTime-(playTime-150)});

          if(circles[i].noteNumber == noteOnNumber) {

            var j = noteOnNumber+200;

            if(j > midiOn.length-1) {

              stage.removeChild(circles[i]);
              circles.splice(i, 1);
              //console.log(j);

            }

            else {

              stage.removeChild(circles[i]);

              var size = Math.floor(midiOn[j].param2 / 2);

              if(size < 10) size = 10;
              power += midiOn[circles[i].noteNumber].param2/3000;
              if(midiOn[circles[i].noteNumber].param2 < 55) power = 0.035;
              var shockwave = new PIXI.filters.ShockwaveFilter();
              console.log(power);
              shockwave.params = {x:10,y:0.8,z:power};
              shockwave.time = 0;
              shockwave.center = {x:circles[i].x/1200, y:circles[i].y/600};
              circles[i] = new PIXI.Sprite(graphics[size].generateTexture());
              TweenLite.to(shockwave, 2, {time:1, onComplete:remFilter, onCompleteParams:[shockwave]});
              TweenLite.to(shockwave.params, .5, {x:0,y:0,z:0})
              circles[i].x = Math.floor(midiOn[j].playTime/1.5);
              circles[i].y = Math.floor(Math.min(600, Math.max(0, 600-midiOn[j].param1*5)));
              circles[i].playTime = midiOn[j].playTime/1.5;
              circles[i].noteNumber = j;
              circles[i].anchor = new PIXI.Point(.5, .5);
              stage.addChild(circles[i]);
              if(filters.length < 2)filters.push(shockwave);
              stage.filters = filters;

            }

          }

        }

        }
        noteNumber++;
        noteOnNumber++;
        return;
      }
      else {
        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2/2);
        //_notes.push(midi[noteNumber].param1);

        for(var i=0;i<circles.length;i++) {

            // TweenLite.to(circles[i], 1, {x:circles[i].playTime-playTime});

            if(circles[i] != null && circles[i].noteNumber == noteOnNumber) {

              var j = noteOnNumber+200;

              if(midiOn[j] == undefined) {

                stage.removeChild(circles[i]);
                circles.splice(i, 1);

              }

              else {

                stage.removeChild(circles[i]);

                var size = Math.floor(midiOn[j].param2 / 2);

                if(size < 10) size = 10;

                circles[i] = new PIXI.Sprite(graphics[size].generateTexture());
                //console.log(i, j);
                power += midi[noteNumber].param2/3000;
                circles[i].x = Math.floor(midiOn[j].playTime/1.5);
                circles[i].y = Math.floor(Math.min(600, Math.max(0, 600-midiOn[j].param1*5)));
                circles[i].playTime = midiOn[j].playTime/1.5;
                circles[i].noteNumber = j;
                circles[i].shockwave = new PIXI.filters.ShockwaveFilter();
                circles[i].anchor = new PIXI.Point(.5, .5);
                stage.addChild(circles[i]);

              }

            }

        }
        noteOnNumber++;
      }
    }
    else {
      if(midi[noteNumber] != undefined && midi[noteNumber].subtype == 8) {
        _notes.push(midi[noteNumber].param1);
      }
    }
    noteNumber++;
  }
}
function remFilter(obj)  {

  // console.log(stage.filters.length);

}
function stopTweening() {

  tweening = false;
  TweenLite.killTweensOf(circleOffset);

}
setInterval(function() {

  if(!tweening) return;

  for(var i=0;i<filters.length;i++) {

    if(filters[i].time >= 0.25) {

      filters.splice(i, 1);

    }

  }

  for(var i=0;i<bgCircles.length;i++) {

    if(bgCircles[i].x <= -100) {

      bgCircles[i].x += 1400;
      bgCircles[i].playTime += 1400;

    }

  }

  for(var i=0;i<bgCircles.length;i++) {

    bgCircles[i].x = Math.floor(bgCircles[i].playTime - Math.floor(circleOffset.x/3));

  }

  if(filters.length > 0)stage.filters = filters;
  else stage.filters = null;

  for(var i=0;i<circles.length;i++) {

    circles[i].x = Math.floor(circles[i].playTime - circleOffset.x);
    circles[i].x = Math.floor(circles[i].x);
    circles[i].y = Math.floor(circles[i].y);

  }

}, 25);
function pedalDown() {
  pedal = true;
}
function pedalUp() {
  pedal = false;
}
function clearNotes() {
  if(pedal) return;
  for(var i=0;i<_notes.length;i++) {
    MIDI.noteOff(0, _notes[i], 0);
  }
}
function finish() {

  setTimeout(function(){window.location.href='../'}, 2500);

}
function getNextNoteOn(noteNumber) {
  var n = noteNumber;
  while(true) {
    n++;
    if(n > (noteNumber+127)) return null;
    if(midi[n] != null && midi[n].subtype == 9) return midi[n];
  }
}
function str2ab(str) {
var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
var bufView = new Uint16Array(buf);
for (var i=0, strLen=str.length; i<strLen; i++) {
  bufView[i] = str.charCodeAt(i);
}
return buf;
}
