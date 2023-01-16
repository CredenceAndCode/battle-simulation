import APP from "./class/app/app";
import MAP from "./class/map/map.js";
const TWEEN = require("tween.js");

import { createApp } from "vue";

const threeObj: { [key: string]: any } = {};
createApp({
  data() {
    return {
      threeObjModules: {
        app: APP,
        map: MAP,
      },
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.initThree();
      this.animate();

      window.addEventListener("resize", this.onWindowResize, false);
    },

    // three
    initThree() {
      for (const module in this.threeObjModules) {
        const instance = this.threeObjModules[module];

        threeObj[module] = new instance(threeObj);
      }
    },
    resizeThree() {
      for (const i in threeObj) {
        if (!threeObj[i].resize) continue;
        threeObj[i].resize(threeObj);
      }
    },
    renderThree() {
      for (const i in threeObj) {
        if (!threeObj[i].animate) continue;
        threeObj[i].animate(threeObj);
      }
    },

    // event
    onWindowResize() {
      this.resizeThree();
    },

    // render
    render() {
      this.renderThree();
      TWEEN.update();
    },
    animate() {
      this.render();
      requestAnimationFrame(this.animate);
    },
  },
}).mount("#canvas");
