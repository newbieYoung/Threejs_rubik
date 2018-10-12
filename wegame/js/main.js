import * as THREE from 'threejs/three.js'
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
    this.minPercent = 0.1;//正反视图至少占10%区域
    this.frontViewName = 'front-rubik';//正视图名称
    this.endViewName = 'end-rubik';//反视图名称

    this.raycaster = new THREE.Raycaster();//光线碰撞检测器
    this.isRotating = false;//魔方是否正在转动
    this.targetRubik;
    this.intersect;//碰撞光线穿过的元素
    this.normalize;//触发平面法向量
    this.startPoint;//触发点
    this.movePoint;//移动点

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
    this.frontRubik.model(this.frontViewName);
    this.frontRubik.resizeHeight(0, 1);

    //反视角
    this.endRubik = new BasicRubik(this);
    this.endRubik.model(this.endViewName);
    this.endRubik.resizeHeight(0, -1);

    this.touchLine = new TouchLine(this);
    this.rubikResize((1 - this.minPercent), this.minPercent);//默认正视图占90%区域，反视图占10%区域

    
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
  touchStart(event) {
    var touch = event.touches[0];
    this.startPoint = touch;
    if (touch.clientY >= this.touchLine.screenRect.top && touch.clientY <= this.touchLine.screenRect.top + this.touchLine.screenRect.height) {
      this.touchLine.enable();
    } else {
      this.getIntersects(event);
      if (!this.isRotating && this.intersect) {//触摸点在魔方上且魔方没有转动
        this.startPoint = this.intersect.point;//开始转动，设置起始点
      }
    }
  }

  /**
   * 触摸移动
   */
  touchMove(event) {
    var self = this;
    var touch = event.touches[0];
    if (this.touchLine.isActive) {//滑动touchline
      this.touchLine.move(touch.clientY);
      var frontPercent = touch.clientY / window.innerHeight;
      var endPercent = 1 - frontPercent;
      this.rubikResize(frontPercent, endPercent);
    } else {
      this.getIntersects(event);
      if (!this.isRotating && this.startPoint && this.intersect) {//移动点在魔方上且魔方没有转动
        this.movePoint = this.intersect.point;
        if (!this.movePoint.equals(this.startPoint)) {//触摸点和移动点不一样则意味着可以得到转动向量
          this.isRotating = true;//转动标识置为true
          var sub = this.movePoint.sub(this.startPoint);//计算转动向量
          var direction = this.targetRubik.getDirection(sub, this.normalize);//获得方向
          console.log(direction);
          var elements = this.targetRubik.getBoxs(this.intersect, direction);
          var startTime = new Date().getTime();
          requestAnimationFrame(function (timestamp) {
            self.targetRubik.rotateAnimation(elements, direction, timestamp, 0);
          });
        }
      }
    }
  }

  /**
   * 触摸结束
   */
  touchEnd() {
    this.touchLine.disable();
  }

  /**
   * 获取操作焦点以及该焦点所在平面的法向量
   */
  getIntersects(event) {
    var touch = event.touches[0];
    var mouse = new THREE.Vector2();
    mouse.x = (touch.clientX / this.width) * 2 - 1;
    mouse.y = -(touch.clientY / this.height) * 2 + 1;
    this.raycaster.setFromCamera(mouse, this.camera);
    var rubikTypeName;
    if (this.touchLine.screenRect.top > touch.clientY) {//正视图
      this.targetRubik = this.frontRubik;
      rubikTypeName = this.frontViewName;
    } else if (this.touchLine.screenRect.top + this.touchLine.screenRect.height < touch.clientY) {//反视图
      this.targetRubik = this.endRubik;
      rubikTypeName = this.endViewName;
    }
    //Raycaster方式定位选取元素，可能会选取多个，以第一个为准
    var children = this.scene.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].childType == rubikTypeName) {
        children = children[i];
        break;
      }
    }
    var intersects = this.raycaster.intersectObjects(children.children);
    if (intersects.length >= 2) {
      if (intersects[0].object.cubeType === 'coverCube') {
        this.intersect = intersects[1];
        this.normalize = intersects[0].face.normal;
      } else {
        this.intersect = intersects[0];
        this.normalize = intersects[1].face.normal;
      }
    }
  }

  /**
   * 正反魔方区域占比变化
   */
  rubikResize(frontPercent, endPercent) {
    this.frontRubik.resizeHeight(frontPercent, 1);
    this.endRubik.resizeHeight(endPercent, -1);
  }
}
