import * as THREE from '../../../lib/three.module.js'
import METHOD from '../method/map.target.method.js'
import CHILD_PARAM from '../param/map.child.param.js'

export default class{
    constructor({group}){
        this.param = {
            color: 0xff3232,
            size: 25,
            z: 30,
            width: 500,
            height: 500,
            bound: 250,
            count: 12,
            gap: 0.005,
            lineOpacity: 0.5,
            moveGroupOpacity: [
                1, // triangle
                0.6, // vertical line
                1 // plane
            ],
            length: 100,
            planeWidth: ~~(1920 * 0.02),
            planeHeight: ~~(1080 * 0.02)
        }

        this.tw = []
        this.ctx = []

        this.init(group)
    }


    // init
    init(group){
        this.create(group)
        // this.initTween()
    }


    // close
    close(){
        this.createCloseTween()
    }


    // create
    create(group){
        const positionGroup = new THREE.Group()
        this.wrapper = new THREE.Group()

        for(let i = 0; i < this.param.count; i++){
            const localGroup = new THREE.Group()
            const moveGroup = new THREE.Group()
            
            // line
            const line = this.createLineMesh(this.param.lineOpacity)
            localGroup.add(line)

            // tri
            const tri = this.createTriMesh()
            moveGroup.add(tri)

            // vertical line
            const verLine = this.createVertLineMesh(0)
            moveGroup.add(verLine)

            // plane
            const plane = this.createPlaneMesh(i)
            // plane.rotation.y = 90 * RADIAN
            plane.position.y = -(1 / (Math.sqrt(3) * 2)) * this.param.size / 2
            plane.position.z = this.param.length + this.param.planeHeight / 2
            plane.rotation.x = 90 * RADIAN
            moveGroup.add(plane)

            localGroup.position.set(Math.random() * this.param.width - this.param.width / 2, Math.random() * this.param.height - this.param.height / 2, 0)

            localGroup.add(moveGroup)
            positionGroup.add(localGroup)
        }

        positionGroup.position.set(0, CHILD_PARAM.y, this.param.z)

        this.wrapper.add(positionGroup)
        group.add(this.wrapper)
    }
    // triangle
    createTriMesh(){
        const geometry = this.createTriGeometry()
        const material = this.createTriMaterial()
        return new THREE.Mesh(geometry, material)
    }
    createTriGeometry(){
        const geometry = new THREE.BufferGeometry()

        const {position} = METHOD.createAttribute(this.param)

        geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))

        return geometry
    }
    createTriMaterial(){
        return new THREE.MeshBasicMaterial({
            color: this.param.color,
            transparent: true,
            opacity: 0,
            // depthWrite: false,
            // depthTest: false,
            // blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    }
    // line
    createLineMesh(opacity){
        const geometry = this.createLineGeometry()
        const material = this.createLineMaterial(opacity)
        return new THREE.LineSegments(geometry, material)
    }
    createLineGeometry({x, y} = {}){
        const geometry = new THREE.BufferGeometry()
        
        const {position, draw} = METHOD.createLineAttribute({x, y, ...this.param})

        geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
        geometry.attributes.position.needsUpdate = true
        geometry.draw = draw

        geometry.setDrawRange(0, 0)

        return geometry
    }
    createLineMaterial(opacity){
        return new THREE.LineBasicMaterial({
            color: this.param.color,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending
        })
    }
    // vertical line
    createVertLineMesh(opacity){
        const geometry = this.createVerLineGeometry()
        const material = this.createLineMaterial(opacity)
        return new THREE.Line(geometry, material)
    }
    createVerLineGeometry(){
        const geometry = new THREE.BufferGeometry()

        const y = (1 / (Math.sqrt(3) * 2)) * this.param.size / 2
        const position = new Float32Array([0, -y, 0, 0, -y, this.param.length])

        geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))

        return geometry
    }
    // plane
    createPlaneMesh(idx){
        const geometry = this.createPlaneGeometry()
        const material = this.createPlaneMaterial(idx)
        return new THREE.Mesh(geometry, material)
    }
    createPlaneGeometry(){
        return new THREE.PlaneGeometry(this.param.planeWidth, this.param.planeHeight)
    }
    createPlaneMaterial(idx){
        this.ctx[idx] = METHOD.createCanvasTexture({width: this.param.planeWidth, height: this.param.planeHeight})
        const texture = new THREE.CanvasTexture(this.ctx[idx].canvas)
        texture.needsUpdate = true

        return new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    }


    // tween
    initTween(){
        this.createOpenTween()
    }
    // open
    createOpenTween(){
        const children = this.wrapper.children[0].children

        children.forEach((localGroup, i) => {
            const [line, moveGroup] = localGroup.children

            const route = METHOD.createRoute(this.param)

            const start = {opacity: 0}
            const end = {opacity: [1, 0, 1, 0, 1]}

            const tw = new TWEEN.Tween(start)
            .to(end, 200)
            .onStart(() => this.startOpenTween({line, moveGroup, ...route}))
            .onUpdate(() => this.updateOpenTween(moveGroup, start))
            .onComplete(() => this.completeOpenTween(line, moveGroup, route, i))
            .delay(i * 50)
            .start()
        })
    }
    startOpenTween({line, moveGroup, x, y, theta}){
        // const [tri, verLine] = moveGroup.children

        moveGroup.position.set(x, y, 0)
        moveGroup.rotation.z = theta + 90 * RADIAN
        
        line.geometry.dispose()
        line.geometry = this.createLineGeometry({x, y})
        line.material.opacity = this.param.lineOpacity

        // tri.rotation.z = theta + 90 * RADIAN
    }
    updateOpenTween(moveGroup, {opacity}){
        moveGroup.children.forEach((child, i) => child.material.opacity = opacity * this.param.moveGroupOpacity[i])
    }
    completeOpenTween(line, moveGroup, route, idx){
        this.createMoveTween(line, moveGroup, route, idx)
    }
    // close
    createCloseTween(){
        const children = this.wrapper.children[0].children

        children.forEach((group, i) => {
            const [line, moveGroup] = group.children

            const route = METHOD.createRoute(this.param)

            const start = {opacity: 1}
            const end = {opacity: [0, 1, 0]}

            const tw = new TWEEN.Tween(start)
            .to(end, 100)
            .onStart(() => this.startCloseTween(line))
            .onUpdate(() => this.updateCloseTween(moveGroup, start))
            .onComplete(() => this.completeCloseTween())
            .delay(i * 50)
            .start()
        })
    }
    startCloseTween(line){
        line.material.opacity = 0
    }
    updateCloseTween(moveGroup, {opacity}){
        moveGroup.children.forEach((child, i) => child.material.opacity = opacity * this.param.moveGroupOpacity[i])
    }
    completeCloseTween(){
        this.removeMoveTween()
    }
    // move
    createMoveTween(line, moveGroup, route, idx){
        const {x, y, dist} = route

        const start = {x: x, y: y}
        const end = {x: -x, y: -y}

        this.tw[idx] = new TWEEN.Tween(start)
        .to(end, 70000 + dist * 2)
        .onUpdate(() => this.updateMoveTween({line, moveGroup, dist, start, x, y, idx}))
        .start()
    }
    updateMoveTween({line, moveGroup, dist, start, x, y, idx}){
        const currentDist = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2)

        moveGroup.position.set(start.x, start.y, 0)
        line.geometry.setDrawRange(0, currentDist / dist * line.geometry.draw)
    }
    removeMoveTween(){
        for(let i = 0; i < this.tw.length; i++){
            TWEEN.remove(this.tw[i])
            // this.tw[i] = null
        }
    }

    
    // animate
    animate({camera}){
        // console.log(camera.position)
        // this.raycaster.set(new THREE.Vector3(0, 0, 1000), new THREE.Vector3(0, 0, -1))
        // const intersects = this.raycaster.intersectObjects(this.wrapper.children[0].children.map(child => child.children[1]))
        // for(let i = 0; i < intersects.length; i++){
        //     intersects[i].object.material.color = new THREE.Color(0x32eaff)
        // }
        // console.log(intersects.length)
        const planes = this.wrapper.children[0].children.map(child => child.children[1].children[2])

        this.ctx.forEach((ctx, i) => {
            METHOD.drawCanvasTexture(ctx)
            planes[i].material.map.needsUpdate = true
        })
    }
}