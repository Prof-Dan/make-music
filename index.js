var pedal = false;

var _killTimer = 1000;

var midi = [];

var noteNumber = 0;

var anyBuffer;

var midiFile;

var client = new XMLHttpRequest();
client.open('GET', '/music/Moonlight_sonata.mid', true);
client.responseType = 'arraybuffer';
client.onreadystatechange = function() {

  anyBuffer = this.response;

}
client.send();

window.onload = function () {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instrument: "acoustic_grand_piano",
    onprogress: function(state, progress) {
      console.log(state, progress);
    },
    onsuccess: function() {
      console.log('loaded')
      midiFile = new MIDIFile(anyBuffer);
      loaded();
    }
  });

};

function loaded() {

  var events = midiFile.getMidiEvents();

  events = parseMidiEvents(events);

  console.dir(midi);

  window.onkeydown = nextNote;
  Mousetrap.bind('space', clearNotes, 'keydown');
  Mousetrap.bind('space', pedalUp, 'keyup');

  var ctx = MIDI.getContext();
  ctx.tunajs = new Tuna(ctx);

  MIDI.setEffects([{
      type: "Filter",
      frequency: 1000, // 20 to 22050
      Q: 0, // 0.001 to 100
      gain: -1, // -40 to 40
      bypass: 0, // 0 to 1+
      filterType: 'lowpass' // 0 to 7, corresponds to the filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
  }]);

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

        //console.log('chordoff');

        var event = events[i];
        event.chordOff = true;
        midi.push(event);

      }

      else {
        //console.log(_ms, events[i].playTime);
        var event = events[i];
        event.chordOff = false;
        midi.push(event);

      }

    }

    else {
      //console.log(events[i]);
      midi.push(events[i]);

    }

  }

  return midi;

}

function nextNote() {

  _killTimer = 1000;

  while(true) {

    if(midi[noteNumber].subtype == 9) {

      if(getNextNoteOn().chordOff) {

        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2, 0);

        noteNumber++;

        return;

      }

      else {

        //clearNotes();

        MIDI.noteOn(0, midi[noteNumber].param1, midi[noteNumber].param2, 0);

      }

    }

    else {

      MIDI.noteOff(0, midi[noteNumber].param1, 0);

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

    clearNotes();

  }

}, 10);

function clearNotes() {

  if(pedal) return;

  for(var i=0;i<100;i++) {

    MIDI.noteOff(0, i, 0)

  }

}

function getNextNoteOn() {

  var n = noteNumber;

  while(true) {

    n++;

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
