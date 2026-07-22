// Смещения подписей маркеров в плотных местах карты.
// x/y — сдвиг в единицах глифа (по умолчанию подпись по центру, y=16),
// a — text-anchor ('start' | 'middle' | 'end').

export const LABEL_OVERRIDES = {
  // Железные острова
  pyke: { x: -9, y: 4, a: 'end' },
  lordsport: { x: 9, y: 4, a: 'start' },
  tentowers: { x: 9, y: 2, a: 'start' },
  oldwyk: { x: 0, y: -9 },
  // Север и Перешеек
  whiteharbor: { x: 9, y: 2, a: 'start' },
  moatcailin: { x: 9, y: -2, a: 'start' },
  greywater: { x: -9, y: 6, a: 'end' },
  sisters: { x: 0, y: -9 },
  hardhome: { x: 9, y: 2, a: 'start' },
  eastwatch: { x: 9, y: 2, a: 'start' },
  shadowtower: { x: -9, y: 2, a: 'end' },
  // Долина
  eyrie: { x: 0, y: -9 },
  gatesmoon: { x: -9, y: 4, a: 'end' },
  runestone: { x: 8, y: 2, a: 'start' },
  // Речные земли
  riverrun: { x: -9, y: 2, a: 'end' },
  harrenhal: { x: 0, y: 18 },
  godseye: { x: -9, y: 8, a: 'end' },
  // Запад
  casterly: { x: 0, y: -10 },
  lannisport: { x: -9, y: 6, a: 'end' },
  castamere: { x: -9, y: 2, a: 'end' },
  // Королевские земли
  kingslanding: { x: -10, y: 2, a: 'end' },
  duskendale: { x: 9, y: 0, a: 'start' },
  dragonstone: { x: 10, y: 4, a: 'start' },
  rosby: { x: 9, y: 8, a: 'start' },
  driftmark: { x: 9, y: 6, a: 'start' },
  crackclaw: { x: 9, y: 0, a: 'start' },
  // Штормовые земли
  stormsend: { x: 10, y: 0, a: 'start' },
  griffinsroost: { x: 9, y: -4, a: 'start' },
  // Дорн
  plankytown: { x: -9, y: 2, a: 'end' },
  watergardens: { x: -9, y: 6, a: 'end' },
  starfall: { x: -9, y: 2, a: 'end' },
  // Эссос
  braavos: { x: -9, y: 2, a: 'end' },
  tyrosh: { x: -9, y: 2, a: 'end' },
  myr: { x: 9, y: 2, a: 'start' },
  chroyane: { x: -9, y: 2, a: 'end' },
  meereen: { x: -9, y: 2, a: 'end' },
  yunkai: { x: -9, y: 2, a: 'end' },
  astapor: { x: -9, y: 2, a: 'end' },
  tolos: { x: 0, y: -9 },
  motherofmountains: { x: 0, y: -9 },
  vaestolorro: { x: 9, y: 2, a: 'start' },
  asshai: { x: -9, y: 2, a: 'end' },
  // Юг
  talltrees: { x: 9, y: 2, a: 'start' },
  shields: { x: 0, y: -9 },
}
