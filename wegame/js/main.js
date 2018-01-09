import * as THREE from 'libs/three.js'
require('libs/three-orbit-controls.js')
import Rubik from 'objects/rubik.js'

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
    this.initStatus = [];//魔方初始状态
    //魔方转动的六个方向
    this.xLine = new THREE.Vector3(1, 0, 0);//X轴正方向
    this.xLineAd = new THREE.Vector3(-1, 0, 0);//X轴负方向
    this.yLine = new THREE.Vector3(0, 1, 0);//Y轴正方向
    this.yLineAd = new THREE.Vector3(0, -1, 0);//Y轴负方向
    this.zLine = new THREE.Vector3(0, 0, 1);//Z轴正方向
    this.zLineAd = new THREE.Vector3(0, 0, -1);//Z轴负方向

    this.cubeParams = {//魔方参数
      x: -75,
      y: 75,
      z: 75,
      num: 3,
      len: 50,
      colors: ['rgba(255,193,37,1)', 'rgba(0,191,255,1)',
        'rgba(50,205,50,1)', 'rgba(178,34,34,1)',
        'rgba(255,255,0,1)', 'rgba(255,255,255,1)']
    };

    this.initThree();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.render();

    wx.onTouchStart(this.startCube.bind(this))
    wx.onTouchMove(this.moveCube.bind(this))
    wx.onTouchEnd(this.stopCube.bind(this));
  }

  //魔方操作结束
  stopCube() {
    this.intersect = null;
    this.startPoint = null
  }

  //绕着世界坐标系的某个轴旋转
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
    //obj.rotateY(rad);
    obj.position.x = Math.cos(rad) * x0 + Math.sin(rad) * z0;
    obj.position.z = Math.cos(rad) * z0 - Math.sin(rad) * x0;
  }
  rotateAroundWorldZ(obj, rad) {
    var x0 = obj.position.x;
    var y0 = obj.position.y;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad);
    obj.quaternion.premultiply(q);
    //obj.rotateZ(rad);
    obj.position.x = Math.cos(rad) * x0 - Math.sin(rad) * y0;
    obj.position.y = Math.cos(rad) * y0 + Math.sin(rad) * x0;
  }
  rotateAroundWorldX(obj, rad) {
    var y0 = obj.position.y;
    var z0 = obj.position.z;
    var q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
    obj.quaternion.premultiply(q);
    //obj.rotateX(rad);
    obj.position.y = Math.cos(rad) * y0 - Math.sin(rad) * z0;
    obj.position.z = Math.cos(rad) * z0 + Math.sin(rad) * y0;
  }

  //滑动操作魔方
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
          var elements = this.getBoxs(this.intersect, direction);
          var startTime = new Date().getTime();
          requestAnimationFrame(function (timestamp) {
            self.rotateAnimation(elements, direction, timestamp, 0);
          });
        }
      }
    }
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
      this.updateCubeIndex(elements);
      //转动之后需要更新魔方此时所处的状态
      this.updateCubeStatus();
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

  //更新位置索引
  updateCubeIndex(elements) {
    for (var i = 0; i < elements.length; i++) {
      var temp1 = elements[i];
      for (var j = 0; j < this.initStatus.length; j++) {
        var temp2 = this.initStatus[j];
        if (Math.abs(temp1.position.x - temp2.x) <= this.cubeParams.len / 2 &&
          Math.abs(temp1.position.y - temp2.y) <= this.cubeParams.len / 2 &&
          Math.abs(temp1.position.z - temp2.z) <= this.cubeParams.len / 2) {
          temp1.cubeIndex = temp2.cubeIndex;
          break;
        }
      }
    }
  }

  /**
   * 更新魔方状态
   * 假设初始化时按固定位置给魔方编号，还原之后位置和编号不变
   */
  updateCubeStatus() {
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      if (item.id !== item.cubeIndex) {
        return false;
      }
    }
    return true;
  }

  //根据方向获得运动元素
  getBoxs(target, direction) {
    var targetId = target.object.cubeIndex;
    var ids = [];
    for (var i = 0; i < this.cubes.length; i++) {
      ids.push(this.cubes[i].cubeIndex);
    }
    var minId = this.min(ids);
    targetId = targetId - minId;
    var numI = parseInt(targetId / 9);
    var numJ = targetId % 9;
    var boxs = [];
    //根据绘制时的规律判断 no = i*9+j
    switch (direction) {
      //绕z轴
      case 0.1:
      case 0.2:
      case 1.1:
      case 1.2:
      case 2.3:
      case 2.4:
      case 3.3:
      case 3.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - minId;
          if (numI === parseInt(tempId / 9)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      //绕y轴
      case 0.3:
      case 0.4:
      case 1.3:
      case 1.4:
      case 4.3:
      case 4.4:
      case 5.3:
      case 5.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - minId;
          if (parseInt(numJ / 3) === parseInt(tempId % 9 / 3)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      //绕x轴
      case 2.1:
      case 2.2:
      case 3.1:
      case 3.2:
      case 4.1:
      case 4.2:
      case 5.1:
      case 5.2:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - minId;
          if (tempId % 9 % 3 === numJ % 3) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      default:
        break;
    }
    return boxs;
  }

  //获得旋转方向
  getDirection(vector3) {
    var direction;
    //判断差向量和x、y、z轴的夹角
    var xAngle = vector3.angleTo(this.xLine);
    var xAngleAd = vector3.angleTo(this.xLineAd);
    var yAngle = vector3.angleTo(this.yLine);
    var yAngleAd = vector3.angleTo(this.yLineAd);
    var zAngle = vector3.angleTo(this.zLine);
    var zAngleAd = vector3.angleTo(this.zLineAd);
    var minAngle = this.min([xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

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

  //获取数组中的最小值
  min(arr) {
    var min = arr[0];
    for (var i = 1; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i];
      }
    }
    return min;
  }

  //开始操作魔方
  startCube(event) {
    this.getIntersects(event);
    //魔方没有处于转动过程中且存在碰撞物体
    if (!this.isRotating && this.intersect) {
      this.controller.enabled = false;//焦点在魔方上时禁止视角变换
      this.startPoint = this.intersect.point;//开始转动，设置起始点
    }else{
      this.controller.enabled = true;
    }
  }

  //初始化渲染器
  initThree(){
    this.context = context;
    this.width = window.innerWidth ;
    this.height = window.innerHeight ;
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

  //获取操作焦点以及该焦点所在平面的法向量
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
    this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controller.target = new THREE.Vector3(0, 0, 0);//设置控制点
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
    //生成魔方小正方体
    this.cubes = new Rubik(this.cubeParams.x, this.cubeParams.y, this.cubeParams.z, this.cubeParams.num, this.cubeParams.len, this.cubeParams.colors);
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      /**
       * 由于筛选运动元素时是根据物体的id规律来的，但是滚动之后位置发生了变化；
       * 再根据初始规律筛选会出问题，而且id是只读变量；
       * 所以这里给每个物体设置一个额外变量cubeIndex，每次滚动之后更新根据初始状态更新该cubeIndex；
       * 让该变量一直保持初始规律即可。
       */
      this.initStatus.push({
        x: item.position.x,
        y: item.position.y,
        z: item.position.z,
        cubeIndex: item.id
      });
      item.cubeIndex = item.id;
      this.scene.add(this.cubes[i]);//并依次加入到场景中
    }

    //透明正方体
    var cubegeo = new THREE.BoxGeometry(150, 150, 150);
    var hex = 0x000000;
    for (var i = 0; i < cubegeo.faces.length; i += 2) {
      cubegeo.faces[i].color.setHex(hex);
      cubegeo.faces[i + 1].color.setHex(hex);
    }
    var cubemat = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors, opacity: 0, transparent: true });
    var cube = new THREE.Mesh(cubegeo, cubemat);
    cube.cubeType = 'coverCube';
    this.scene.add(cube);
  }

  //渲染
  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this),canvas);
  }
}
