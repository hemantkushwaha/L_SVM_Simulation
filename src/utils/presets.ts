import { Point, DatasetPreset } from '../types';

function randomNormal(mean = 0, stdDev = 1) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}

export function generatePreset(preset: DatasetPreset): Point[] {
  const points: Point[] = [];
  let idCounter = 0;

  const nextId = () => `p_${idCounter++}`;

  switch (preset) {
    case 'linear-sep': {
      // Class -1: Bottom Left cluster
      for (let i = 0; i < 20; i++) {
        points.push({
          id: nextId(),
          x: randomNormal(-1.8, 0.5),
          y: randomNormal(-1.5, 0.5),
          label: -1,
        });
      }
      // Class +1: Top Right cluster
      for (let i = 0; i < 20; i++) {
        points.push({
          id: nextId(),
          x: randomNormal(1.8, 0.5),
          y: randomNormal(1.5, 0.5),
          label: 1,
        });
      }
      break;
    }

    case 'linear-unsep': {
      // Overlapping clusters
      for (let i = 0; i < 25; i++) {
        points.push({
          id: nextId(),
          x: randomNormal(-0.8, 0.9),
          y: randomNormal(-0.6, 0.9),
          label: -1,
        });
      }
      for (let i = 0; i < 25; i++) {
        points.push({
          id: nextId(),
          x: randomNormal(0.8, 0.9),
          y: randomNormal(0.6, 0.9),
          label: 1,
        });
      }
      break;
    }

    case 'circles': {
      // Inner circle (Class -1)
      for (let i = 0; i < 25; i++) {
        const r = 0.5 + Math.random() * 0.8;
        const theta = Math.random() * 2 * Math.PI;
        points.push({
          id: nextId(),
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          label: -1,
        });
      }
      // Outer circle (Class +1)
      for (let i = 0; i < 35; i++) {
        const r = 2.2 + Math.random() * 0.8;
        const theta = Math.random() * 2 * Math.PI;
        points.push({
          id: nextId(),
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          label: 1,
        });
      }
      break;
    }

    case 'moons': {
      const noise = 0.15;
      // Moon 1 (Class -1)
      for (let i = 0; i < 30; i++) {
        const theta = (i / 29) * Math.PI; // from 0 to pi
        const x = 1.5 * Math.cos(theta) - 0.75 + randomNormal(0, noise);
        const y = 1.5 * Math.sin(theta) - 0.4 + randomNormal(0, noise);
        points.push({
          id: nextId(),
          x,
          y,
          label: -1,
        });
      }
      // Moon 2 (Class +1)
      for (let i = 0; i < 30; i++) {
        const theta = (i / 29) * Math.PI; // from 0 to pi
        const x = 0.75 - 1.5 * Math.cos(theta) + randomNormal(0, noise);
        const y = 0.4 - 1.5 * Math.sin(theta) + randomNormal(0, noise);
        points.push({
          id: nextId(),
          x,
          y,
          label: 1,
        });
      }
      break;
    }

    case 'imbalanced': {
      // Majority Class -1
      for (let i = 0; i < 35; i++) {
        points.push({
          id: nextId(),
          x: randomNormal(-1.2, 0.7),
          y: randomNormal(-1.0, 0.7),
          label: -1,
        });
      }
      // Minority Class +1 (only 3 points close by)
      const minorityCoords = [
        { x: 1.2, y: 1.0 },
        { x: 1.5, y: 0.7 },
        { x: 0.9, y: 1.3 },
      ];
      minorityCoords.forEach((coord) => {
        points.push({
          id: nextId(),
          ...coord,
          label: 1,
        });
      });
      break;
    }

    case 'empty':
    default:
      // Return empty array
      break;
  }

  return points;
}
