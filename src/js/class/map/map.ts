import * as THREE from "three";
import PARAM from "./param/map.param.js";
import PUBLIC_METHOD from "../../method/method.js";

import CHILD from "./build/map.child.build";
import MIRROR from "./build/map.mirror.build.js";
import EPICENTER from "./build/map.epicenter.build.js";
import RADAR from "./build/map.radar.build.js";
import CONNECTION from "./build/map.connection.build.js";
import GRID from "./build/map.grid.build.js";
import TARGET from "./build/map.target.build.js";

import { isAllTrue } from "../../utils";
import { RADIAN } from "../../const/const.js";
import APP from "../app/app";
import { maps } from "../../data/maps";
import { CONFIG } from "../../../config.js";

interface AnimateMapProps {
  app: APP;
}

interface SingleMap {
  one_pixel_size: number;
  image_width: string;
  image_height: string;
  coordinates: Coordinates[];
}

interface Coordinates {
  ox: string;
  oy: string;
  rx: string;
  ry: string;
}

interface modules {
  [key: string]:
    | typeof MIRROR
    | typeof CHILD
    | typeof EPICENTER
    | typeof RADAR
    | typeof CONNECTION
    | typeof GRID
    | typeof TARGET;
}

export default class {
  param: { fov: number; near: number; far: number; pos: number };
  modules: modules;
  group: { [key: string]: THREE.Group } = {};
  comp: { [key: string]: any } = {};
  build: THREE.Group;
  map: { [key: string]: SingleMap };
  mapIndex: number;
  play: boolean;
  timer: number;
  currentTime: number;
  oldTime: number;
  playInterval: boolean;
  element: any;
  scene: THREE.Scene | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  size: { el: { w: any; h: any }; obj: { w: number; h: number } } | undefined;
  proxy: { [key: string | symbol]: boolean } | undefined;

  constructor() {
    this.param = {
      fov: 60,
      near: 0.1,
      far: 10000,
      pos: 1000,
    };

    this.modules = {
      mirror: MIRROR,
      child: CHILD,
      epicenter: EPICENTER,
      radar: RADAR,
      connection: CONNECTION,
      grid: GRID,
      target: TARGET,
    };
    this.group = {};
    this.comp = {};
    this.build = new THREE.Group();

    this.map = maps;
    this.mapIndex = 0;

    this.play = true;

    this.timer = CONFIG.timer * 1000;
    this.currentTime = window.performance.now();
    this.oldTime = window.performance.now();
    this.playInterval = true;

    this.init();
  }

  // init
  init() {
    this.initGroup();
    this.initRenderObject();
    this.initProxy();
    this.create();
    this.add();
  }
  initGroup() {
    for (const module in this.modules) {
      this.group[module] = new THREE.Group();
      this.comp[module] = null;
    }
  }
  initRenderObject() {
    this.element = document.querySelector(".map-object");

    const { width, height } = this.element.getBoundingClientRect();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      this.param.fov,
      width / height,
      this.param.near,
      this.param.far
    );

    this.camera.position.z = this.param.pos;

    this.size = {
      el: {
        w: width,
        h: height,
      },
      obj: {
        w: PUBLIC_METHOD.getVisibleWidth(this.camera, 0),
        h: PUBLIC_METHOD.getVisibleHeight(this.camera, 0),
      },
    };
  }
  initProxy() {
    const self = this;

    const proxyObj: { [key: string | symbol]: boolean } = {
      play: false,
      child: false,
      epicenter: false,
      connection: false,
      // target: false
    };

    this.proxy = new Proxy(proxyObj, {
      set(obj, prop, value) {
        obj[prop] = value;

        // when open close, play map
        if (prop === "play" && obj["play"] === true) {
          self.updateTimes();
          self.executeChild();
        }

        // start tweens after child tween done
        if (prop === "child" && obj["child"] === true) {
          self.play = true;
          self.executeTween();
        }

        // disappear current map and display new map
        if (isAllTrue(obj)) {
          self.setProxyToFalse();
          self.setMap();
          self.executeClose();
        }

        return true;
      },
    });
  }

  // add
  add() {
    for (let i in this.group) this.build.add(this.group[i]);
    this.scene!.add(this.build);
  }

  // create
  create() {
    for (const module in this.modules) {
      const instance = this.modules[module];
      const group = this.group[module];

      group.rotation.x = PARAM.rotation * RADIAN;

      this.comp[module] = new instance({
        group,
        size: this.size,
        map: this.map[Object.keys(this.map)[0]],
        parent: this,
        proxy: this.proxy,
        camera: this.camera,
      });
    }
  }

  // interval
  intervalStopTween() {
    // interval after open close
    if (!this.play) {
      this.oldTime = window.performance.now();
      return;
    }

    this.currentTime = window.performance.now();
    if (this.currentTime - this.oldTime > this.timer) {
      this.oldTime = this.currentTime;
      this.play = false;
    }
  }

  // execute
  executeChild() {
    this.comp.child.open(this.group.child);
  }
  executeTween() {
    this.comp.epicenter.initTween();
    this.comp.connection.initTween();
    this.comp.target.initTween();
  }
  executeClose() {
    for (const comp in this.comp) {
      if (!this.comp[comp].close) continue;
      this.comp[comp].close(this.group[comp]);
    }
  }
  updateTimes() {
    this.oldTime = window.performance.now();
    this.currentTime = window.performance.now();
  }

  // set
  setMap() {
    const keys = Object.keys(this.map);
    this.mapIndex = (this.mapIndex + 1) % keys.length;

    for (const comp in this.comp) {
      if (!this.comp[comp].setMap) continue;
      this.comp[comp].setMap(this.map[keys[this.mapIndex]]);
    }
  }
  setProxyToFalse() {
    for (const proxy in this.proxy) {
      if (proxy === "play") continue;
      this.proxy[proxy] = false;
    }
  }

  // animate
  animate(props: AnimateMapProps) {
    this.render(props.app);
    this.animateObject();
    this.rotationGroup();
    this.intervalStopTween();
  }
  render(app: APP) {
    const rect = this.element.getBoundingClientRect();
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left = rect.left;
    const bottom = app.renderer!.domElement.clientHeight - rect.bottom;

    // app.renderer.clear()

    app.renderer!.setScissor(left, bottom, width, height);
    app.renderer!.setViewport(left, bottom, width, height);

    this.camera!.lookAt(this.scene!.position);
    app.renderer!.render(this.scene!, this.camera!);
  }
  animateObject() {
    for (let i in this.comp) {
      if (!this.comp[i] || !this.comp[i].animate) continue;
      this.comp[i].animate({ camera: this.camera });
    }
  }
  rotationGroup() {
    for (const group in this.group) {
      // if(group === 'grid') continue
      this.group[group].rotation.z += 0.002 * CONFIG.camera.rotationSpeedFactor;
    }
  }

  // resize
  resize() {
    const rect = this.element.getBoundingClientRect();
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;

    this.camera!.aspect = width / height;
    this.camera!.updateProjectionMatrix();

    this.size = {
      el: {
        w: width,
        h: height,
      },
      obj: {
        w: PUBLIC_METHOD.getVisibleWidth(this.camera, 0),
        h: PUBLIC_METHOD.getVisibleHeight(this.camera, 0),
      },
    };

    this.resizeObject();
  }
  resizeObject() {
    for (let i in this.comp) {
      if (!this.comp[i] || !this.comp[i].resize) continue;
      this.comp[i].resize(this.size);
    }
  }
}
