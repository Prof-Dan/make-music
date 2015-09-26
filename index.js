
var PATH_TO_SONG;

var pedal = false;
var _killTimer = 1000;
var midi = [];
var noteNumber = 0;
var anyBuffer;
var playTime = 0;
var circlePos = 0;
var midiFile;
var renderer = PIXI.autoDetectRenderer(1200, 600, { antialias: true });
var stage = new PIXI.Container();
stage.interactive = true;
var graphics = [];
var _notes = [];
for(var i=0;i<128;i++) {

  graphics[i] = new PIXI.Graphics();
  graphics[i].lineStyle(0);
  graphics[i].beginFill(0xFFFF0B, 0.5);
  graphics[i].drawCircle(470, 90,i/2);
  graphics[i].endFill();

}
var circles = [];
animate();
function animate() {
  renderer.render(stage);
  requestAnimationFrame( animate );
}

function start() {

  document.body.appendChild(renderer.view);

  PATH_TO_SONG = './music/'+getParameterByName('song')+'.mid';

  var client = new XMLHttpRequest();
  client.open('GET', PATH_TO_SONG, true);
  client.responseType = 'arraybuffer';
  client.onreadystatechange = function() {
    anyBuffer = this.response;
    loaded()
  }
  client.send();

}
function loaded() {
  midiFile = new MIDIFile(anyBuffer);
  var events = midiFile.getMidiEvents();
  console.log(events);
  events = parseMidiEvents(events);
  console.dir(midi);
  window.onkeydown = nextNote;
  Mousetrap.bind('space', clearNotes, 'keydown');
  Mousetrap.bind('space', pedalUp, 'keyup');
  var ctx = MIDI.getContext();
  ctx.tunajs = new Tuna(ctx);
  var i = 0;
  var j = 0;
  while(j<midi.length) {
    if(midi[j].subtype == 9) {
      //console.log(midi[j].param2);
      circles[i] = new PIXI.Sprite(graphics[midi[j].param2].generateTexture());
      circles[i].x = midi[j].playTime/2;
      circles[i].y = Math.min(600, Math.max(0, 600-midi[j].param1*5));
      circles[i].playTime = midi[j].playTime/2;
      circles[i].noteNumber = j;
      stage.addChild(circles[i]);
      i++;
    }
    j++;
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
  for(var i=0;i<events.length;i++) {
    if(events[i].type == 8 && (events[i].subtype == 9 || events[i].subtype == 8)) {
      _events.push(events[i]);
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

  if(_notes.length > 0) {

    for(var i=0;i<_notes.length;i++) {

      for(var j=0;j<_notes.length;j++) {

        if(_notes[i] - _notes[j] < 2 && _notes[i] - _notes[j] > -2 && _notes[i] - _notes[j] != 0 && i != j) {

          clearNotes();
          console.log(_notes);
          _notes = [];
          console.log('clear');

        }

      }

    }

  }

  _killTimer = 1000;
  while(true) {

    //console.log(noteNumber);
    if(noteNumber >= midi.length) finish();
    //if(getNextNoteOn(noteNumber) == undefined) return;
    if(midi[noteNumber] != undefined && midi[noteNumber].subtype == 9) {
      if(getNextNoteOn(noteNumber) != null && getNextNoteOn(noteNumber).chordOff) {
        //_notes.push(midi[noteNumber].param1);
        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2);
        playTime = getNextNoteOn(noteNumber).playTime/2;

        for(var i=0;i<circles.length;i++) {

          TweenMax.to(circles[i], 1, {x:circles[i].playTime-playTime});

          if(circles[i].noteNumber == noteNumber) {

            circles[i].y = 1000;

          }

        }
        noteNumber++;
        return;
      }
      else {
        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2);
        //_notes.push(midi[noteNumber].param1);
        for(var i=0;i<circles.length;i++) {

          for(var i=0;i<circles.length;i++) {

            TweenMax.to(circles[i], 1, {x:circles[i].playTime-playTime});

            if(circles[i].noteNumber == noteNumber) {

              circles[i].y = 1000;

            }

          }

        }
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
function pedalDown() {
  pedal = true;
}
function pedalUp() {
  pedal = false;
}
setInterval(function () {
  _killTimer -= 20;
  if(_killTimer <= 0 && !pedal) {
    //clearNotes();
  }
}, 10);
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
