import APP from "./class/app/app.js";
import MAP from "./class/map/map.js";
import OPEN from "./class/open/open.js";
import LEFT from "./class/left/left.js";
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
      elementModules: {
        open: OPEN,
        left: LEFT,
      },
      elements: {
        open: null,
      },
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    getElement() {
      return (name: any, child: any) => {
        if (!this.elements[name]) return [];
        else return this.elements[name].get(child);
      };
    },
  },
  methods: {
    init() {
      this.initThree();
      this.initElement();
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

    // element
    addElement() {
      for (const module in this.elementModules) {
        this.elements[module] = null;
      }
    },
    initElement() {
      for (const module in this.elementModules) {
        const instance = this.elementModules[module];

        this.elements[module] = new instance(threeObj);
      }
    },
    animateElement() {
      for (const i in this.elements) {
        if (!this.elements[i].animate) continue;
        this.elements[i].animate(threeObj);
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
      this.animateElement();
      requestAnimationFrame(this.animate);
    },
  },
}).mount("#canvas");
