/**
 * Created by Malvina Pushkova <lady3mlnm@gmail.com>
 * Date: 2017
 */

//known limit: if user made more than (9007199254740991-1000) clicks without page reload than bug can occur

var arKana = ['a','i','u','e','o','ka','ki','ku','ke','ko','sa','shi','su','se','so','ta','chi','tsu','te','to','na','ni','nu','ne','no','ha','hi','fu','he','ho','ma','mi','mu','me','mo','ya','yu','yo','ra','ri','ru','re','ro','wa','wo','n'],
    testKana,   // random kana for testing of voice choice
    audioPlayer = document.getElementById('audioPlayer'), // elements for audio output
    srcMp3 = document.getElementById('srcMp3'),    // source of MP3
    srcOgg = document.getElementById('srcOgg'),
    vlmShow = document.getElementById('vlmShow'),  // volume Show
    gCornerKana,           // kana type in corner of table cells: 'R' for rōmaji, 'H' for hiragana, 'K' for katakana
    gCardKana,             // kana type on cards, possible values 'R','H','K','S'
    gVoice,               // variant of voice acting, current 0, 1, 2 or -1 for 'no sound'
    gVolume,              // volume of audio, array
    gARCHIVE,             // archive, containing results of previous games. WARNING: there're problems with .every(func) method, if array contained undefined values, so it's safer to use ''

    curCard,       // selected card
    curX,          // distance between mouse and top left corner of selected card
    curY,
    curBeginL,     // coordinates of top left corner of selected card at the beginning of the movement, for returning card to previous place in case of error
    curBeginT,
    curRemain,     // number of remained cards
    curErrors,     // number of errors (for statics)
    curDate;       // time of game beginning
    curB = false,  // if one of cards is selected & in state of dragging
    curZ = 1000;   // z-index of selected card, increase with each choice

//var info = document.getElementById('info');        // temporary supporting element


//*********************************************************
//   LOAD / UNLOAD
//*********************************************************

function fLoad() {   // Whenever possible, I've tried to defend against simple errors during loading
  var j;

  testKana = arKana[Math.floor(Math.random()*46)];
  document.getElementById('testR').innerHTML = document.getElementById(testKana).getElementsByClassName('sylR')[0].innerHTML;
  document.getElementById('testH').src = 'hiragana/'+testKana+'.png';
  document.getElementById('testK').src = 'katakana/'+testKana+'.png';

  if (localStorage.gb_gCornerKana == 'R' || localStorage.gb_gCornerKana == 'K')        // kana type in corner of table cells
    gCornerKana = localStorage.gb_gCornerKana
  else
    gCornerKana = 'H';
  fChangeCorner(gCornerKana);
  document.getElementById('corner'+gCornerKana).checked = true;

  if (localStorage.gb_gCardKana == 'K' || localStorage.gb_gCardKana == 'H' || localStorage.gb_gCardKana == 'S')        // kana type on cards
    gCardKana = localStorage.gb_gCardKana
  else
    gCardKana = 'R';
  fChangeCard(gCardKana);
  document.getElementById('card'+gCardKana).checked = true;

  j = Number(localStorage.gb_gVoice);                    // variant of voice acting, current 0, 1, 2, 3
  gVoice = (isNaN(j))?0:j;
  document.getElementById('rAudio'+gVoice).checked = true;
  if (gVoice >= 0)
    fLoadNewAudio(testKana);

  if (localStorage.gb_gVolume !== undefined && localStorage.gb_gVolume !== 'undefined')      // volume of audio, array
    gVolume = localStorage.gb_gVolume.split(',')
  else
    gVolume = [0.5, 0.9, 0.5, 0.3];
  if (gVoice != '-1') {
    vlmShow.innerHTML = '( '+gVolume[gVoice]*100+'% )';
    document.getElementById('vlmRange').value = gVolume[gVoice];
    document.getElementById('vlmRange').disabled = false;
    audioPlayer.volume = gVolume[gVoice]; }
  else {
    vlmShow.innerHTML = '( - )';
    document.getElementById('vlmRange').value = 0;
    document.getElementById('vlmRange').disabled = true; }

  if (localStorage.gb_gARCHIVE !== undefined && localStorage.gb_gARCHIVE !== 'undefined') {
    gARCHIVE = localStorage.gb_gARCHIVE.split(',')
    if (!fCheckAllEmpty() || gARCHIVE.length!=18)
      fShowArchive(); }
  else
    gARCHIVE = ['','','','','','','','','','','','','','','','','',''];
}

