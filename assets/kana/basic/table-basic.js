/**
 * Created by Malvina Pushkova <lady3mlnm@gmail.com>
 * Date: 2017
 */

var AR = ['a','i','u','e','o','ka','ki','ku','ke','ko','sa','shi','su','se','so','ta','chi','tsu','te','to','na','ni','nu','ne','no','ha','hi','fu','he','ho','ma','mi','mu','me','mo','ya','','yu','','yo','ra','ri','ru','re','ro','wa','','','','wo','n'],
    iAR = 0,                                      // number of current element in array AR
    dtl1 = document.getElementById('dtl1'),       // detail1, elements for exhibiting additional images
    dtl2 = document.getElementById('dtl2'),
    dtl3 = document.getElementById('dtl3'),
    vlmShow = document.getElementById('vlmShow'),  // volume Show
    btnPlay = document.getElementById('btnPlay'),  // button Play-Stop
    audioPlayer = document.getElementById('audioPlayer'), // elements for audio output
    srcMp3 = document.getElementById('srcMp3'),    // source of MP3
    srcOgg = document.getElementById('srcOgg'),
    gVoice,               // variant of voice acting, current 0, 1 and 2
    gLoops,               // number of voice repeats
    iLoops = 1,           // counter for voice repeats
    gPause,               // pause between voice acting
    gVolume,              // volume of audio, array
    gKana,                // kana type
    gCorner,              // syllable type in the left bottom corner: 'R'-romaji, 'H'-hiragana, 'K'-katakana
    firstMove = true;     // is this the first move in session

//*********************************************************
//   LOAD / UNLOAD
//*********************************************************

function fLoad() {      // Whenever possible, I tried to defend against simple errors during loading
  var j;
  if (localStorage.tb_cbHeadings == 'true')        // is table headings shown
    document.getElementById('cbHeadings').checked = true
  else
    document.getElementById('cbHeadings').checked = false;
  fChangeHeadings();

  if (localStorage.tb_cbGrid == 'false')        // is grid under detailed kana shown
    document.getElementById('cbGrid').checked = false
  else
    document.getElementById('cbGrid').checked = true;
  fChangeGrid();

  if (localStorage.tb_cbAdjacent == 'true')        // is adjacent kana shown
    document.getElementById('cbAdjacent').checked = true
  else
    document.getElementById('cbAdjacent').checked = false;
  fChangeAdjacent();

  j = Number(localStorage.tb_gVoice);                    // variant of voice acting, current 0, 1, 2, 3
  gVoice = (isNaN(j))?0:j;
  document.getElementById('rAudio'+gVoice).checked = true;
  srcMp3.src = 'audio-'+gVoice+'/a.mp3';
  srcOgg.src = 'audio-'+gVoice+'/a.ogg';
  audioPlayer.load();

  j = Number(localStorage.tb_gLoops);                    // number of voice repeats
  gLoops = (isNaN(j))?1:j;
  document.getElementById('repeatNumber').value = gLoops;

  j = Number(localStorage.tb_gPause);                    // pause between voice acting
  gPause = (isNaN(j))?800:j;
  document.getElementById('repeatPause').value = gPause/1000;

  if (localStorage.tb_gVolume !== undefined && localStorage.tb_gVolume !== 'undefined')      // volume of audio, array
    gVolume = localStorage.tb_gVolume.split(',')
  else
    gVolume = [0.5, 0.9, 0.5, 0.3];
  vlmShow.innerHTML = '( '+gVolume[gVoice]*100+'% )';
  document.getElementById('vlmRange').value = gVolume[gVoice];
  audioPlayer.volume = gVolume[gVoice];

  if (localStorage.tb_gKana == 'katakana')                                              // kana type
    gKana = 'katakana'
  else
    gKana = 'hiragana';
  document.getElementById(gKana).checked = true;
  fChangeKanaImages();

  if (localStorage.tb_gCorner == 'K' || localStorage.tb_gCorner == 'H')        // kana type
    gCorner = localStorage.tb_gCorner
  else
    gCorner = 'R';
  document.getElementById('corner'+gCorner).checked = true;
  fChangeCorner(gCorner);

  j = document.getElementById('dtl1a').getContext('2d');  // create grid under detailed kana
  j.strokeStyle = 'papayawhip';
  j.lineWidth = 2;
  j.moveTo(80,0);
  j.lineTo(80,160);
  j.stroke();
  j.moveTo(0,80);
  j.lineTo(160,80);
  j.stroke();

  document.body.addEventListener('keydown',fKeyDown,true);
}

