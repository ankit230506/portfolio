const canvas = document.querySelector('#tubes-canvas');
let tubesApp;
const initialPalette = {
  tubes: ['#f967fb', '#53bc28', '#6958d5'],
  lights: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'],
};

// The library listens on the canvas. Forward the real page pointer to that fixed canvas
// while leaving pointer events available to links, buttons, and the page content.
window.addEventListener('pointermove', (event) => {
  const pointerEvent = new PointerEvent('pointermove', {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    isPrimary: event.isPrimary,
    bubbles: false,
  });
  canvas.dispatchEvent(pointerEvent);
  canvas.dispatchEvent(new MouseEvent('mousemove', {
    clientX: event.clientX,
    clientY: event.clientY,
    bubbles: false,
  }));
}, { passive: true });

async function mountTubes() {
  try {
    const { default: TubesCursor } = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
    const palette = window.portfolioTubePalette || initialPalette;
    tubesApp = TubesCursor(canvas, {
      tubes: {
        colors: palette.tubes,
        lights: { intensity: 200, colors: palette.lights },
      },
    });
    window.addEventListener('portfolio-tube-colors', (event) => {
      if (!tubesApp?.tubes) return;
      tubesApp.tubes.setColors(event.detail.tubes);
      tubesApp.tubes.setLightsColors(event.detail.lights);
    });
  } catch (error) {
    console.error('Could not load the original TubesCursor effect:', error);
  }
}

mountTubes();
