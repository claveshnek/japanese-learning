/**
 * Created by Malvina Pushkova <lady3mlnm@gmail.com>
 * Date: 2017
 */

//known limit: if user made more than (9007199254740991-1000) clicks without page reload than bug can occur

var arKana  = ['ga', 'gi', 'gu', 'ge', 'go', 'za', 'ji', 'zu', 'ze', 'zo', 'da', 'ji2', 'zu2', 'de', 'do', 'ba', 'bi', 'bu', 'be', 'bo', 'pa', 'pi', 'pu', 'pe', 'po'],
    testKana,   // random kana for testing of voice choice
    audioPlayer = document.getElementById('audioPlayer'), // elements for audio output
    srcMp3 = document.getElementById('srcMp3'),    // source of MP3
    srcOgg = document.getElementById('srcOgg'),
    vlmShow = document.getElementById('vlmShow'),  // volume Show
    gCornerKana,           // kana type in corner of table cells: 'R' for rōmaji, 'H' for hiragana, 'K' for katakana
    gCardKana,             // kana type on cards, possible values 'R','H','K','S'
    gVoice,               // variant of voice acting, current 0, 1 or -1 for 'no sound'
    gVolume,              // volume of audio, array

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

//*********************************************************
//   LOAD / UNLOAD
//*********************************************************

function fLoad() {   // Whenever possible, I've tried to defend against simple errors during loading
  var j;

  testKana = arKana[Math.floor(Math.random()*25)];
  document.getElementById('testR').innerHTML = document.getElementById(testKana).getElementsByClassName('sylR')[0].innerHTML;
  document.getElementById('testH').innerHTML = document.getElementById(testKana).getElementsByClassName('sylH')[0].innerHTML;
  document.getElementById('testK').innerHTML = document.getElementById(testKana).getElementsByClassName('sylK')[0].innerHTML;

  if (localStorage.gt_gCornerKana == 'R' || localStorage.gt_gCornerKana == 'K')        // kana type in corner of table cells
    gCornerKana = localStorage.gt_gCornerKana
  else
    gCornerKana = 'H';
  fChangeCorner(gCornerKana);
  document.getElementById('corner'+gCornerKana).checked = true;

  if (localStorage.gt_gCardKana == 'K' || localStorage.gt_gCardKana == 'H' || localStorage.gt_gCardKana == 'S')        // kana type on cards
    gCardKana = localStorage.gt_gCardKana
  else
    gCardKana = 'R';
  fChangeCard(gCardKana);
  document.getElementById('card'+gCardKana).checked = true;

  j = Number(localStorage.gt_gVoice);                    // variant of voice acting, current 0, 1, 2
  gVoice = (isNaN(j))?0:j;
  document.getElementById('rAudio'+gVoice).checked = true;
  if (gVoice >= 0)
    fLoadNewAudio(testKana);

  if (localStorage.gt_gVolume !== undefined && localStorage.gt_gVolume !== 'undefined')      // volume of audio, array
    gVolume = localStorage.gt_gVolume.split(',')
  else
    gVolume = [0.5, 0.9, 0.5];
  if (gVoice != '-1') {
    vlmShow.innerHTML = '( '+gVolume[gVoice]*100+'% )';
    document.getElementById('vlmRange').value = gVolume[gVoice];
    document.getElementById('vlmRange').disabled = false;
    audioPlayer.volume = gVolume[gVoice]; }
  else {
    vlmShow.innerHTML = '( - )';
    document.getElementById('vlmRange').value = 0;
    document.getElementById('vlmRange').disabled = true; }
}

function fUnload() {
  localStorage.setItem('gt_gCornerKana', gCornerKana);
  localStorage.setItem('gt_gCardKana', gCardKana);
  localStorage.setItem('gt_gVoice', gVoice);
  localStorage.setItem('gt_gVolume', gVolume);
}


//*********************************************************
//   CONTROL PANEL
//*********************************************************

function fChangeCorner(newValue) {
  var oV = document.getElementsByClassName('syl'+gCornerKana);   // ov - Old Value
  var nV = document.getElementsByClassName('syl'+newValue);      // nv - New Value
  for (var i=0; i<25; i++) {
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
    alert('Ошибка! Переменная gVoice в этом месте не может иметь значение -1. Операция прервана.');
    return; }
  audioPlayer.volume = j;
  vlmShow.innerHTML = '( '+j*100+'% )';
  gVolume[gVoice] = j;
}

function fChangeVolumeMouseUp() {  //play testKana when user change volume
  audioPlayer.play();
}


//*********************************************************
//   GAME CONTROL
//*********************************************************

