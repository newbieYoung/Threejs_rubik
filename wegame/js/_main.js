import * as THREE from 'threejs/three.js'
require('threejs/controls/OrbitControls.js')
import BasicRubik from 'object/Rubik.js'
import TouchLine from 'object/TouchLine.js'

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
    /**
     * 相机放置在Z轴上方便计算；
     * Z轴坐标需要除以屏幕宽高比保证魔方在不同宽高比的屏幕中宽度所占的比例基本一致
     */
    this.camera.position.set(0, 0, 300 / this.camera.aspect);
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt(this.viewCenter);

    this.originWidth = 248;
    this.originHeight = this.originWidth / this.camera.aspect;
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
    //正视角
    this.frontRubik = new BasicRubik(this);
    this.frontRubik.model('front');
    this.frontRubik.resizeHeight(0,1);

    //反视角
    this.endRubik = new BasicRubik(this);
    this.endRubik.model('back');
    this.endRubik.resizeHeight(0,-1);

    this.touchLine = new TouchLine(this);
    this.rubikResize(0.8, 0.2);//默认正视图占80%区域，反视图占20%区域
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
    wx.onTouchStart(this.touchStart.bind(this));
    wx.onTouchMove(this.touchMove.bind(this));
    wx.onTouchEnd(this.touchEnd.bind(this));
  }

  /**
   * 触摸开始
   */
  touchStart(event){
    var touch = event.touches[0];
    this.startPoint = touch;
    if (touch.clientY >= this.touchLine.screenRect.top && touch.clientY <= this.touchLine.screenRect.top + this.touchLine.screenRect.height){
      this.touchLine.enable();
    }
  }

  /**
   * 触摸移动
   */
  touchMove(event){
    var touch = event.touches[0];
    if (this.touchLine.isActive){//滑动touchline
      this.touchLine.move(touch.clientY);
      var frontPercent = touch.clientY / window.innerHeight;
      var endPercent = 1 - frontPercent;
      this.rubikResize(frontPercent, endPercent);
    }
  }

  /**
   * 正反魔方区域占比变化
   */
  rubikResize(frontPercent, endPercent){
    if (this.touchLine.isVisiable) {
      this.frontRubik.resizeHeight(frontPercent, 1);
      this.endRubik.resizeHeight(endPercent, -1);
    } else {
      if (frontPercent >= 0.5) {
        this.frontRubik.resizeHeight(1, 1);
        this.endRubik.resizeHeight(0, -1);
      } else {
        this.frontRubik.resizeHeight(0, 1);
        this.endRubik.resizeHeight(1, -1);
      }
    }
  }

  /**
   * 触摸结束
   */
  touchEnd(){

  }
}
