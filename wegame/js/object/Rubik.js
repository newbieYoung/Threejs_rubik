import * as THREE from '../lib/three.min.js'
import { BasicParams } from '../util/Constant.js'

export default class Rubik {
  constructor(width,height) {
    this.minWidth = 0;
    this.maxWidth = window.innerWidth * window.devicePixelRatio;
    this.minHeight = 0;
    this.maxHeight = window.innerHeight * window.devicePixelRatio;

    if (width < this.minWidth || height < this.minHeight){//宽高尺寸不合理
      return;
    }

    //视图尺寸
    this.viewWidth = width;
    this.viewHeight = height;

    //尺寸
    this.width = width;
    this.height = height;

    this.viewCenter = new THREE.Vector3(1, 0, 0);
    this.isViewChanged = true;//视图是否有变动
    this.raycaster = new THREE.Raycaster();//光线碰撞检测器
    this.intersect;//碰撞光线穿过的元素
    this.normalize;//触发平面法向量
    this.initStatus = [];//魔方方块初始状态

    //魔方转动的六个方向
    this.xLine = new THREE.Vector3(1, 0, 0);//X轴正方向
    this.xLineAd = new THREE.Vector3(-1, 0, 0);//X轴负方向
    this.yLine = new THREE.Vector3(0, 1, 0);//Y轴正方向
    this.yLineAd = new THREE.Vector3(0, -1, 0);//Y轴负方向
    this.zLine = new THREE.Vector3(0, 0, 1);//Z轴正方向
    this.zLineAd = new THREE.Vector3(0, 0, -1);//Z轴负方向

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
     */
    this.rotateParams = {
      speed: 3,
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
      animationEnd: function () {
        this.updateCubeIndex(this.rotateParams.elements);
        this.rotateParams.isAnimating = false;
        this.rotateParams.sumRad = 0;//清0
        this.rotateParams.direction = null;
        this.rotateParams.elements = null;
      }
    };

    this.initThree();
    this.initScene();
    this.initCamera();
    this.initLight();
    this.initObject();
    this.render();
    this.initView();
    this.initEvent();
  }

  /**
   * 魔方
   * x、y、z 魔方正面左上角坐标
   * num 魔方单位方向上数量
   * len 魔方单位正方体宽高
   * colors 魔方六面体颜色
   */
  simpleCube(x, y, z, num, len, colors){
    var cubes = [];
    for (var i = 0; i < num; i++) {
      for (var j = 0; j < num * num; j++) {
        //小正方体六个面，每个面使用相同材质的纹理，但是颜色不一样，内面为默认色
        var myFaces = [];
        var no = i * num * num + j;
        if (no % 3 == 2) {//右
          myFaces[0] = this.faces(colors[0]);
        }
        if (no % 3 == 0) {//左
          myFaces[1] = this.faces(colors[1]);
        }
        if (no % 9 <= 2) {//上
          myFaces[2] = this.faces(colors[2]);
        }
        if (no % 9 >= 6) {//下
          myFaces[3] = this.faces(colors[3]);
        }
        if (parseInt(no / 9) == 0) {//前
          myFaces[4] = this.faces(colors[4]);
        }
        if (parseInt(no / 9) == 2) {//后
          myFaces[5] = this.faces(colors[5]);
        }
        for (var k = 0; k < 6; k++) {
          if (!myFaces[k]) {
            myFaces[k] = this.faces(BasicParams.defaultColor);
          }
        }

        var cubegeo = new THREE.BoxGeometry(len, len, len);
        var materials = [];
        for (var k = 0; k < 6; k++) {
          var texture = new THREE.Texture(myFaces[k]);
          texture.needsUpdate = true;
          materials.push(new THREE.MeshLambertMaterial({
            map: texture
          }));
        }
        var cube = new THREE.Mesh(cubegeo, materials);
        //假设整个魔方的中心在坐标系原点，推出每个小正方体的中心
        cube.position.x = (x + len / 2) + (j % 3) * len;
        cube.position.y = (y - len / 2) - parseInt(j / 3) * len;
        cube.position.z = (z - len / 2) - i * len;
        cubes.push(cube)
      }
    }
    return cubes;
  }

  /**
   * 更新位置索引
   */
  updateCubeIndex(elements) {
    for (var i = 0; i < elements.length; i++) {
      var temp1 = elements[i];
      for (var j = 0; j < this.initStatus.length; j++) {
        var temp2 = this.initStatus[j];
        if (Math.abs(temp1.position.x - temp2.x) <= BasicParams.len / 2 &&
          Math.abs(temp1.position.y - temp2.y) <= BasicParams.len / 2 &&
          Math.abs(temp1.position.z - temp2.z) <= BasicParams.len / 2) {
          temp1.cubeIndex = temp2.cubeIndex;
          break;
        }
      }
    }
  }