function fStartGame() {
  /* if (gVoice==-1 && gCardKana == 'S'&& !confirm('Вы выбрали опции играть без озвучки и без изображений на карточках.\nХотите протестировать свои телепатические способности? Вы можете попробовать.'))
    return; */
  if (gCornerKana == gCardKana && !confirm('Типы кан в таблице и на карточках одинаковы.\nВы можете продолжить, но в этом действии нет вызова игры. Подтвердите продолжение.'))
    return;
  
  var bodyElem = document.body;
  bodyElem.removeChild(document.getElementById('cornerR').parentNode);       // remove control panel
  bodyElem.removeChild(document.getElementById('cardR').parentNode);
  bodyElem.removeChild(document.getElementById('rAudio0').parentNode);
  bodyElem.removeChild(document.getElementById('buttonStart'));

  var j;
  var listBig = document.getElementsByClassName('bigKana');         // filling 'Big Kana' in the table
  var newContent = (gCardKana=='S')?'H':gCardKana;
  var listCard = document.getElementsByClassName('syl'+newContent);
  for (j=24; j>=0; j--) {
    listBig[j].innerHTML = listCard[j].innerHTML;    //transfer content of corner kana to 'big kana' in every cell  //convert corner kana in 'big kana' in every cell
    listBig[j].className = 'big'+newContent; }

  if (gCardKana == 'H') {                               //creating cards
    for (j=0; j<25; j++) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capH';
      newCard.innerHTML = document.getElementById(arKana[j]).getElementsByClassName('sylH')[0].innerHTML;
    } }
  else if (gCardKana == 'K') {
    for (j=24; j>=0; j--) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capK';
      newCard.innerHTML = document.getElementById(arKana[j]).getElementsByClassName('sylK')[0].innerHTML;
    } }
  else if (gCardKana == 'R') {
    for (j=0; j<25; j++) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capR';
      newCard.innerHTML = document.getElementById(arKana[j]).getElementsByClassName('sylR')[0].innerHTML;
    } }
  else if (gCardKana == 'S') {
    for (j=24; j>=0; j--) {
      newCard = fGenerateNewCard('div',arKana[j]);
      newCard.className = 'capS';
    } }
  else {                                // additional check just in case
    alert('Ошибка! Переменная gCardKana имеет нестандартное значение. Операция прервана.');
    return; }

  bodyElem.addEventListener('mousemove',fDrag);  // adding events listeners to the body
  bodyElem.addEventListener('mouseup',fDragEndBody);
  bodyElem.addEventListener('mouseenter',fMouseBodyEnter);
  curRemain = 25;
  curErrors = 0;
  curDate = new Date();
}

function fDragStart(e) {
  e.preventDefault();
  curCard = e.currentTarget;
  if (gCardKana == 'S') {  //2
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
  document.getElementById('buttonStart').innerHTML = (gCornerKana == gCardKana)?'Начать':'Начать Игру';
}

function fGenerateNewCard (cardType, kana) {  // Generate 1 new card, clear outwardly but with value = kana
  var newCard = document.createElement(cardType);
  newCard.style.position = 'absolute';
  newCard.style.left = Math.floor(Math.random()*350)+450+'px';
  newCard.style.top = Math.floor(Math.random()*350)+'px';
  newCard.style.zIndex = Math.floor(Math.random()*1000);
  newCard.value = kana;
  newCard.addEventListener('mousedown',fDragStart);
  document.body.appendChild(newCard);
  return newCard;
}

function fVictory() {
  document.getElementsByTagName('table')[0].style.outline = '10px solid yellow';
  var listElem = document.getElementsByClassName((gCardKana == 'S')?'bigH':('big'+gCardKana));
  for (var j=0; j<25; j++)
    listElem[j].style.visibility = 'visible';

  var t = Math.round((new Date()-curDate)/1000)       //Time of games in seconds
  if (gCornerKana == gCardKana) {
    alert('Финиш!\nКоличество ошибок: '+curErrors+'\nВремя игры: '+Math.floor(t/60)+' мин '+t%60+' сек\n\nПерезагрузите страницу для продолжения.');
    return; }
  else
    alert('Хорошо сделано!\nКоличество ошибок: '+curErrors+'\nВремя игры: '+Math.floor(t/60)+' мин '+t%60+' сек\n\nПерезагрузите страницу для продолжения.');
}

function fLoadNewAudio(k){
  srcMp3.src = 'audio-'+gVoice+'/'+k+'.mp3';
  srcOgg.src = 'audio-'+gVoice+'/'+k+'.ogg';
  audioPlayer.load();
}