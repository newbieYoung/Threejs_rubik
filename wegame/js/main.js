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
    this.minPercent = 0.1;//正反视图至少占10%区域
    this.frontViewName = 'front-rubik';//正视图名称
    this.endViewName = 'end-rubik';//反视图名称

    this.raycaster = new THREE.Raycaster();//光线碰撞检测器
    this.intersect;//碰撞光线穿过的元素
    this.normalize;//触发平面法向量

    /**
     * 魔方转动的六个方向
     * xLine    X轴正方向
     * xLineAd  X轴负方向
     * yLine    Y轴正方向
     * yLineAd  Y轴负方向
     * zLine    Z轴正方向
     * zLineAd  Z轴负方向
     */
    this.xLine = new THREE.Vector3(1, 0, 0);
    this.xLineAd = new THREE.Vector3(-1, 0, 0);
    this.yLine = new THREE.Vector3(0, 1, 0);
    this.yLineAd = new THREE.Vector3(0, -1, 0);
    this.zLine = new THREE.Vector3(0, 0, 1);
    this.zLineAd = new THREE.Vector3(0, 0, -1);

    /**
     * 魔方转动参数
     * isHandControl 是否处于手动控制
     * isAnimating 是否出于自动滚动动画中
     * speed 转动速度
     * animateSpeed 动画速度
     * directionAxis 二维转动方向
     * threshold 阀值
     * startPoint 起始点
     * movePoint 移动点
     * sumRad 累计角度
     * target 目标魔方
     */
    this.rotateParams = {
      speed: 2,
      threshold: Math.PI / 2 / 12,
      animateSpeed: Math.PI / 2 / 300,
      isHandControl: false,
      isAnimating: false,
      sumRad: 0,
      startPoint: null,
      directionAxis: null,
      movePoint: null,
      elements: null,
      direction: null,
      target:null,
      animationEnd: function () {
        this.rotateParams.target.updateCubeIndex(this.rotateParams.elements);
        this.rotateParams.isAnimating = false;
        this.rotateParams.sumRad = 0;//清0
        this.rotateParams.direction = null;
        this.rotateParams.elements = null;
        this.target = null;
      }
    };

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
    this.frontRubik.resizeHeight(0,1);

    //反视角
    this.endRubik = new BasicRubik(this);
    this.endRubik.model(this.endViewName);
    this.endRubik.resizeHeight(0,-1);

    this.touchLine = new TouchLine(this);
    this.rubikResize((1-this.minPercent), this.minPercent);//默认正视图占90%区域，反视图占10%区域
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
    }else{
      if (!this.rotateParams.isAnimating) {//魔方自动滚动动画结束之后才能开启下一次转动
        this.getIntersects(event);
        //魔方没有处于手动转动且存在碰撞物体
        if (!this.rotateParams.isHandControl && this.intersect) {
          this.rotateParams.startPoint = this.intersect.point;//开始转动，设置起始点
        }
      }
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
    }else{
      var point = [event.touches[0].pageX, event.touches[0].pageY];
      //魔方没有处于手动转动且触摸点在魔方上
      if (!this.rotateParams.isHandControl && this.rotateParams.startPoint) {
        /**
         * 判断魔方转动方向以及转动元素，
         * 判断时需要把二维坐标转换为三维坐标。
         */
        this.getIntersects(event);
        this.rotateParams.movePoint = this.intersect.point;
        var sub = this.rotateParams.movePoint.sub(this.rotateParams.startPoint);
        this.rotateParams.direction = this.getDirection(sub);
        this.rotateParams.elements = this.rotateParams.target.getBoxs(this.intersect, this.rotateParams.direction);

        /**
         * 初始化转动控制点，
         * 转动时直接使用二维坐标即可。
         */
        this.rotateParams.movePoint = new THREE.Vector2();
        this.rotateParams.movePoint.set(point[0], point[1]);
        this.rotateParams.startPoint = new THREE.Vector2();
        this.rotateParams.startPoint.set(point[0], point[1]);

        this.rotateParams.isHandControl = true;//设置魔方状态处于手动转动魔方
      }

      //魔方处于手动转动
      if (this.rotateParams.isHandControl) {
        this.rotateParams.movePoint.set(point[0], point[1]);
        var sub = this.rotateParams.movePoint.sub(this.rotateParams.startPoint);
        if (Math.abs(sub.x) > 0 || Math.abs(sub.y) > 0) {
          if (this.rotateParams.directionAxis == null) {
            if (Math.abs(sub.x) > Math.abs(sub.y)) {
              if (sub.x > 0) {
                this.rotateParams.directionAxis = '+x';
              } else {
                this.rotateParams.directionAxis = '-x';
              }
            } else {
              if (sub.y > 0) {
                this.rotateParams.directionAxis = '+y';
              } else {
                this.rotateParams.directionAxis = '-y';
              }
            }
          }
          this.rotateElements(this.rotateParams, sub);
          this.rotateParams.startPoint.set(point[0], point[1]);
        }
      }
    }
  }

  /**
   * 触摸结束
   */
  touchEnd(){
    if (this.rotateParams.isHandControl) {
      var self = this;
      //手动操作结束      
      this.rotateParams.isHandControl = false;
      this.intersect = null;
      this.normalize = null;
      this.rotateParams.startPoint = null;
      this.rotateParams.movePoint = null;
      this.rotateParams.directionAxis = null;
      var finalRad = 0;
      var tag = this.rotateParams.sumRad < 0 ? -1 : 1;
      if (Math.abs(this.rotateParams.sumRad) >= this.rotateParams.threshold) {//超过阀值
        finalRad = tag * Math.PI / 2;
      }
      //开始自动转动动画
      this.rotateParams.isAnimating = true;
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(self.rotateParams, timestamp, timestamp, finalRad, tag);
      });
    }
    this.touchLine.disable();
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
    var minAngle = Math.min.apply(null, [xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

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
   * 转动元素
   * 统一使用宽度为计算弧度，否则宽高不一致会导致，水平滑动和竖直滑动触发阀值的距离不一样，影响体验。
   */
  rotateElements(params, vector) {
    var rad = 0;
    var len = 0;
    var len = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    if (this.rotateParams.directionAxis.indexOf('y') != -1) {
      len = vector.y == 0 ? 0 : vector.y / Math.abs(vector.y) * len;
    } else {
      len = vector.x == 0 ? 0 : vector.x / Math.abs(vector.x) * len;
    }
    switch (params.direction) {
      case 3.3:
      case 2.3:
      case 3.2:
      case 2.2:
        len = -len;
        break;
      case 0.2:
      case 5.2:
      case 4.1:
      case 1.1:
        if (this.rotateParams.directionAxis == '-x' ||
          this.rotateParams.directionAxis == '-y') {
          len = -len;
        }
        break;
      case 0.1:
      case 4.2:
      case 1.2:
      case 5.1:
        if (this.rotateParams.directionAxis == '+x' ||
          this.rotateParams.directionAxis == '+y') {
          len = -len;
        }
        break;
      default:
        break;
    }
    switch (params.direction) {
      case 3.3:
      case 0.1:
      case 1.1:
      case 1.2:
      case 0.2:
      case 2.3:
      case 2.4:
      case 3.4:
        rad = Math.PI / 2 * len / this.width * params.speed;
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldZ(params.elements[i], rad);
        }
        break;
      case 0.4:
      case 1.3:
      case 5.4:
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
      case 4.3:
        rad = Math.PI / 2 * len / this.width * params.speed;
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldY(params.elements[i], rad);
        }
        break;
      case 4.1:
      case 5.1:
      case 2.2:
      case 3.2:
      case 5.2:
      case 4.2:
      case 3.1:
      case 2.1:
        rad = Math.PI / 2 * len / this.width * params.speed;
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldX(params.elements[i], rad);
        }
        break;
      default:
        break;
    }
    params.sumRad += rad;
    //手动滚动超过90度处理
    if (Math.abs(params.sumRad) > Math.PI / 2) {
      if (params.sumRad > 0) {
        params.sumRad -= Math.PI / 2;
      } else {
        params.sumRad += Math.PI / 2;
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
  rotateAnimation(params, currentstamp, laststamp, finalRad, tag) {
    var self = this;
    var isEnd = false;
    var rad = tag * params.animateSpeed * (currentstamp - laststamp);

    //动画结束
    if (finalRad == 0 && Math.abs(rad) >= Math.abs(params.sumRad)) {
      isEnd = true;
      rad = params.sumRad;
    }
    if (Math.abs(finalRad) == Math.PI / 2 && Math.abs(rad) >= Math.abs(Math.abs(finalRad) - Math.abs(params.sumRad))) {
      isEnd = true;
      rad = finalRad - params.sumRad;
    }

    if (!isEnd) {
      if (finalRad == 0) {
        params.sumRad -= rad;
      }
      if (Math.abs(finalRad) == Math.PI / 2) {
        params.sumRad += rad;
      }
    }

    switch (params.direction) {
      case 0.1:
      case 1.2:
      case 2.4:
      case 3.3:
      case 0.2:
      case 1.1:
      case 2.3:
      case 3.4:
        if (finalRad == 0) {
          rad = -rad;
        }
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldZ(params.elements[i], rad);
        }
        break;
      case 0.4:
      case 1.3:
      case 4.3:
      case 5.4:
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
        if (finalRad == 0) {
          rad = -rad;
        }
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldY(params.elements[i], rad);
        }
        break;
      case 2.2:
      case 3.1:
      case 4.1:
      case 5.2:
      case 2.1:
      case 3.2:
      case 4.2:
      case 5.1:
        if (finalRad == 0) {
          rad = -rad;
        }
        for (var i = 0; i < params.elements.length; i++) {
          this.rotateAroundWorldX(params.elements[i], rad);
        }
        break;
      default:
        break;
    }

    if (!isEnd) {
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(params, timestamp, currentstamp, finalRad, tag);
      });
    } else {
      var callback = params.animationEnd.bind(self);
      callback();
    }
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
    if (this.touchLine.screenRect.top > touch.clientY){//正视图
      this.rotateParams.target = this.frontRubik;
      rubikTypeName = this.frontViewName;
    } else if (this.touchLine.screenRect.top + this.touchLine.screenRect.height < touch.clientY){//反视图
      this.rotateParams.target = this.endRubik;
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
    if (intersects.length>=2) {
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