function fUnload() {
  localStorage.setItem('gb_gCornerKana', gCornerKana);
  localStorage.setItem('gb_gCardKana', gCardKana);
  localStorage.setItem('gb_gVoice', gVoice);
  localStorage.setItem('gb_gVolume', gVolume);
  if (!fCheckAllEmpty())
    localStorage.setItem('gb_gARCHIVE', gARCHIVE);
}


//*********************************************************
//   CONTROL PANEL
//*********************************************************

function fChangeCorner(newValue) {
  var oV = document.getElementsByClassName('syl'+gCornerKana);   // ov - Old Value
  var nV = document.getElementsByClassName('syl'+newValue);      // nv - New Value
  for (var i=0; i<46; i++) {
    oV[i].style.visibility = 'hidden';
    nV[i].style.visibility = 'visible'; }
  gCornerKana = newValue;
  fChangeStartButton();
}

function fChangeCard(newValue) {
  document.getElementById('test'+gCardKana).style.display = 'none';
  document.getElementById('test'+newValue).style.display = 'block';
  gCardKana = newValue;
  fChangeStartButton();
}

function fChangeVoice(j) {
  gVoice = Number(j);
  if (gVoice >= 0) {
    fLoadNewAudio(testKana);
    audioPlayer.volume = gVolume[gVoice];
    audioPlayer.play();
    vlmShow.innerHTML = '( '+gVolume[gVoice]*100+'% )';
    document.getElementById('vlmRange').value = gVolume[gVoice];
    document.getElementById('vlmRange').disabled = false; }
  else {
    vlmShow.innerHTML = '( - )';
    document.getElementById('vlmRange').value = 0;
    document.getElementById('vlmRange').disabled = true; }
}

function fChangeVolume(j) {
  if (gVoice == '-1') {
    alert('Error! gVoice at this place can\'t be -1. Operation is stopped.');
    return; }
  audioPlayer.volume = j;
  vlmShow.innerHTML = '( '+j*100+'% )';
  gVolume[gVoice] = j;
}

function fChangeVolumeMouseUp() {  //play testKana when user change volume
  audioPlayer.play();
}

function fClearResults() {        //when user click 'Clear' button
  if (confirm('Confirm, that you really want to clear archive.\nThis archive can not be restored.')) {
    gARCHIVE = ['','','','','','','','','','','','','','','','','',''];
    localStorage.removeItem('gb_gARCHIVE');
    var elem = document.getElementById('showArchive');
    var elem2 = elem.parentNode.getElementsByTagName('button')[0];
    elem2.style.display = 'none';
    elem.innerHTML = 'Archive was cleared.<br><br>';
    setTimeout(function(){elem.parentNode.style.display = 'none';},6000);
    setTimeout(function(){elem2.style.display = 'block';},7000); }  // return 'Clear' button for future use
}


//*********************************************************
//   GAME CONTROL
//*********************************************************

function fStartGame() {
  /* if (gVoice==-1 && gCardKana == 'S'&& !confirm('You choose to play without sound and without image on cards.\nDo you want to test telepathic ability? You can.'))
    return; */
  if (gCornerKana == gCardKana && !confirm('Kana in the table and on the cards are the same.\nYou can continue but this don\'t have game challenge. Confirm continue.'))
    return;

  var bodyElem = document.body;
  bodyElem.removeChild(document.getElementById('cornerR').parentNode);       // remove control panel
  bodyElem.removeChild(document.getElementById('cardR').parentNode);
  bodyElem.removeChild(document.getElementById('rAudio0').parentNode);
  bodyElem.removeChild(document.getElementById('buttonStart'));
  document.getElementById('showArchive').parentNode.style.display = 'none';

  var j;
  var listBig = document.getElementsByClassName('bigKana');         // filling 'Big Kana' in the table
  var newContent = (gCardKana=='S')?'H':gCardKana;
  var listCard = document.getElementsByClassName('syl'+newContent);
  for (j=45; j>=0; j--) {
    listBig[j].innerHTML = listCard[j].innerHTML;   //transfer content of corner kana to 'big kana' in every cell
    listBig[j].className = 'big'+newContent; }

  if (gCardKana == 'H') {                               //creating cards
    for (j=0; j<46; j++) {
      newCard = fGenerateNewCard('img',arKana[j]);
      newCard.className = 'capH';
      newCard.src = 'hiragana/'+arKana[j]+'.png';
    } }
  else if (gCardKana == 'K') {
    for (j=45; j>=0; j--) {
      newCard = fGenerateNewCard('img',arKana[j]);
      newCard.className = 'capK';
      newCard.src = 'katakana/'+arKana[j]+'.png';
    } }
  else if (gCardKana == 'R') {
    for (j=0; j<46; j++) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capR';
      if (j==29)
        newCard.appendChild(document.createTextNode('(fu)'));
      else if (j==44)
        newCard.appendChild(document.createTextNode('(o)'));
      else
        newCard.appendChild(document.createTextNode(arKana[j]));
    } }
  else if (gCardKana == 'S') {
    for (j=45; j>=0; j--) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capS';
    } }
  else {                                // additional check just in case
    alert('Error! gCardKana has strange meaning. Operation is stopped.');
    return; }

  bodyElem.addEventListener('mousemove',fDrag);  // adding events listeners to the body
  bodyElem.addEventListener('mouseup',fDragEndBody);
  bodyElem.addEventListener('mouseenter',fMouseBodyEnter);
  curRemain = 46;
  curErrors = 0;
  curDate = new Date();
}