function fUnload() {
  localStorage.setItem('tb_gVoice', gVoice);
  localStorage.setItem('tb_gLoops', gLoops);
  localStorage.setItem('tb_gPause', gPause);
  localStorage.setItem('tb_gVolume', gVolume);
  localStorage.setItem('tb_gKana', gKana);
  localStorage.setItem('tb_gCorner', gCorner);
  localStorage.setItem('tb_cbHeadings', document.getElementById('cbHeadings').checked);
  localStorage.setItem('tb_cbGrid', document.getElementById('cbGrid').checked);
  localStorage.setItem('tb_cbAdjacent', document.getElementById('cbAdjacent').checked);
}


//*********************************************************
//   CONTROL PANEL
//*********************************************************

function fChangeVoice(j) {
  gVoice = j;
  fLoadNewAudio(AR[iAR]);
  audioPlayer.volume = gVolume[gVoice];
  if (document.getElementById('repeatNumber').value != 0) {
    audioPlayer.play();
    fChangeBtnPlay('on'); }
  vlmShow.innerHTML = '( '+gVolume[gVoice]*100+'% )';
  document.getElementById('vlmRange').value = gVolume[gVoice];
}

function fChangeKana(j) {
  gKana = j;
  fChangeKanaImages()
}

function fChangeRepeat(j) {
  gLoops = j;
}

function fChangePause(j) {
  gPause = j*1000;
}

function fChangeVolume(j) {
  audioPlayer.volume = j;
  vlmShow.innerHTML = '( '+j*100+'% )';
  gVolume[gVoice] = j;
}

function fChangeVolumeMouseUp() {
  audioPlayer.play();
}

function fPlayStop() {
  if (btnPlay.value == 'off') {
    iLoops = 1;                       // launch Player
    audioPlayer.play();
    fChangeBtnPlay('on'); }
  else {
    fChangeBtnPlay('off');            // stop Player
    iLoops = gLoops;
    audioPlayer.pause();
    audioPlayer.currentTime = 0; }
}

function fChangeCorner(newValue) {
  var oV = document.getElementsByClassName('syl'+gCorner);   // ov - Old Value
  var nV = document.getElementsByClassName('syl'+newValue);  // nv - New Value
  for (var i=0; i<46; i++) {
    oV[i].style.visibility = 'hidden';
    nV[i].style.visibility = 'visible'; }
  gCorner = newValue;
}

function fChangeHeadings() {
  var b = document.getElementById('cbHeadings').checked,
      tbl = document.getElementsByTagName('table')[0],
      aTh = tbl.getElementsByTagName('th'),
      j,
      lng = aTh.length;
  if (b) {
    for (j=0; j<lng; j++)
      aTh[j].style.display = 'table-cell'; }
  else {
    for (j=0; j<lng; j++)
      aTh[j].style.display = 'none'; }
}

function fChangeGrid() {
  if (document.getElementById('cbGrid').checked)
    document.getElementById('dtl1a').style.visibility = 'visible'
  else
    document.getElementById('dtl1a').style.visibility = 'hidden';
}

function fChangeAdjacent() {
  if (document.getElementById('cbAdjacent').checked)
    document.getElementById('dtl3').parentNode.style.visibility = 'visible'
  else
    document.getElementById('dtl3').parentNode.style.visibility = 'hidden';
}


//*********************************************************
//   FUNCTIONS FOR SHOWING DETAILES
//*********************************************************

function fShowDatails(elem) {
  document.getElementById(AR[iAR]).lastChild.style.borderColor = 'transparent';
  elem.lastChild.style.borderColor = 'papayawhip';
  var newKana = elem.id;
  fShowKanaDetails(newKana);
  fLoadNewAudio(newKana);
  if (gLoops>0) {
    iLoops = 1;
    audioPlayer.play();
    fChangeBtnPlay('on'); }
  iAR = AR.indexOf(newKana);
  firstMove = false;
}

