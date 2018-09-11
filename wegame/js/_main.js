import * as THREE from 'threejs/three.js'
require('threejs/controls/OrbitControls.js')
import BasicRubik from 'object/Rubik.js'

const Context = canvas.getContext('webgl');

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {

    this.context = Context;//绘图上下文
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.devicePixelRatio = window.devicePixelRatio;

    this.viewCenter = new THREE.Vector3(0, 0, 0);//原点

    this.initThree();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.render();
    this.initEvent();
  }

  /**
   * 初始化渲染器
   */
  initThree() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      context: this.context
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFFFF, 1.0);
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;
    this.renderer.setPixelRatio(this.devicePixelRatio);
  }

  /**
   * 初始化相机
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.set(200 / this.camera.aspect, 150 / this.camera.aspect, 200 / this.camera.aspect);//保证魔方在不同宽高比的屏幕中宽度所占的比例基本一致
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt(this.viewCenter);
  }

  /**
   * 初始化光线
   */
  initScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * 初始化光线
   */
  initLight() {
    this.light = new THREE.AmbientLight(0xfefefe);
    this.scene.add(this.light);
  }

  /**
   * 初始化物体
   */
  initObject() {
    this.frontRubik = new BasicRubik(this);
    this.frontRubik.model();
    this.frontRubik.resizeHeight(.5,1);

    this.endRubik = new BasicRubik(this);
    this.endRubik.model();
    this.endRubik.resizeHeight(.5, -1);
  }

  /**
   * 渲染
   */
  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this), canvas);
  }

  /**
   * 初始化事件
   */
  initEvent() {
  }
}
