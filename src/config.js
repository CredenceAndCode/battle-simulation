export const CONFIG = {
  terrain: {
    dimensions: {
      maxHeight: 5,
      length: 9,
      width: 9,
    },
    opacity: 1,
    initialColor: "#6cff1d",
    finalColor: "#1DFF5B",
    outlineColor: "#FF1D1D",
  },
  planes: {
    exhaustLength: 1,
    exhaustOpacity: 1,
    count: 7,
  },
  missiles: {
    arcColor: "#FFFF1D",
    speedScale: 2,
    count: 3,
    impactSizeScale: 1.2,
    impactColor: "#9D0F0F",
  },
  reflection: {
    opacity: 0.01,
  },
  camera: {
    rotationSpeedFactor: 0.2,
  },
  timer: 30,
};
