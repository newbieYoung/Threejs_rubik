import * as THREE from 'libs/three.js'
import Rubik from 'objects/rubik.js'

let context   = canvas.getContext('webgl');

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.initThree();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.render();
  }

  //初始化渲染器
  initThree(){
    this.context = context;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({
      context: this.context
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFFFF, 1.0);
  }

  //初始化相机
  initCamera(){
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 600;
    this.camera.up.x = 0;//正方向
    this.camera.up.y = 1;
    this.camera.up.z = 0;
    this.camera.lookAt({
      x: 0,
      y: 0,
      z: 0
    });
    //视角控制
    //this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    //this.controller.target = new THREE.Vector3(0, 0, -75);//设置控制点
  }

  //初始化场景
  initScene(){
    this.scene = new THREE.Scene();
  }

  //初始化光线
  initLight() {
    this.light = new THREE.AmbientLight(0xfefefe);
    this.scene.add(this.light);
  }

  //初始化物体
  initObject() {
    var cubeParams = {//魔方参数
      x: -75,
      y: 75,
      z: 75,
      num: 3,
      len: 50,
      colors: ['rgba(255,193,37,1)', 'rgba(0,191,255,1)',
        'rgba(50,205,50,1)', 'rgba(178,34,34,1)',
        'rgba(255,255,0,1)', 'rgba(255,255,255,1)']
    };
    //生成魔方小正方体
    this.cubes = new Rubik(cubeParams.x, cubeParams.y, cubeParams.z, cubeParams.num, cubeParams.len, cubeParams.colors);
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      this.scene.add(this.cubes[i]);//并依次加入到场景中
    }
  }

  //渲染
  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this),canvas);
  }
}