function fDragStart(e) {
  e.preventDefault();
  curCard = e.currentTarget;
  if (gCardKana == 'S') {
    fLoadNewAudio(curCard.value);
    audioPlayer.play(); }
  else
    audioPlayer.pause();
  curCard.style.zIndex = ++curZ;
  curCard.style.opacity = 0.75;
  curCard.style.pointerEvents = 'none';
  curX = e.clientX - parseInt(curCard.style.left);
  curY = e.clientY - parseInt(curCard.style.top);
  curB = true;
  curBeginL = curCard.style.left;
  curBeginT = curCard.style.top;
}

function fDrag(e) {
  if (curB) {
    e.preventDefault(); // just in case
    curCard.style.left = e.clientX - curX + 'px';
    curCard.style.top = e.clientY - curY + 'px'; }
}

function fDragEndBody() {
  if (curB) {
    curCard.style.opacity = 1;
    curCard.style.pointerEvents = 'auto';
    curB = false; }
}

function fDragEndCell(elem) {
  if (!curB)
    return;
  if (elem.id == curCard.value) {
    fLoadNewAudio(curCard.value);  //play kana
    audioPlayer.play();
    
    if (curCard.classList[0] == 'capK')
      elem.lastChild.style.borderColor = 'lightgoldenrodyellow'
    else
      elem.lastChild.style.borderColor = getComputedStyle(curCard).backgroundColor;
    document.body.removeChild(curCard);
    var curCell = elem.getElementsByTagName('div')[1];
    curCell.style.visibility = 'visible';
    if (curRemain != 1)
      setTimeout(function(){elem.lastChild.style.borderColor = 'transparent';
                            curCell.style.visibility = 'hidden';},1500)
    else
      setTimeout(function(){elem.lastChild.style.borderColor = 'transparent';},6000)
    curB = false;
    curRemain--;
    if (curRemain <= 0)
      fVictory(); }
  else {
    srcMp3.src = 'error.mp3';
    srcOgg.src = 'error.ogg';
    audioPlayer.load();
    audioPlayer.play();
    curCard.style.left = curBeginL;
    curCard.style.top = curBeginT;
    curErrors++; }
}

function fMouseBodyEnter(e) {
  if (curB && e.buttons == 0)
    fDragEndBody();
}


//*********************************************************
//   WORKING FUNCTIONS
//*********************************************************

function fChangeStartButton() {
  document.getElementById('buttonStart').innerHTML = (gCornerKana == gCardKana)?'Start':'Start Game';
}

function fCheckAllEmpty() {
  var j, lng = gARCHIVE.length;
  for (j=0; j<lng; j=j+2)
    if (gARCHIVE[j]!=='' && gARCHIVE[j]!==undefined) {break;}
  return j>=lng;
}

function fCheckAll0() {
  var j, lng = gARCHIVE.length;
  for (j=0; j<lng; j=j+2)
    if (gARCHIVE[j]!==0 && gARCHIVE[j]!=='0') {break;}
  return j>=lng;
}

