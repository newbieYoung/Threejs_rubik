import * as THREE from 'libs/three.js'
require('libs/three-orbit-controls.js')
import BasicRubik from 'objects/BasicRubik.js'

let context   = canvas.getContext('webgl');

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.raycaster = new THREE.Raycaster();//光线碰撞检测器
    this.mouse = new THREE.Vector2();//存储鼠标坐标或者触摸坐标
    this.isRotating = false;//魔方是否正在转动
    this.intersect;//碰撞光线穿过的元素
    this.normalize;//触发平面法向量
    this.startPoint;//触发点
    this.movePoint;
    //魔方转动的六个方向
    this.xLine = new THREE.Vector3(1, 0, 0);//X轴正方向
    this.xLineAd = new THREE.Vector3(-1, 0, 0);//X轴负方向
    this.yLine = new THREE.Vector3(0, 1, 0);//Y轴正方向
    this.yLineAd = new THREE.Vector3(0, -1, 0);//Y轴负方向
    this.zLine = new THREE.Vector3(0, 0, 1);//Z轴正方向
    this.zLineAd = new THREE.Vector3(0, 0, -1);//Z轴负方向

    this.initThree();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.render();
    this.initEvent();

    //视角控制
    this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controller.enableZoom = false;
    this.controller.target = new THREE.Vector3(0, 0, 0);//设置控制点
  }

  /**
   * 初始化渲染器
   */
  initThree() {
    this.context = context;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      context: this.context
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFFFF, 1.0);

    this.devicePixelRatio = window.devicePixelRatio;
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;
    this.renderer.setPixelRatio(this.devicePixelRatio);
  }

  /**
   * 初始化相机
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.set(450,300,450);
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt({x: 0,y: 0,z: 0});
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
    this.rubik = new BasicRubik(this);
    this.rubik.model();
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
    wx.onTouchStart(this.startCube.bind(this))
    wx.onTouchMove(this.moveCube.bind(this))
    wx.onTouchEnd(this.stopCube.bind(this));
  }

  /**
   * 触摸结束
   */
  stopCube() {
    this.intersect = null;
    this.startPoint = null
  }

  /**
   * 触摸魔方
   */
  startCube(event) {
    this.getIntersects(event);
    //魔方没有处于转动过程中且存在碰撞物体
    if (!this.isRotating && this.intersect) {
      this.controller.enabled = false;//焦点在魔方上时禁止视角变换
      this.startPoint = this.intersect.point;//开始转动，设置起始点
    } else {
      this.controller.enabled = true;
    }
  }

  /**
   * 滑动魔方
   */
  moveCube(event) {
    var self = this;
    this.getIntersects(event);
    if (this.intersect) {
      if (!this.isRotating && this.startPoint) {//魔方没有进行转动且满足进行转动的条件
        this.movePoint = this.intersect.point;
        if (!this.movePoint.equals(this.startPoint)) {//和起始点不一样则意味着可以得到转动向量了
          this.isRotating = true;//转动标识置为true
          var sub = this.movePoint.sub(this.startPoint);//计算转动向量
          var direction = this.getDirection(sub);//获得方向
          var elements = this.rubik.getBoxs(this.intersect, direction);
          var startTime = new Date().getTime();
          requestAnimationFrame(function (timestamp) {
            self.rotateAnimation(elements, direction, timestamp, 0);
          });
        }
      }
    }
  }

  /**
   * 绕着世界坐标系的某个轴旋转
   */
  rotateAroundWorldY(obj, rad) {
    var x0 = obj.position.x;
    var z0 = obj.position.z;
    /**
     * 因为物体本身的坐标系是随着物体的变化而变化的，
     * 所以如果使用rotateZ、rotateY、rotateX等方法，
     * 多次调用后就会出问题，先改为Quaternion实现。
     */
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    obj.quaternion.premultiply(q);
    obj.position.x = Math.cos(rad) * x0 + Math.sin(rad) * z0;
    obj.position.z = Math.cos(rad) * z0 - Math.sin(rad) * x0;
  }
  rotateAroundWorldZ(obj, rad) {
    var x0 = obj.position.x;
    var y0 = obj.position.y;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad);
    obj.quaternion.premultiply(q);
    obj.position.x = Math.cos(rad) * x0 - Math.sin(rad) * y0;
    obj.position.y = Math.cos(rad) * y0 + Math.sin(rad) * x0;
  }
  rotateAroundWorldX(obj, rad) {
    var y0 = obj.position.y;
    var z0 = obj.position.z;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
    obj.quaternion.premultiply(q);
    obj.position.y = Math.cos(rad) * y0 - Math.sin(rad) * z0;
    obj.position.z = Math.cos(rad) * z0 + Math.sin(rad) * y0;
  }

  /**
   * 旋转动画
   */
  rotateAnimation(elements, direction, currentstamp, startstamp, laststamp) {
    var self = this;
    var totalTime = 500;//转动的总运动时间
    if (startstamp === 0) {
      startstamp = currentstamp;
      laststamp = currentstamp;
    }
    if (currentstamp - startstamp >= totalTime) {
      currentstamp = startstamp + totalTime;
      this.isRotating = false;
      this.startPoint = null;
      this.rubik.updateCubeIndex(elements);
    }
    switch (direction) {
      //绕z轴顺时针
      case 0.1:
      case 1.2:
      case 2.4:
      case 3.3:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldZ(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      //绕z轴逆时针
      case 0.2:
      case 1.1:
      case 2.3:
      case 3.4:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldZ(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      //绕y轴顺时针
      case 0.4:
      case 1.3:
      case 4.3:
      case 5.4:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldY(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      //绕y轴逆时针
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldY(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      //绕x轴顺时针
      case 2.2:
      case 3.1:
      case 4.1:
      case 5.2:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldX(elements[i], 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      //绕x轴逆时针
      case 2.1:
      case 3.2:
      case 4.2:
      case 5.1:
        for (var i = 0; i < elements.length; i++) {
          this.rotateAroundWorldX(elements[i], -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        }
        break;
      default:
        break;
    }
    if (currentstamp - startstamp < totalTime) {
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, startstamp, currentstamp);
      });
    }
  }

  /**
   * 获得旋转方向
   */
  getDirection(vector3) {
    var direction;
    //判断差向量和x、y、z轴的夹角
    var xAngle = vector3.angleTo(this.xLine);
    var xAngleAd = vector3.angleTo(this.xLineAd);
    var yAngle = vector3.angleTo(this.yLine);
    var yAngleAd = vector3.angleTo(this.yLineAd);
    var zAngle = vector3.angleTo(this.zLine);
    var zAngleAd = vector3.angleTo(this.zLineAd);
    var minAngle = Math.min.apply(null,[xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

    switch (minAngle) {
      case xAngle:
        direction = 0;//向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
        if (this.normalize.equals(this.yLine)) {
          direction = direction + 0.1;//绕z轴顺时针
        } else if (this.normalize.equals(this.yLineAd)) {
          direction = direction + 0.2;//绕z轴逆时针
        } else if (this.normalize.equals(this.zLine)) {
          direction = direction + 0.3;//绕y轴逆时针
        } else {
          direction = direction + 0.4;//绕y轴顺时针
        }
        break;
      case xAngleAd:
        direction = 1;//向x轴反方向旋转90度
        if (this.normalize.equals(this.yLine)) {
          direction = direction + 0.1;//绕z轴逆时针
        } else if (this.normalize.equals(this.yLineAd)) {
          direction = direction + 0.2;//绕z轴顺时针
        } else if (this.normalize.equals(this.zLine)) {
          direction = direction + 0.3;//绕y轴顺时针
        } else {
          direction = direction + 0.4;//绕y轴逆时针
        }
        break;
      case yAngle:
        direction = 2;//向y轴正方向旋转90度
        if (this.normalize.equals(this.zLine)) {
          direction = direction + 0.1;//绕x轴逆时针
        } else if (this.normalize.equals(this.zLineAd)) {
          direction = direction + 0.2;//绕x轴顺时针
        } else if (this.normalize.equals(this.xLine)) {
          direction = direction + 0.3;//绕z轴逆时针
        } else {
          direction = direction + 0.4;//绕z轴顺时针
        }
        break;
      case yAngleAd:
        direction = 3;//向y轴反方向旋转90度
        if (this.normalize.equals(this.zLine)) {
          direction = direction + 0.1;//绕x轴顺时针
        } else if (this.normalize.equals(this.zLineAd)) {
          direction = direction + 0.2;//绕x轴逆时针
        } else if (this.normalize.equals(this.xLine)) {
          direction = direction + 0.3;//绕z轴顺时针
        } else {
          direction = direction + 0.4;//绕z轴逆时针
        }
        break;
      case zAngle:
        direction = 4;//向z轴正方向旋转90度
        if (this.normalize.equals(this.yLine)) {
          direction = direction + 0.1;//绕x轴顺时针
        } else if (this.normalize.equals(this.yLineAd)) {
          direction = direction + 0.2;//绕x轴逆时针
        } else if (this.normalize.equals(this.xLine)) {
          direction = direction + 0.3;//绕y轴顺时针
        } else {
          direction = direction + 0.4;//绕y轴逆时针
        }
        break;
      case zAngleAd:
        direction = 5;//向z轴反方向旋转90度
        if (this.normalize.equals(this.yLine)) {
          direction = direction + 0.1;//绕x轴逆时针
        } else if (this.normalize.equals(this.yLineAd)) {
          direction = direction + 0.2;//绕x轴顺时针
        } else if (this.normalize.equals(this.xLine)) {
          direction = direction + 0.3;//绕y轴逆时针
        } else {
          direction = direction + 0.4;//绕y轴顺时针
        }
        break;
      default:
        break;
    }
    return direction;
  }

  /**
   * 获取操作焦点以及该焦点所在平面的法向量
   */
  getIntersects(event) {
    //触摸事件和鼠标事件获得坐标的方式有点区别
    if (event.touches) {
      var touch = event.touches[0];
      this.mouse.x = (touch.clientX / this.width) * 2 - 1;
      this.mouse.y = -(touch.clientY / this.height) * 2 + 1;
    } else {
      this.mouse.x = (event.clientX / this.width) * 2 - 1;
      this.mouse.y = -(event.clientY / this.height) * 2 + 1;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    //Raycaster方式定位选取元素，可能会选取多个，以第一个为准
    var intersects = this.raycaster.intersectObjects(this.scene.children);
    //如果操作焦点在魔方上则取消移动，反之恢复移动
    if (intersects.length) {
      try {
        if (intersects[0].object.cubeType === 'coverCube') {
          this.intersect = intersects[1];
          this.normalize = intersects[0].face.normal;
        } else {
          this.intersect = intersects[0];
          this.normalize = intersects[1].face.normal;
        }
      } catch (err) {
        //nothing
      }
    } 
  }
}
