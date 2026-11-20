export const HEROES = [
  { id: 'kirill', name: 'Кирилл', power: 'Ускорение', description: 'Четыре секунды бежит быстрее и резче меняет дорожку.' },
  { id: 'maxim', name: 'Максим', power: 'Удар', description: 'На четыре секунды оглушает монстров, которые оказываются рядом.' },
  { id: 'mom', name: 'Мама', power: 'Невидимость', description: 'Четыре секунды монстры пропускают её сквозь строй.' },
  { id: 'dad', name: 'Папа', power: 'Крик «Бу!»', description: 'На три секунды распугивает монстров впереди.' },
  { id: 'pasha', name: 'Паша', power: 'Гитарное соло', description: 'Играет аккорд, и монстры поблизости танцуют пять секунд.' },
];

export const WORLDS = [
  { id: 'temple', name: 'Храм изумруда', description: 'Каменные врата, тотемы и тропа изумрудов.',
    monsters: ['creeper', 'zombie', 'spider'], barrier: 'rubble', arch: 'stone_gate', block: 'totem' },
  { id: 'arcade', name: 'Игровой центр', description: 'Беги мимо каруселей, горок и игровых автоматов.',
    monsters: ['slime', 'skeleton', 'creeper', 'spider'], barrier: 'bumper', arch: 'carousel', block: 'claw_machine' },
  { id: 'waterpark', name: 'Аквапарк', description: 'Тайфун, волновой бассейн и дорожки под горками.',
    monsters: ['guardian', 'drowned', 'elder_guardian'], barrier: 'wave', arch: 'water_slide', block: 'typhoon' },
  { id: 'store', name: 'Мебельный магазин', description: 'Срезай путь между диванами и складскими стеллажами.',
    monsters: ['spider', 'zombie', 'skeleton', 'witch', 'enderman'], barrier: 'sofa', arch: 'shelf', block: 'wardrobe' },
  { id: 'nether', name: 'Нижний мир', description: 'Мосты над лавой, магмовые кубы и огненные шары гастов.',
    monsters: ['magma_cube', 'blaze', 'ghast', 'wither_skeleton'], barrier: 'lava', arch: 'basalt_arch', block: 'basalt' },
  { id: 'castle', name: 'Замок на Хеллоуин', description: 'Тыквенные фонари, призраки и низкие решётки.',
    monsters: ['ghost', 'pumpkin_guard', 'witch'], barrier: 'pumpkins', arch: 'portcullis', block: 'cauldron' },
  { id: 'end', name: 'Край', description: 'Обсидиановые башни и фиолетовое дыхание дракона.',
    monsters: ['enderman', 'shulker'], barrier: 'crystal', arch: 'chorus', block: 'obsidian' },
];
