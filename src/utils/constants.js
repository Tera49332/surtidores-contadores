// Configuración de Estaciones y Puntos de Venta
export const BUSINESSES = [
  {
    id: 'estacion_12589',
    name: 'ESTACIÓN 12589',
    code: '12589',
    pin: '12589',
    services: [
      {
        id: 'calle1',
        name: 'Calle 1',
        product: 'Diesel e+',
        icon: '⛽',
        color: '#1a1a1a', // Fondo negro
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle2',
        name: 'Calle 2',
        product: 'Diesel e+',
        icon: '⛽',
        color: '#1a1a1a', // Fondo negro
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle3',
        name: 'Calle 3',
        product: 'Diesel e+10',
        icon: '⛽',
        color: '#c59b27', // Fondo dorado
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle4',
        name: 'Calle 4',
        product: 'Diesel e+10',
        icon: '⛽',
        color: '#c59b27', // Fondo dorado
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle5',
        name: 'Calle 5',
        product: 'Gna95',
        icon: '⛽',
        color: '#43a047', // Fondo verde claro
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle6',
        name: 'Calle 6',
        product: 'Gna95',
        icon: '⛽',
        color: '#43a047', // Fondo verde claro
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      },
      {
        id: 'calle7',
        name: 'Calle 7',
        product: 'Adblue',
        icon: '💧',
        color: '#0277bd', // Fondo azul
        textColor: '#ffffff',
        counters: [
          { id: 'totalizador', name: 'Totalizador', short: 'Totalizador', unit: 'L' }
        ]
      }
    ],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: 14, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: 6, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  },
  {
    id: 'estacion_96544',
    name: 'ESTACIÓN 96544',
    code: '96544',
    pin: '96544',
    services: [
      {
        id: 'calle1',
        name: 'Calle 1',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' }, // Verde oscuro
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' }, // Verde claro
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' }, // Dorado
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' } // Negro
        ]
      },
      {
        id: 'calle2',
        name: 'Calle 2',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle3',
        name: 'Calle 3',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle4',
        name: 'Calle 4',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      }
    ],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: null, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: null, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  },
  {
    id: 'estacion_33885',
    name: 'ESTACIÓN 33885',
    code: '33885',
    pin: '33885',
    services: [
      {
        id: 'calle1',
        name: 'Calle 1',
        product: 'Adblue',
        icon: '💧',
        color: '#0277bd',
        textColor: '#ffffff',
        counters: [
          { id: 'adblue', name: 'Adblue', short: 'Adblue', product: 'Adblue', color: '#0277bd', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle2',
        name: 'Calle 2',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle3',
        name: 'Calle 3',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle4',
        name: 'Calle 4',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle5',
        name: 'Calle 5',
        icon: '⛽',
        counters: [
          { id: 'gna98', name: 'Gna 98', short: 'Gna 98', product: 'Gna 98', color: '#1b5e20', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle6',
        name: 'Calle 6',
        icon: '⛽',
        counters: [
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle7',
        name: 'Calle 7',
        icon: '⛽',
        counters: [
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle8',
        name: 'Calle 8',
        product: 'Gasóleo B',
        icon: '⛽',
        color: '#1a1a1a',
        textColor: '#ff3333',
        counters: [
          { id: 'gasoleob', name: 'Gasóleo B', short: 'Gasóleo B', product: 'Gasóleo B', color: '#1a1a1a', textColor: '#ff3333', unit: 'L' }
        ]
      }
    ],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: 30, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: 9, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  },
  {
    id: 'estacion_34081',
    name: 'ESTACIÓN 34081',
    code: '34081',
    pin: '34081',
    services: [
      {
        id: 'calle1',
        name: 'Calle 1',
        icon: '⛽',
        counters: [
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle2',
        name: 'Calle 2',
        icon: '⛽',
        counters: [
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle3',
        name: 'Calle 3',
        icon: '⛽',
        counters: [
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle4',
        name: 'Calle 4',
        icon: '⛽',
        counters: [
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle5',
        name: 'Calle 5',
        icon: '⛽',
        counters: [
          { id: 'gna95', name: 'Gna 95', short: 'Gna 95', product: 'Gna 95', color: '#43a047', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele10', name: 'Diesel e+ 10', short: 'Diesel e+ 10', product: 'Diesel e+ 10', color: '#c59b27', textColor: '#ffffff', unit: 'L' },
          { id: 'diesele', name: 'Diesel e+', short: 'Diesel e+', product: 'Diesel e+', color: '#1a1a1a', textColor: '#ffffff', unit: 'L' }
        ]
      },
      {
        id: 'calle6',
        name: 'Calle 6',
        product: 'Adblue',
        icon: '💧',
        color: '#0277bd',
        textColor: '#ffffff',
        counters: [
          { id: 'adblue', name: 'Adblue', short: 'Adblue', product: 'Adblue', color: '#0277bd', textColor: '#ffffff', unit: 'L' }
        ]
      }
    ],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: null, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: null, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  },
  {
    id: 'estacion_6082',
    name: 'ESTACIÓN 6082',
    code: '6082',
    pin: '06082',
    services: [],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: null, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: null, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  },
  {
    id: 'estacion_33405',
    name: 'ESTACIÓN 33405',
    code: '33405',
    pin: '33405',
    services: [],
    gasConfig: {
      butano: { id: 'butano', name: 'Butano (normal)', capacity: null, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
      propano: { id: 'propano', name: 'Propano (11kg)', capacity: null, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
    }
  }
];

// Helper para obtener estilo y badge de un totalizador
export function getCounterStyle(service, counterObj) {
  if (counterObj && counterObj.product) {
    return {
      product: counterObj.product,
      color: counterObj.color || '#005B8E',
      textColor: counterObj.textColor || '#ffffff'
    };
  }
  return {
    product: service?.product || '',
    color: service?.color || '#005B8E',
    textColor: service?.textColor || '#ffffff'
  };
}

// Session helper import
import { getActiveBusinessId } from './session.js';

export function getBusinessById(id) {
  return BUSINESSES.find(b => b.id === id) || BUSINESSES[0];
}

export function getBusinessByPin(pin) {
  return BUSINESSES.find(b => b.pin === pin) || null;
}

export function getActiveBusiness() {
  const id = getActiveBusinessId();
  return id ? getBusinessById(id) : BUSINESSES[0];
}

export function getActiveServices() {
  return getActiveBusiness().services;
}

export function getActiveGasConfig() {
  return getActiveBusiness().gasConfig || {
    butano: { id: 'butano', name: 'Butano (normal)', capacity: null, iconImg: '/images/butano.png', color: '#ff6600', textColor: '#ffffff' },
    propano: { id: 'propano', name: 'Propano (11kg)', capacity: null, iconImg: '/images/propano.png', color: '#005b8e', textColor: '#ffffff' }
  };
}

export function getActiveBusinessName() {
  return getActiveBusiness().name;
}

export const ADMIN_PIN = '35253';
export const BUSINESS_NAME = 'ESTACIÓN DE SERVICIO';
export const SERVICES = BUSINESSES[0].services;
