// Short one-shots share a pentatonic emerald motif. Enemy warnings have distinct timbres
// so a player can recognize a bow, fuse or incoming dragon without looking at its sprite.
export const arcadeSounds = {
  'arcade-start': [['triangle', 0, 330, 330, .08, .13], ['triangle', .09, 494, 494, .13, .13]],
  'arcade-gem': [['sine', 0, 880, 880, .065, .16], ['sine', .045, 1319, 1319, .095, .09]],
  'arcade-jump': [['triangle', 0, 215, 520, .13, .18], ['noise', 0, 850, 430, .035, .07]],
  'arcade-slide': [['noise', 0, 1700, 270, .21, .14], ['triangle', 0, 145, 76, .13, .08]],
  'arcade-checkpoint': [['triangle', 0, 523, 523, .09, .13], ['triangle', .1, 659, 659, .09, .13], ['sine', .20, 784, 784, .23, .16]],
  'arcade-hit': [['noise', 0, 680, 120, .08, .16], ['triangle', .015, 240, 72, .2, .19]],
  'arcade-over': [['triangle', 0, 392, 370, .13, .14], ['triangle', .15, 330, 294, .14, .13], ['sine', .31, 247, 165, .27, .16]],
  'arcade-win': [['triangle', 0, 523, 523, .11, .14], ['triangle', .12, 659, 659, .11, .14], ['triangle', .24, 784, 784, .12, .14], ['sine', .39, 1047, 1047, .31, .18]],
  'arcade-kirill': [['noise', 0, 400, 2200, .18, .12], ['triangle', .02, 280, 630, .12, .15], ['triangle', .12, 460, 920, .15, .12]],
  'arcade-maxim': [['noise', 0, 950, 280, .065, .15], ['sine', .055, 195, 66, .19, .24], ['noise', .055, 1200, 190, .095, .13]],
  'arcade-mom': [['sine', 0, 1175, 988, .19, .12], ['sine', .09, 880, 740, .22, .10], ['sine', .18, 659, 494, .29, .08]],
  'arcade-dad': [['triangle', 0, 118, 178, .07, .23], ['sawtooth', .045, 161, 96, .26, .08], ['sine', .07, 273, 169, .28, .17]],
  'arcade-bow': [['noise', 0, 560, 1450, .18, .11], ['triangle', .03, 250, 470, .2, .10]],
  'arcade-fuse': [['noise', 0, 1200, 2300, .23, .16], ['noise', .25, 1900, 2900, .12, .12]],
  'arcade-blast': [['noise', 0, 1400, 140, .21, .18], ['sine', 0, 133, 52, .25, .23]],
  'arcade-portal': [['sine', 0, 720, 280, .16, .14], ['triangle', .10, 323, 811, .21, .10]],
  'arcade-ghast': [['noise', 0, 420, 1530, .22, .11], ['sine', .02, 165, 415, .29, .16]],
  'arcade-cube': [['triangle', 0, 138, 72, .10, .15], ['sine', .10, 90, 250, .16, .17]],
  'arcade-dragon': [['sawtooth', 0, 121, 72, .33, .10], ['noise', .04, 420, 1300, .29, .15], ['noise', .24, 950, 240, .21, .11]],
};
