// Регионы известного мира.
// У вестеросских регионов есть polygon (замкнутый контур в координатах карты),
// сумма полигонов складывается в континент. Остальные регионы — только метка.

export const CONTINENTS = {
  westeros: 'Вестерос',
  essos: 'Эссос',
  south: 'Острова и юг',
}

export const REGIONS = {
  beyond: {
    name: 'Стена и земли за ней',
    continent: 'westeros',
    color: '#9fb4c7',
    label: { text: 'ЗА СТЕНОЙ', x: 345, y: 120 },
    polygon: [
      [150, 232], [140, 150], [160, 110], [200, 70], [250, 50], [320, 42],
      [390, 52], [440, 72], [500, 100], [540, 140], [558, 185], [545, 224],
    ],
  },
  north: {
    name: 'Север',
    continent: 'westeros',
    color: '#b7c4c9',
    label: { text: 'СЕВЕР', x: 330, y: 450 },
    polygon: [
      [150, 232], [545, 224],
      [560, 290], [530, 330], [560, 380], [515, 430], [545, 470], [505, 510],
      [470, 550], [445, 585], [450, 620],
      [390, 660], [330, 668], [245, 655],
      [230, 640], [185, 600], [150, 540], [170, 480], [140, 420], [155, 360], [135, 300],
    ],
  },
  vale: {
    name: 'Долина Аррен',
    continent: 'westeros',
    color: '#aebfd4',
    label: { text: 'ДОЛИНА', x: 505, y: 755 },
    polygon: [
      [390, 660], [450, 620], [490, 600], [520, 625], [560, 610], [585, 620],
      [555, 640], [590, 655], [550, 670], [575, 700], [540, 730], [560, 770],
      [520, 800], [470, 810], [430, 790], [410, 720],
    ],
  },
  ironislands: {
    name: 'Железные острова',
    continent: 'westeros',
    color: '#a8b5ab',
    label: { text: 'ЖЕЛЕЗНЫЕ О-ВА', x: 128, y: 748 },
    polygon: null,
  },
  riverlands: {
    name: 'Речные земли',
    continent: 'westeros',
    color: '#b9cbb2',
    label: { text: 'РЕЧНЫЕ ЗЕМЛИ', x: 330, y: 725 },
    polygon: [
      [245, 655], [330, 668], [390, 660], [410, 720], [430, 790], [340, 815],
      [300, 790], [225, 760], [245, 740], [230, 700], [255, 680],
    ],
  },
  westerlands: {
    name: 'Западные земли',
    continent: 'westeros',
    color: '#d1bfa4',
    label: { text: 'ЗАПАДНЫЕ\nЗЕМЛИ', x: 252, y: 848 },
    polygon: [
      [225, 760], [300, 790], [340, 815], [330, 890], [215, 940],
      [195, 910], [210, 870], [185, 830], [200, 790],
    ],
  },
  crownlands: {
    name: 'Королевские земли',
    continent: 'westeros',
    color: '#cdbfb0',
    label: { text: 'КОРОЛЕВСКИЕ\nЗЕМЛИ', x: 448, y: 852 },
    polygon: [
      [430, 790], [470, 810], [510, 830], [545, 820], [560, 845], [520, 860],
      [505, 880], [520, 905], [540, 920], [480, 935], [410, 935], [370, 870],
      [340, 815],
    ],
  },
  stormlands: {
    name: 'Штормовые земли',
    continent: 'westeros',
    color: '#b3bfa8',
    label: { text: 'ШТОРМОВЫЕ\nЗЕМЛИ', x: 490, y: 1000 },
    polygon: [
      [540, 920], [565, 940], [585, 930], [600, 955], [570, 965], [545, 975],
      [560, 1000], [540, 1040], [575, 1055], [555, 1075], [520, 1085],
      [495, 1090], [450, 1060], [420, 1050], [400, 990], [410, 935], [480, 935],
    ],
  },
  reach: {
    name: 'Простор',
    continent: 'westeros',
    color: '#c3cf9f',
    label: { text: 'ПРОСТОР', x: 285, y: 985 },
    polygon: [
      [215, 940], [330, 890], [340, 815], [370, 870], [410, 935], [400, 990],
      [420, 1050], [370, 1075], [330, 1115], [280, 1125], [240, 1110],
      [195, 1090], [215, 1065], [185, 1050], [205, 1020], [190, 980],
    ],
  },
  dorne: {
    name: 'Дорн',
    continent: 'westeros',
    color: '#dbc491',
    label: { text: 'ДОРН', x: 530, y: 1172 },
    polygon: [
      [495, 1090], [530, 1105], [585, 1120], [620, 1140], [640, 1160],
      [600, 1185], [540, 1200], [480, 1190], [430, 1205], [380, 1190],
      [330, 1115], [370, 1075], [420, 1050], [450, 1060],
    ],
  },

  freecities: {
    name: 'Вольные города',
    continent: 'essos',
    color: '#c9b8a0',
    label: { text: 'ВОЛЬНЫЕ ГОРОДА', x: 845, y: 760 },
    polygon: null,
  },
  dothraki: {
    name: 'Дотракийское море',
    continent: 'essos',
    color: '#c6c69a',
    label: { text: 'ДОТРАКИЙСКОЕ МОРЕ', x: 1230, y: 640 },
    polygon: null,
  },
  slaversbay: {
    name: 'Залив Работорговцев',
    continent: 'essos',
    color: '#cbb694',
    label: { text: 'ЗАЛИВ\nРАБОТОРГОВЦЕВ', x: 1218, y: 860 },
    polygon: null,
  },
  valyria: {
    name: 'Валирия',
    continent: 'essos',
    color: '#b3a08e',
    label: { text: 'ВАЛИРИЯ', x: 1112, y: 985 },
    polygon: null,
  },
  qarth: {
    name: 'Кварт и Красная пустошь',
    continent: 'essos',
    color: '#d6bd8d',
    label: { text: 'КРАСНАЯ ПУСТОШЬ', x: 1408, y: 872 },
    polygon: null,
  },
  fareast: {
    name: 'Дальний Восток',
    continent: 'essos',
    color: '#c2ad92',
    label: { text: 'ЙИ ТИ', x: 1660, y: 860 },
    polygon: null,
  },
  ib: {
    name: 'Иб и Дрожащее море',
    continent: 'essos',
    color: '#b4bec0',
    label: { text: 'ИБ', x: 1430, y: 238 },
    polygon: null,
  },

  stepstones: {
    name: 'Ступени',
    continent: 'south',
    color: '#b9b4a0',
    label: { text: 'СТУПЕНИ', x: 672, y: 1130 },
    polygon: null,
  },
  summerisles: {
    name: 'Летние острова',
    continent: 'south',
    color: '#a9c795',
    label: { text: 'ЛЕТНИЕ ОСТРОВА', x: 700, y: 1360 },
    polygon: null,
  },
  sothoryos: {
    name: 'Соториос',
    continent: 'south',
    color: '#9dbb8b',
    label: { text: 'СОТОРИОС', x: 1180, y: 1290 },
    polygon: null,
  },
}

export const TYPES = {
  capital: { name: 'Столица / резиденция', plural: 'Столицы' },
  castle: { name: 'Замок', plural: 'Замки' },
  city: { name: 'Город', plural: 'Города' },
  town: { name: 'Городок', plural: 'Городки' },
  ruin: { name: 'Руины', plural: 'Руины' },
  landmark: { name: 'Место', plural: 'Места' },
}
