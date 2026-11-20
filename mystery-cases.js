// Cell numbers run from left to right across each row of the three-by-three map.
// Clues point to the stamp, ribbon and delivery note, in that order.
const monsterNames = {
  spider: 'Паук', skeleton: 'Скелет', zombie: 'Зомби', enderman: 'Эндермен', witch: 'Ведьма',
  slime: 'Слизень', creeper: 'Крипер', ghost: 'Призрак', drowned: 'Утопленник', guardian: 'Страж',
  elder_guardian: 'Древний страж', ghast: 'Гаст', magma_cube: 'Магмовый куб', blaze: 'Ифрит',
  wither_skeleton: 'Скелет-иссушитель', pumpkin_guard: 'Тыквенный страж', shulker: 'Шалкер',
};

export const investigations = [
  {
    title: 'Дело о пропавшем изумруде', world: 'Мебельный магазин', sheet: 'world', row: 3,
    entrance: 1, clues: [0, 5, 7], stashes: [3, 6, 8], closed: [],
    patrol: [4, 5, 8, 7, 6, 3], guard: 'witch', helpers: ['spider', 'skeleton', 'zombie', 'enderman'],
    places: [
      ['Касса', 'till'], ['Вход', 'sign'], ['Светильники', 'lamp'],
      ['Диваны', 'sofa'], ['Галерея', 'plant'], ['Мастерская', 'desk'],
      ['Стеллажи', 'shelf'], ['Архив', 'files'], ['Шкафы', 'wardrobe'],
    ],
  },
  {
    title: 'Посылка за водопадом', world: 'Храм изумруда', sheet: 'world', row: 0,
    entrance: 0, clues: [1, 6, 5], stashes: [2, 7, 8], closed: [4],
    patrol: [2, 5, 8, 7, 6, 7, 8, 5], guard: 'skeleton', helpers: ['creeper', 'spider', 'slime', 'skeleton'],
    places: [
      ['Арка', 'sign'], ['Аллея масок', 'stone_mask'], ['Терраса', 'plant'],
      ['Колодец', 'wave_pool'], ['Обвал', 'basalt_columns'], ['Жаровня', 'brazier'],
      ['Записки смотрителя', 'files'], ['Корни', 'plant'], ['Святилище', 'stone_mask'],
    ],
  },
  {
    title: 'Приз из автомата', world: 'Игровой центр', sheet: 'world', row: 1,
    entrance: 4, clues: [2, 3, 8], stashes: [0, 5, 7], closed: [6],
    patrol: [0, 1, 2, 5, 8, 5, 2, 1], guard: 'slime', helpers: ['zombie', 'slime', 'spider', 'witch'],
    places: [
      ['Карусель', 'carousel'], ['Касса', 'till'], ['Автомат', 'claw'],
      ['Гардероб', 'wardrobe'], ['Фойе', 'sign'], ['Горки', 'slide'],
      ['Ремонт', 'shelf'], ['Призовая', 'claw'], ['Пульт', 'desk'],
    ],
  },
  {
    title: 'Тайна мокрой ленты', world: 'Аквапарк', sheet: 'world', row: 2,
    entrance: 7, clues: [0, 2, 6], stashes: [1, 5, 8], closed: [4],
    patrol: [6, 3, 0, 1, 2, 1, 0, 3], guard: 'guardian', helpers: ['drowned', 'guardian', 'slime', 'elder_guardian'],
    places: [
      ['Билеты', 'till'], ['Тайфун', 'typhoon'], ['Шезлонги', 'sofa'],
      ['Мостик', 'slide'], ['Глубина', 'wave_pool'], ['Жёлоб', 'water_slide'],
      ['Спасатели', 'desk'], ['Турникет', 'sign'], ['Бассейн', 'wave_pool'],
    ],
  },
  {
    title: 'Печать в пепле', world: 'Нижний мир', sheet: 'realm', row: 0,
    entrance: 0, clues: [2, 3, 7], stashes: [1, 5, 8], closed: [4, 6],
    patrol: [1, 2, 5, 8, 7, 8, 5, 2], guard: 'ghast', helpers: ['ghast', 'blaze', 'magma_cube', 'wither_skeleton'],
    places: [
      ['Причал', 'sign'], ['Базальт', 'basalt_columns'], ['Горн', 'brazier'],
      ['Грибница', 'crimson_fungi'], ['Расплав', 'lavafall'], ['Застава', 'gatehouse'],
      ['Провал', 'lavafall'], ['Кузница', 'brazier'], ['Штольня', 'basalt_columns'],
    ],
  },
  {
    title: 'Улика на балу', world: 'Замок на Хеллоуин', sheet: 'realm', row: 1,
    entrance: 8, clues: [1, 6, 3], stashes: [0, 2, 7], closed: [5],
    patrol: [0, 1, 4, 7, 6, 3], guard: 'ghost', helpers: ['witch', 'ghost', 'pumpkin_guard', 'spider'],
    places: [
      ['Башня', 'gatehouse'], ['Кухня', 'cauldron'], ['Тыквы', 'pumpkin_patch'],
      ['Библиотека', 'files'], ['Бальный зал', 'lamp'], ['Запертая дверь', 'gatehouse'],
      ['Подвал', 'cauldron'], ['Оранжерея', 'pumpkin_patch'], ['Ворота', 'sign'],
    ],
  },
  {
    title: 'След у портала', world: 'Край', sheet: 'realm', row: 2,
    entrance: 3, clues: [6, 1, 8], stashes: [0, 2, 5], closed: [4, 7],
    patrol: [0, 1, 2, 5, 8, 5, 2, 1], guard: 'shulker', helpers: ['enderman', 'shulker', 'skeleton', 'spider'],
    places: [
      ['Роща', 'chorus_grove'], ['Обелиск', 'crystal_spires'], ['Вышка', 'crystal_spires'],
      ['Причал', 'sign'], ['Бездна', 'exit_portal'], ['Маяк', 'brazier'],
      ['Хранилище', 'warehouse'], ['Разлом', 'crystal_spires'], ['Портал', 'exit_portal'],
    ],
  },
].map(({ places, helpers, ...level }) => ({
  ...level,
  guardName: monsterNames[level.guard],
  rooms: places.map(([name, item], i) => ({
    name, item,
    clue: level.clues.includes(i) ? level.clues.indexOf(i) : undefined,
    stash: level.stashes.includes(i),
  })),
  suspects: helpers.map((type, i) => ({
    name: monsterNames[type], type, stamp: i % 2 ? 'звезда' : 'круг', ribbon: i < 2 ? 'синяя' : 'медная',
  })),
}));