function fKeyDown(e){
  var k = e.keyCode;
  if (k===39 || k===37 || k===40 || k===38 || k===13 || k===32 || k===27) {
    e.preventDefault();
    if (firstMove) {
        firstMove = false;
        if (k===39 || k===40) iAR = 0
        else if (k===37) iAR = 50
        else if (k===38) iAR = 49
        else if (k===27) {fEmptyCell(); return; } }
    else {
      document.getElementById(AR[iAR]).lastChild.style.borderColor = 'transparent';
      switch (k) {
        case 39:
          do {}
          while (AR[++iAR] === '' && iAR<51);
          if (iAR > 50) iAR = 0;
          break;
        case 37:
          do {}
          while (AR[--iAR] === '' && iAR>=0);
          if (iAR < 0) iAR = 50;
          break;
        case 40:
          do {iAR += 5;}
          while (AR[iAR] === '' && iAR<51);
          if (iAR > 50) iAR = (iAR+1)%5;
          break;
        case 38:
          do {iAR -= 5;}
          while (AR[iAR] === '' && iAR>=0);
          if (iAR <= -4) iAR += 54
          else if (iAR <= -1) iAR += 44;
          break;
        case 27:
          fEmptyCell();
          return;
      } }
    var newKana = AR[iAR];
    document.getElementById(newKana).lastChild.style.borderColor = 'papayawhip';
    fShowKanaDetails(newKana);
    fLoadNewAudio(newKana);
    if (gLoops>0) {
      iLoops = 1;
      audioPlayer.play();
      fChangeBtnPlay('on');}
  }
}

function fEmptyCell() {
  document.getElementById(AR[iAR]).lastChild.style.borderColor = 'transparent';
  dtl1.src = 'empty.gif';
  dtl2.src = 'empty.gif';
  dtl3.src = 'empty.gif';
}


//*********************************************************
//   WORKING FUNCTIONS
//*********************************************************
function fAudioEnded(){
  if (iLoops<gLoops) {
    iLoops++;
    setTimeout(function(){audioPlayer.play()}, gPause); }
  else
    fChangeBtnPlay('off');
}

function fChangeKanaImages(){
  var listCell = document.getElementsByClassName('kanaImg');
  var j,k;
  for (j=0,k=0; k<51; k++) {
    if (AR[k] === '') continue;
    listCell[j].src = gKana+'/'+AR[k]+'.png';
    j++; }

  j = AR[iAR];
  if (document.getElementById(j).lastChild.style.borderColor != 'transparent')
    fShowKanaDetails(j)
}

function fShowKanaDetails(j){
  dtl1.src = gKana+'/'+j+'.png';
  dtl2.src = gKana+'-s/'+j+'-s.gif';
  dtl3.src = (gKana == 'hiragana')?'katakana/'+j+'.png':'hiragana/'+j+'.png';
}

function fLoadNewAudio(k){
  srcMp3.src = 'audio-'+gVoice+'/'+k+'.mp3';
  srcOgg.src = 'audio-'+gVoice+'/'+k+'.ogg';
  audioPlayer.load();
}

function fChangeBtnPlay(newState) {
  if (newState == 'on')
    btnPlay.lastChild.style.backgroundPosition = 'right -18px'  // set 'stop' symbol
  else
    btnPlay.lastChild.style.backgroundPosition = 'right 0'      // set 'play' symbol
  btnPlay.value = newState;
}

function fExchangeKanaType(){
  var baseH = document.getElementById('hiragana'),
      baseK = document.getElementById('katakana'),      cornerH = document.getElementById('cornerH'),
      cornerK = document.getElementById('cornerK');
      
  if (baseH.checked) {
    baseK.checked = true;
    fChangeKana('katakana');
    cornerH.checked = true; 
    fChangeCorner('H'); }
  else if(baseK.checked) {
    baseH.checked = true;
    fChangeKana('hiragana');
    cornerK.checked = true;
    fChangeCorner('K'); }
    
  fChangeKanaImages();
}