function fShowArchive() {
  var elem = document.getElementById('showArchive');
  elem.innerHTML = 'rōmaji &larr; HIRAGANA: '+fTransform(gARCHIVE[0],gARCHIVE[1])+
                   '<br>rōmaji &larr; KATAKANA: '+fTransform(gARCHIVE[2],gARCHIVE[3])+
                   '<br>rōmaji &larr; sound: '+fTransform(gARCHIVE[4],gARCHIVE[5])+
                   '<br><br>hiragana &larr; RŌMAJI: '+fTransform(gARCHIVE[6],gARCHIVE[7])+
                   '<br>hiragana &larr; KATAKANA: '+fTransform(gARCHIVE[8],gARCHIVE[9])+
                   '<br>hiragana &larr; sound: '+fTransform(gARCHIVE[10],gARCHIVE[11])+
                   '<br><br>katakana &larr; RŌMAJI: '+fTransform(gARCHIVE[12],gARCHIVE[13])+
                   '<br>katakana &larr; HIRAGANA: '+fTransform(gARCHIVE[14],gARCHIVE[15])+
                   '<br>katakana &larr; sound: '+fTransform(gARCHIVE[16],gARCHIVE[17])+
                   '<br><br>';                 // '<br><br>' is for rooms for 'Clear' button
  elem.parentNode.style.display = 'block';

  function fTransform(er,tm) {
  var txt, x, y;
  if (er === '') txt = '—'
  else {
    x = Number(er);
    y = Number(tm);
    if (isNaN(x) || isNaN(y)) {
      alert('Not critical error during reading archive of results. Values ['+er+', '+tm+'] will be replace to \'—\'');
      txt = '—'; }
    else if (x == 1)
      txt = x+' error, '+Math.floor(y/60)+' min '+y%60+' sec'
    else
      txt = x+' errors, '+Math.floor(y/60)+' min '+y%60+' sec';   }
  return txt;
  }
}

function fGenerateNewCard (cardType, kana) {  // Generate 1 new card, clear outwardly but with value = kana
  var newCard = document.createElement(cardType);
  newCard.style.position = 'absolute';
  newCard.style.left = Math.floor(Math.random()*350)+450+'px';
  newCard.style.top = Math.floor(Math.random()*570)+'px';
  newCard.style.zIndex = Math.floor(Math.random()*1000);
  newCard.value = kana;
  newCard.addEventListener('mousedown',fDragStart);
  document.body.appendChild(newCard);
  return newCard;
}

function fVictory() {
  document.getElementsByTagName('table')[0].style.outline = '10px solid yellow';
  var listElem = document.getElementsByClassName((gCardKana == 'S')?'bigH':('big'+gCardKana));
  for (var j=0; j<46; j++)
    listElem[j].style.visibility = 'visible';

  var t = Math.round((new Date()-curDate)/1000)       //Time of games in seconds
  if (gCornerKana == 'R' && gCardKana == 'H')
    fUpdateArchive(0, curErrors, t)
  else if (gCornerKana == 'R' && gCardKana == 'K')
    fUpdateArchive(2, curErrors, t)
  else if (gCornerKana == 'R' && gCardKana == 'S')
    fUpdateArchive(4, curErrors, t)
  else if (gCornerKana == 'H' && gCardKana == 'R')
    fUpdateArchive(6, curErrors, t)
  else if (gCornerKana == 'H' && gCardKana == 'K')
    fUpdateArchive(8, curErrors, t)
  else if (gCornerKana == 'H' && gCardKana == 'S')
    fUpdateArchive(10, curErrors, t)
  else if (gCornerKana == 'K' && gCardKana == 'R')
    fUpdateArchive(12, curErrors, t)
  else if (gCornerKana == 'K' && gCardKana == 'H')
    fUpdateArchive(14, curErrors, t)
  else if (gCornerKana == 'K' && gCardKana == 'S')
    fUpdateArchive(16, curErrors, t);
  fShowArchive();

  if (gCornerKana == gCardKana) {
    alert('Finish!\nNumber of errors: '+curErrors+'\nTime of game: '+Math.floor(t/60)+' min '+t%60+' sec\n\nReload page to continue.');
    return; }

  if (fCheckAll0() && curErrors==0) {
    if (confirm('Number of errors: '+curErrors+'\nTime of game: '+Math.floor(t/60)+' min '+t%60+' sec\n\n'+
               'SUPER!!\nYou mastered all 9 types of game without errors!\nAnd here my humble gift to you. Do you like anime "Sailor Moon"?\nIf you press OK then hear one of my favorite songs.')) {
      srcMp3.src = 'danger-flowers.mp3';
      srcOgg.src = 'danger-flowers.ogg';
      audioPlayer.load();
      audioPlayer.play();
    } }
  else
    alert('Well done!\nNumber of errors: '+curErrors+'\nTime of game: '+Math.floor(t/60)+' min '+t%60+' sec\n\nReload page for new game.');

  function fUpdateArchive(ind, er, tm) {
    if (gARCHIVE[ind] === '' || gARCHIVE[ind] > er) {
      gARCHIVE[ind] = er;
      gARCHIVE[ind+1] = tm; }
    else if (gARCHIVE[ind] == er && gARCHIVE[ind+1] > tm)
      gARCHIVE[ind+1] = tm;
  }
}

function fLoadNewAudio(k){
  srcMp3.src = 'audio-'+gVoice+'/'+k+'.mp3';
  srcOgg.src = 'audio-'+gVoice+'/'+k+'.ogg';
  audioPlayer.load();
}
