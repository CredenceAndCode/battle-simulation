import * as THREE from "three";
import PUBLIC_METHOD from "../../../method/method.js";
import METHOD from "../method/map.child.method.js";
import PARAM from "../param/map.child.param.js";
import { CONFIG } from "../../../../config";
import { createNoise3D } from "simplex-noise";

interface Coordinates {
  ox: string;
  oy: string;
  rx: string;
  ry: string;
}
interface Map {
  one_pixel_size: number;
  image_width: string;
  image_height: string;
  coordinates: Coordinates[];
}

interface ChildProps {
  map: Map;
  parent: any; // TODO
  proxy: typeof Proxy; // TODO
}
const TWEEN = require("tween.js");
// the rectangles that make up the map
export default class {
  map: any;
  index: any[][];
  parent: any;
  parentProxy: any;
  wrapper: THREE.Group | undefined;

  constructor(idkObject: any) {
    const { map, parent, proxy } = idkObject;
    this.map = map;

    this.index = METHOD.createIndex(
      ~~(this.map.coordinates.length * PARAM.div),
      this.map.coordinates.length
    );

    this.parent = parent;
    this.parentProxy = proxy;
  }

  init(group: any) {
    this.create(group);
    this.createOpenTween();
  }

  // open
  open(group: any) {
    console.log("creating plane mesh");

    this.index = METHOD.createIndex(
      ~~(this.map.coordinates.length * PARAM.div),
      this.map.coordinates.length
    );

    this.init(group);
  }

  // close
  close(group: any) {
    this.createCloseTween(group);
  }

  // create
  create(group: any) {
    const positionGroup = new THREE.Group();
    this.wrapper = new THREE.Group();
    const plane = this.createPlaneMesh();

    this.setMeshProps(plane);

    positionGroup.position.set(PARAM.width / -2, PARAM.height / 2 + PARAM.y, 0);

    positionGroup.add(plane);
    this.wrapper.add(positionGroup);
    group.add(this.wrapper);
  }
  // plane
  createPlaneMesh() {
    const terrainGeometry = this.createTerrain();
    // const outlineGeometry = this.createOutline(terrainGeometry);

    const terrainMaterial = this.createPlaneMaterial();
    // const outlineMaterial = this.createOutlineMaterial();

    // terrainGeometry.merge(outlineGeometry);

    const mesh = new THREE.InstancedMesh(
      terrainGeometry,
      terrainMaterial,
      this.map.coordinates.length
    );

    return mesh;
  }
  createPlaneGeometry() {}

  createOutlinedTerrainGeometry() {
    const terrain = this.createTerrain();
    const outlines = this.createOutline(terrain);

    const combinedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries([
      terrain,
      outlines,
    ]);

    return combinedGeometry;
  }

  createTerrain() {
    return new THREE.BoxGeometry(
      CONFIG.terrain.dimensions.width,
      CONFIG.terrain.dimensions.length,
      CONFIG.terrain.dimensions.maxHeight
    );
  }

  createOutline(objGeometry: any) {
    return new THREE.WireframeGeometry(objGeometry);
  }

  createOutlineMaterial() {
    // return new THREE.MeshBasicMaterial({
    //   color: CONFIG.terrain.outlineColor,
    //   transparent: false,
    //   opacity: 1.0,
    //   depthWrite: false,
    //   depthTest: false,
    //   blending: THREE.AdditiveBlending,
    // });

    return new THREE.LineBasicMaterial({
      color: CONFIG.terrain.outlineColor,
      linewidth: 10,
    });
  }

