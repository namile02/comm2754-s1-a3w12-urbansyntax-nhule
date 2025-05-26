// script.js
document.addEventListener('DOMContentLoaded', () => {
  const defaultBtn = document.getElementById('icon-btn-default');
  const quitBtn    = document.getElementById('icon-btn-quit');
  const popup      = document.getElementById('info-popup');

  defaultBtn.addEventListener('click', () => {
    defaultBtn.style.visibility = 'hidden';
    quitBtn.style.visibility    = 'visible';
    popup.style.display         = 'block';
  });

  quitBtn.addEventListener('click', () => {
    defaultBtn.style.visibility = 'visible';
    quitBtn.style.visibility    = 'hidden';
    popup.style.display         = 'none';
  });
});

const btnDefault = document.getElementById('sound-btn-default');
const btnOn = document.getElementById('sound-btn-on');

let isSoundOn = false;

btnDefault.addEventListener('click', () => {
  isSoundOn = true;
 btnDefault.style.display = 'none';
btnOn.style.display = 'block';
  unmuteAllSounds();
});

btnOn.addEventListener('click', () => {
  isSoundOn = false;
   
  btnOn.style.display = 'none';
btnDefault.style.display = 'block';

  muteAllSounds();
});

function muteAllSounds() {
  if (ambientSound && ambientSound.isPlaying()) {
    ambientSound.setVolume(0);
  }
  if (hoverSound && hoverSound.isPlaying()) {
    hoverSound.setVolume(0);
  }
}

function unmuteAllSounds() {
  if (ambientSound && ambientSound.isPlaying()) {
    ambientSound.setVolume(0.3);
  }
  if (hoverSound && hoverSound.isPlaying()) {
    hoverSound.setVolume(1);
  }
}
