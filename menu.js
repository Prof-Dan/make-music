window.onload = function () {
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instrument: "acoustic_grand_piano",
    onprogress: function(state, progress) {
      console.log(state, progress);
    },
    onsuccess: function() {
      console.log('loaded')
      if(getParameterByName('song') == '')displayMenu();
      else start();
    }
  });
};

var songs = ['Moonlight_sonata', 'chopin_nocturne_20', 'lesorages', 'raindrop'];

function displayMenu() {

  for(var i=0;i<songs.length;i++) {

    var a = document.createElement('a');
    var linkText = document.createTextNode(songs[i]);
    a.appendChild(linkText);
    a.title = songs[i];
    a.href = "./?song="+songs[i];
    document.body.appendChild(a);

    document.body.appendChild(document.createElement('br'));

  }

}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}