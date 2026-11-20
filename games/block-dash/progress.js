import { arcadeProgress } from '../arcade-progress.js';
// The family games share an origin. Keep each library independent.
const key = 'family-games:/block-dash/:progress:1';
const heroes = {kirill:'Кирилл', maxim:'Максим', mom:'Мама', dad:'Папа', pasha:'Паша'};
const levels = {temple:'Храм изумруда', arcade:'Игровой центр', waterpark:'Аквапарк', store:'Мебельный магазин', nether:'Нижний мир', castle:'Замок на Хеллоуин', end:'Край'};
export const { beginArcadeRound, loadSavedGame, saveGame, clearSavedGame, addResult, bindProgress } =
  arcadeProgress(key, heroes, levels);