  /**
   * 生成canvas素材
   */
  faces(rgbaColor) {
    var canvas = wx.createCanvas('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var context = canvas.getContext('2d');
    //画一个宽高都是256的黑色正方形
    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, 256, 256);
    //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
    context.rect(16, 16, 224, 224);
    context.lineJoin = 'round';
    context.lineWidth = 16;
    context.fillStyle = rgbaColor;
    context.strokeStyle = rgbaColor;
    context.stroke();
    context.fill();
    return canvas;
  }

  /**
   * 构件基础模型
   */
  model(){
    //生成魔方小正方体
    this.cubes = this.simpleCube(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.num, BasicParams.len, BasicParams.colors);
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      /**
       * 由于筛选运动元素时是根据物体的id规律来的；
       * 但是滚动之后位置发生了变化；
       * 再根据初始规律筛选会出问题，而且id是只读变量；
       * 所以这里给每个物体设置一个额外变量cubeIndex；
       * 每次滚动之后更新根据初始状态更新该cubeIndex；
       * 让该变量一直保持初始规律即可。
       */
      this.initStatus.push({
        x: item.position.x,
        y: item.position.y,
        z: item.position.z,
        cubeIndex: item.id
      });
      item.cubeIndex = item.id;
      this.scene.add(item);//并依次加入到场景中
    }

    //透明正方体
    var cubegeo = new THREE.BoxGeometry(150, 150, 150);
    var hex = 0x000000;
    for (var i = 0; i < cubegeo.faces.length; i += 2) {
      cubegeo.faces[i].color.setHex(hex);
      cubegeo.faces[i + 1].color.setHex(hex);
    }
    var cubemat = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors, opacity: 0, transparent: true });

    this.container = new THREE.Mesh(cubegeo, cubemat);
    this.container.cubeType = 'coverCube';
    this.scene.add(this.container);
  }

  /**
   * 初始化渲染器
   */
  initThree() {
    this.canvas = wx.createCanvas();
    this.context = this.canvas.getContext('webgl');

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      context: this.context
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xFFFFFF, 0.0);//背景透明

    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.renderer.setPixelRatio(window.devicePixelRatio);//为了防止在小视图放大到大视图时出现模糊的情况，这里再尺寸考虑的设备像素比的情况下还乘以一层设备像素比
  }

  /**
   * 初始化场景
   */
  initScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * 初始化相机
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.set(300, 300, 300);//需要保证魔方最大时不能超出页面范围
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt(this.viewCenter);
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
    this.model();
  }

  /**
   * 初始化事件
   */
  initEvent() {
  }

  /**
   * 更新画布
   */
  render() {
    if (this.isViewChanged){
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.isViewChanged = false;
    }
  }

  /**
   * 初始化视图
   */
  initView(){
    this.updateView(this.height);
  }

  /**
   * 设置摄像机位置
   * 设置摄像机位置后还需要重新设置摄像机目标点才能正常渲染
   */
  setCameraPosition(x,y,z){
    if (x != this.camera.position.x || y != this.camera.position.y || z != this.camera.position.z){
      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.viewCenter);
      this.isViewChanged = true;
      this.render();
      this.updateView(this.height);
    }
  }

  /**
   * 视图高度变化
   * 宽度不变，高度随控制线的变化而变化
   */
  updateView(height){
    if (height < this.minHeight || height >= this.maxHeight){
      return;
    }
    this.viewHeight = height;

    //视图
    this.viewCanvas = wx.createCanvas();
    this.viewCanvas.width = this.viewWidth;
    this.viewCanvas.height = this.viewHeight;
    this.viewContext = this.viewCanvas.getContext('2d');

    //内容以高度为准完全展示
    var tempW = this.viewHeight * this.width / this.height;
    this.viewContext.clearRect(0, 0, this.viewWidth, this.viewHeight);
    var len = (this.viewWidth - tempW )/ 2;
    if (len>=0){
      this.viewContext.drawImage(this.canvas, len, 0, tempW, this.viewHeight);
    }else{
      len = Math.abs(len);
      var percent = len / tempW;
      this.viewContext.drawImage(this.canvas, this.width * percent * window.devicePixelRatio, 0, this.width * (1 - 2 * percent) * window.devicePixelRatio, this.height * window.devicePixelRatio, 0, 0, this.viewWidth, this.viewHeight);
    }
  }
}