  createPlaneMaterial() {
    return new THREE.MeshBasicMaterial({
      color: CONFIG.terrain.finalColor,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
  }
  setMeshProps(plane: THREE.InstancedMesh) {
    // plane.col.colors = [];

    this.map.coordinates.forEach((data: any, i: any) => {
      const { rx, ry } = data;

      const x = rx * PARAM.width;
      const y = ry * -PARAM.height;

      const matrix = new THREE.Matrix4();

      const noise = createNoise3D(); // TODO , I might have done this wrong

      // the height of each rectangle changes each time
      const scale = PUBLIC_METHOD.normalize(noise, 0.1, 4, -1, 1);

      const color =
        Math.floor(PUBLIC_METHOD.normalize(noise, 3, 35, -1, 1)) *
        (Math.random() > 0.9 ? 2 : 1) *
        CONFIG.terrain.opacity;

      matrix.multiply(new THREE.Matrix4().makeTranslation(x, y, 0));
      matrix.multiply(new THREE.Matrix4().makeScale(1, 1, scale));
      matrix.multiply(
        new THREE.Matrix4().makeTranslation(0, 0, PARAM.size / 2)
      );

      plane.setMatrixAt(i, matrix);
      plane.setColorAt(i, new THREE.Color(CONFIG.terrain.initialColor));
      // plane.colors.push(color);

      // if(i === 80 || i === 503) plane.setColorAt(i, new THREE.Color(0xffffff))

      // edge
      // const planeEdge = this.createEdgeMesh(new THREE.BoxGeometry(PARAM.size, PARAM.size, PARAM.size))
      // planeEdge.applyMatrix4(matrix)

      // positionGroup.add(planeEdge)
    });

    plane.instanceColor!.needsUpdate = true;
    plane.instanceMatrix.needsUpdate = true;
  }
  // plane edge
  createEdgeMesh(geo: THREE.BufferGeometry) {
    const geometry = this.createEdgeGeometry(geo);
    const material = this.createEdgeMaterial();
    return new THREE.LineSegments(geometry, material);
  }
  createEdgeGeometry(geo: THREE.BufferGeometry) {
    return new THREE.EdgesGeometry(geo);
  }
  createEdgeMaterial() {
    return new THREE.LineBasicMaterial({
      color: PARAM.color,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0.5,
    });
  }

  // tween
  // open tween
  createOpenTween() {
    const plane = this.wrapper!.children[0].children[0];

    this.index.forEach((indices, i) => {
      const start = { light: 0 };
      const end = { light: [1, 0, 1, 0, 1] };

      const tw = new TWEEN.Tween(start)
        .to(end, 200)
        .onUpdate(() => this.updateTween(plane, indices, start))
        .onComplete(() => this.completeOpenTween(i === this.index.length - 1))
        .delay(20 * i)
        .start();
    });
  }
  updateTween(plane: THREE.Event, indices: any, idkObject: any) {
    const { light } = idkObject;
    indices.forEach((i: any) => {
      plane.setColorAt(
        i,
        new THREE.Color(`hsl(186, 100%, ${~~(plane.colors[i] * light)}%)`)
      );
    });
    plane.instanceColor.needsUpdate = true;
  }
  completeOpenTween(isLast: boolean) {
    if (isLast) {
      this.parentProxy.child = true;
    }
  }
  // close tween
  createCloseTween(group: any) {
    console.log("creating tween");
    const plane = this.wrapper!.children[0].children[0];

    this.index.forEach((indices, i) => {
      const start = { light: 0 };
      const end = { light: [0, 1, 0] };

      const tw = new TWEEN.Tween(start)
        .to(end, 100)
        .onUpdate(() => this.updateTween(plane, indices, start))
        .onComplete(() =>
          this.completeCloseTween(group, i === this.index.length - 1)
        )
        .delay(20 * i)
        .start();
    });
  }
  completeCloseTween(group: any, isLast: boolean) {
    if (isLast) {
      this.dispose(group);
      // this.parent.setProxyToFalse()
      this.open(group);
    }
  }

  // dispose
  dispose(group: any) {
    const plane = this.wrapper!.children[0].children[0];
    // plane.geometry.dispose(); // TODO probably need to figure this out
    // plane.material.dispose();

    const positionGroup = this.wrapper!.children[0];
    positionGroup.clear();

    this.wrapper!.clear();
    this.wrapper = undefined;

    group.clear();
  }

  // set
  setMap(map: any) {
    this.map = map;
  }
}
