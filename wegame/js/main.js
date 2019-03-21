import * as THREE from 'threejs/three.js'
import TWEEN from 'tween/tween.js'
import BasicRubik from 'object/Rubik.js'
import TouchLine from 'object/TouchLine.js'
import ResetBtn from 'object/ResetBtn.js'
import DisorganizeBtn from 'object/DisorganizeBtn.js'
import SaveBtn from 'object/SaveBtn.js'
import RestoreBtn from 'object/RestoreBtn.js'
import ChangeBtn from 'object/ChangeBtn.js'
import UIComponent from 'object/UIComponent.js'
import UISelector from 'object/UISelector.js'

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.canvas = canvas;//画布
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.viewCenter = new THREE.Vector3(0, 0, 0);//原点
    this.minPercent = 0.25;//正反视图至少占25%区域
    this.frontViewName = 'front-rubik';//正视角魔方名称
    this.endViewName = 'end-rubik';//反视角魔方名称

    this.raycaster = new THREE.Raycaster();//光线碰撞检测器
    this.intersect;//碰撞光线穿过的元素
    this.normalize;//触摸平面法向量
    this.touch;
    this.targetRubik;//目标魔方
    this.anotherRubik;//非目标魔方
    this.isRotating = false;//魔方是否正在转动
    this.isSliding = false;//魔方是否正在滑动
    this.startTouch;
    this.startPoint;
    this.startNormalize;
    this.moveTouch;
    this.movePoint;
    this.moveNormalize;

    this.initThree();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.render();
  }

  /**
   * 初始化渲染器
   */
  initThree() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas:canvas
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFFFF, 1.0);
  }

  /**
   * 初始化相机
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1500);
    /**
     * 相机放置在Z轴上方便计算；
     * Z轴坐标需要除以屏幕宽高比保证魔方在不同宽高比的屏幕中宽度所占的比例基本一致
     */
    this.camera.position.set(0, 0, 280 / this.camera.aspect);
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt(this.viewCenter);

    //透视投影相机视角为垂直视角，根据视角可以求出原点所在裁切面的高度，然后已知高度和宽高比可以计算出宽度
    this.originHeight = Math.tan(22.5/180*Math.PI)*this.camera.position.z*2;
    this.originWidth = this.originHeight*this.camera.aspect;

    //UI元素逻辑尺寸和屏幕尺寸比率
    this.uiRadio = this.originWidth / window.innerWidth;
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
    //正视角魔方
    this.frontRubik = new BasicRubik(this);
    this.frontRubik.model(this.frontViewName);
    this.frontRubik.resizeHeight(0, 1);

    //反视角魔方
    this.endRubik = new BasicRubik(this);
    this.endRubik.model(this.endViewName);
    this.endRubik.resizeHeight(0, -1);

    //滑动条
    this.touchLine = new TouchLine(this);
    this.rubikResize((1 - this.minPercent), this.minPercent);//默认正视图占85%区域，反视图占15%区域
    this.enterAnimation();

    //变阶按钮
    this.changeBtn = new ChangeBtn(this);

    //阶数选择器
    this.numSelector = new UISelector(this);

    //还原按钮
    this.resetBtn = new ResetBtn(this);

    //打乱按钮
    this.disorganizeBtn = new DisorganizeBtn(this);

    //保存按钮
    this.saveBtn = new SaveBtn(this);

    //读取按钮
    this.restoreBtn = new RestoreBtn(this);
  }

  /**
   * 渲染
   */
  render() {
    this.renderer.clear();

    if(this.tagRubik){
      this.tagRubik.group.rotation.x += 0.01;
      this.tagRubik.group.rotation.y += 0.01;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this), canvas);
  }

  /**
   * 立即渲染一次
   */
  renderOnce(){
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
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
    this.startTouch = event.touches;
    if (!this.isRotating && !this.isSliding){//正在操作魔方时不能进行其它操作
      if (this.changeBtn.isActive){//存在遮罩层
        if (this.numSelector.isHover(touch)){
          var selectedData = this.numSelector.options[this.numSelector.hoveredItem].data;
          this.frontRubik.changeOrder(selectedData.orderNum, selectedData.cubeLen);
          this.endRubik.changeOrder(selectedData.orderNum, selectedData.cubeLen);
          this.disorganizeRubik();
          this.clearTagRubik();
        }
      }else{
        if (this.touchLine.isHover(touch)){
          this.touchLine.enable();
        } else if (this.resetBtn.isHover(touch)){
          this.resetBtn.enable();
          this.resetRubik();
        } else if (this.disorganizeBtn.isHover(touch)){
          this.disorganizeBtn.enable();
          this.disorganizeRubik();
        } else if (this.saveBtn.isHover(touch)){
          this.saveBtn.enable();
          this.saveRubik();
        } else if (this.restoreBtn.isHover(touch)){
          this.restoreBtn.enable();
          this.restoreRubik();
        } else {
          this.getIntersects(event);
          if (this.intersect.length>0){//触摸点在魔方上
            this.startTouch = this.touch;
            this.startPoint = this.intersect;
            this.startNormalize = this.normalize;
          }else{//触摸点没在魔方上
            this.startPoint = new THREE.Vector2(touch.clientX, touch.clientY);
          }
        }
      }
    }
  }

  /**
   * 触摸移动
   */
  touchMove(event) {
    var touch = event.touches[0];
    if (!this.isRotating && !this.changeBtn.isActive){
      if (this.touchLine.isActive) {//滑动touchline
        this.touchLine.move(touch.clientY);
        var frontPercent = touch.clientY / window.innerHeight;
        var endPercent = 1 - frontPercent;
        this.rubikResize(frontPercent, endPercent);
      } else if (!this.resetBtn.isActive && !this.disorganizeBtn.isActive && !this.saveBtn.isActive && !this.restoreBtn.isActive && !this.changeBtn.isActive) {
        if (this.startNormalize && this.startNormalize.length > 0) {//触摸点在魔方上
          if (!this.isSliding){
            this.getIntersects(event);
            if (this.intersect.length){
              this.moveTouch = this.touch;
              this.movePoint = this.intersect;
              this.moveNormalize = this.normalize;
              this.targetRubik.slideMove(this.startTouch, this.moveTouch, this.anotherRubik, this.startPoint, this.startNormalize, this.movePoint, this.moveNormalize);
            }
          }else{
            this.targetRubik.slideMove(this.startTouch, event.touches, this.anotherRubik);
          }
        } else {//触摸点没在魔方上
          this.movePoint = new THREE.Vector2(touch.clientX, touch.clientY);
          if (!this.movePoint.equals(this.startPoint)) {
            this.rotateView();
          }
        }
      }
    }
  }

  /**
   * 触摸结束
   */
  touchEnd() {
    var self = this;
    if (this.isSliding && !this.isRotating){//多指操作时，触摸结束也会触发多次
      this.isRotating = true;
      this.anotherRubik.slideMoveEnd();
      this.targetRubik.slideMoveEnd(function () {
        self.resetRotateParams();
      });
    }else{
      if (this.startTouch && !this.changeBtn.isActive && this.changeBtn.isHover(this.startTouch[0]) && !this.isRotating && !this.isSliding){
        this.changeBtn.enable();
        this.numSelector.showInScene();
      }else{
        this.changeBtn.disable();
        this.numSelector.hideInScene();
      }
      this.numSelector.disable();
      this.touchLine.disable();
      this.resetBtn.disable();
      this.disorganizeBtn.disable();
      this.saveBtn.disable();
      this.restoreBtn.disable();
    }
  }

  /**
   * 进场动画
   */
  enterAnimation() {
    var self = this;
    var isAnimationEnd = false;
    
    var endStatus = {//目标状态
      rotateY: this.frontRubik.group.rotation.y,
      y: this.frontRubik.group.position.y,
      z: this.frontRubik.group.position.z
    }

    this.frontRubik.group.rotateY(-90 / 180 * Math.PI);//把魔方设置为动画开始状态
    this.frontRubik.group.position.y += this.originHeight/3;
    this.frontRubik.group.position.z -= 350;

    var startStatus = {//开始状态
      rotateY: this.frontRubik.group.rotation.y,
      y: this.frontRubik.group.position.y,
      z: this.frontRubik.group.position.z
    }

    var tween = new TWEEN.Tween(startStatus)
                          .to(endStatus, 2000)
                          .easing(TWEEN.Easing.Quadratic.In)
                          .onUpdate(function () {
                            self.frontRubik.group.rotation.y = startStatus.rotateY;
                            self.frontRubik.group.position.y = startStatus.y
                            self.frontRubik.group.position.z = startStatus.z
                          }).onComplete(function(){
                            isAnimationEnd = true;
                          });

    function animate(time) {
      if (!isAnimationEnd){
        requestAnimationFrame(animate);
        TWEEN.update();
      }
    }

    setTimeout(function(){
      tween.start();
      requestAnimationFrame(animate);
    },500)

    this.disorganizeRubik(function () {
      self.initEvent();//进场动画结束之后才能进行手动操作
    })
  }

  /**
   * 重置魔方转动参数
   */
  resetRotateParams(){
    this.isRotating = false;
    this.isSliding = false;
    this.intersect = null;
    this.normalize = null;
    this.touch = null;
    this.targetRubik = null;
    this.anotherRubik = null;
    this.startPoint = null;
    this.startTouch = null;
    this.startNormalize = null;
    this.movePoint = null;
    this.moveTouch = null;
    this.moveNormalize = null;
  }

  /**
   * 获取操作焦点以及该焦点所在平面的法向量
   */
  getIntersects(event) {
    var points = [];
    var vectors = [];
    var events = [];

    var touchs = event.touches;

    //根据第一个触摸点判断视图
    var rubikTypeName;
    var firstTouch = touchs[0];
    if (this.touchLine.screenRect.top > firstTouch.clientY) {
      this.targetRubik = this.frontRubik;
      this.anotherRubik = this.endRubik;
      rubikTypeName = this.frontViewName;
    } else if (this.touchLine.screenRect.top + this.touchLine.screenRect.height < firstTouch.clientY) {
      this.targetRubik = this.endRubik;
      this.anotherRubik = this.frontRubik;
      rubikTypeName = this.endViewName;
    }

    //根据视图选取待判断元素
    var targetIntersect;
    for (var i = 0; i < this.scene.children.length; i++) {
      if (this.scene.children[i].childType == rubikTypeName) {
        targetIntersect = this.scene.children[i];
        break;
      }
    }

    if (targetIntersect){
      //排除掉不符合视图的触摸点
      var results = [];
      for (var i = 0; i < touchs.length; i++) {
        var touch = touchs[i];
        if ((rubikTypeName == this.endViewName && this.touchLine.screenRect.top + this.touchLine.screenRect.height < touch.clientY) || (rubikTypeName == this.frontViewName && this.touchLine.screenRect.top > touch.clientY)) {
          results.push(touch);
        }
      }

      //获取符合规则触摸点在3D场景中的焦点以及该焦点所在平面的法向量
      for (var i = 0; i < results.length; i++) {
        var touch = results[i];
        var mouse = new THREE.Vector2();
        mouse.x = (touch.clientX / this.width) * 2 - 1;
        mouse.y = -(touch.clientY / this.height) * 2 + 1;
        this.raycaster.setFromCamera(mouse, this.camera);
        var intersects = this.raycaster.intersectObjects(targetIntersect.children);
        if (intersects.length >= 2) {
          if (intersects[0].object.cubeType === 'coverCube') {
            points.push(intersects[1]);
            vectors.push(intersects[0].face.normal);
          } else {
            points.push(intersects[0]);
            vectors.push(intersects[1].face.normal);
          }
          events.push(touch);
        }
      }

      this.intersect = points;
      this.normalize = vectors;
      this.touch = events;
    }
  }

  /**
   * 转动视图
   */
  rotateView() {
    var self = this;
    if(this.startPoint && this.movePoint){
      if (this.startPoint.y < this.touchLine.screenRect.top) {
        this.targetRubik = this.frontRubik;
        this.anotherRubik = this.endRubik;
      } else if (this.startPoint.y > this.touchLine.screenRect.top + this.touchLine.screenRect.height) {
        this.targetRubik = this.endRubik;
        this.anotherRubik = this.frontRubik;
      }
      if (this.targetRubik && this.anotherRubik) {
        this.isRotating = true;//转动标识置为true
        //计算整体转动方向
        var targetType = this.targetRubik.group.childType;
        var cubeIndex = this.getViewRotateCubeIndex(targetType);
        var direction = this.getViewDirection(targetType, this.startPoint, this.movePoint);
        this.targetRubik.rotateMoveWhole(cubeIndex, direction);
        this.anotherRubik.rotateMoveWhole(cubeIndex, direction, function () {
          self.resetRotateParams();
        });
      }
    }
  }

  /**
   * 获得视图转动方块索引
   */
  getViewRotateCubeIndex(type) {
    if (type == this.frontViewName) {
      return 10;
    } else {
      return 65;
    }
  }

  /**
 * 获得视图转动方向
 */
  getViewDirection(type, startPoint, movePoint) {
    var direction;
    var rad = 30 * Math.PI / 180;
    var lenX = movePoint.x - startPoint.x;
    var lenY = movePoint.y - startPoint.y;
    if (type == this.frontViewName) {
      if (startPoint.x > window.innerWidth / 2) {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.1;
          } else {
            direction = 3.1;
          }
        } else {
          if (lenX > 0) {
            direction = 0.3;
          } else {
            direction = 1.3;
          }
        }
      } else {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.4;
          } else {
            direction = 3.4;
          }
        } else {
          if (lenX > 0) {
            direction = 4.4;
          } else {
            direction = 5.4;
          }
        }
      }
    } else {
      if (startPoint.x > window.innerWidth / 2) {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.2;
          } else {
            direction = 3.2;
          }
        } else {
          if (lenX > 0) {
            direction = 1.4;
          } else {
            direction = 0.4;
          }
        }
      } else {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.3;
          } else {
            direction = 3.3;
          }
        } else {
          if (lenX > 0) {
            direction = 5.3;
          } else {
            direction = 4.3;
          }
        }
      }
    }
    return direction;
  }

  /**
   * 正反魔方区域占比变化
   */
  rubikResize(frontPercent, endPercent) {
    this.frontRubik.resizeHeight(frontPercent, 1);
    this.endRubik.resizeHeight(endPercent, -1);
  }

  /**
   * 重置魔方
   */
  resetRubik(){
    this.frontRubik.reset();
    this.endRubik.reset();
    this.debugInfo();
  }

  /**
   * 扰乱魔方
   */
  disorganizeRubik(callback){
    var self = this;
    if(!this.isRotating){
      this.isRotating = true;
      var stepArr = this.frontRubik.randomRotate();
      this.endRubik.runMethodAtNo(stepArr, 0, function(){
        if (callback){
          callback();
        }
        self.resetRotateParams();
        self.frontRubik.startReset();
        self.debugInfo();
      });
    }
  }

  /**
   * 存储魔方
   */
  saveRubik(){
    wx.showLoading({
      title: '存档中...',
      mask:true
    })

    if (!this.tagRubik){
      this.tagRubik = new BasicRubik(this);
      this.tagRubik.model();
    }
    this.tagRubik.changeOrder(this.frontRubik.orderNum,this.frontRubik.cubeLen);

    var tagPosition = this.saveBtn.getPosition();
    tagPosition.y -= this.saveBtn.height/2+15;
    this.tagRubik.save(this.frontRubik, tagPosition, 0.05);
    this.tagRubik.showInScene();

    //灰色半透明背景
    if (!this.tagRubikBg){
      this.tagRubikBg = new UIComponent(this);
      this.tagRubikBg.loadStyle({
        width:64,
        height:64,
        backgroundColor:'rgba(0,0,0,0.1)',
        radius:8
      });
    }
    this.tagRubikBg.setPosition(tagPosition.x, tagPosition.y, tagPosition.z);
    this.tagRubikBg.showInScene();

    setTimeout(function(){
      wx.hideLoading()
    },500)
  }

  /**
   * 读取魔方
   */
  restoreRubik(){
    if (this.tagRubik.isVisible){
      this.frontRubik.save(this.tagRubik);
      this.endRubik.save(this.tagRubik);
      this.clearTagRubik();
    }
  }

  /**
   * 清除状态存储魔方
   */
  clearTagRubik(){
    if (this.tagRubik) {
      this.tagRubik.hideInScene();
    }
    if (this.tagRubikBg) {
      this.tagRubikBg.hideInScene();
    }
  }

  /**
   * 输出调试信息
   */
  debugInfo(){
    var self = this;
    //console.log(self.frontRubik.toSequences());
    //console.log(self.frontRubik.getEntropy());
    //console.log(self.frontRubik.isReset());
  }
}
