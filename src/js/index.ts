import APP from "./class/app/app";
import MAP from "./class/map/map";
const TWEEN = require("tween.js");

const app = new APP();
const map = new MAP();

app.render();
map.render(app);

const animate = () => {
  // renderThree
  map.animate({ app });
  //TWEEN.update
  TWEEN.update();
  window.requestAnimationFrame(animate);
};

animate();
