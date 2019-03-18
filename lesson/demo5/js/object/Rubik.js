import * as THREE from '../threejs/three.js'

//基础模型参数
const BasicParams = {
  x: 0,
  y: 0,
  z: 0,
  num: 3,
  len: 50,
  //右、左、上、下、前、后
  colors: ['#ff6b02', '#dd422f',
    '#ffffff', '#fdcd02',
    '#3d81f7', '#019d53']
};

/**
 * 简易魔方
 * x、y、z 魔方中心点坐标
 * num 魔方阶数
 * len 小方块宽高
 * colors 魔方六面体颜色
 */
function SimpleCube(x, y, z, num, len, colors) {
  //魔方左上角坐标
  var leftUpX = x - num / 2 * len;
  var leftUpY = y + num / 2 * len;
  var leftUpZ = z + num / 2 * len;

  var cubes = [];
  for (var i = 0; i < num; i++) {
    for (var j = 0; j < num * num; j++) {

      var myFaces = [];
      for (var k = 0; k < 6; k++) {
        myFaces[k] = faces(colors[k]);
      }

      var materials = [];
      for (var k = 0; k < 6; k++) {
        var texture = new THREE.Texture(myFaces[k]);
        texture.needsUpdate = true;
        materials.push(new THREE.MeshLambertMaterial({ map: texture }));
      }

      var cubegeo = new THREE.BoxGeometry(len, len, len);
      var cube = new THREE.Mesh(cubegeo, materials);

      //依次计算各个小方块中心点坐标
      cube.position.x = (leftUpX + len / 2) + (j % num) * len;
      cube.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
      cube.position.z = (leftUpZ - len / 2) - i * len;
      cubes.push(cube)
    }
  }
  return cubes;
}

/**
 * 生成canvas素材
 */
function faces(rgbaColor) {
  var canvas = document.createElement('canvas');
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

export default class Rubik {
  constructor(main) {
    this.main = main;
    this.initStatus = [];
    this.defaultTotalTime = 250;//默认转动动画时长

    //魔方的六个转动方向
    this.xLine = new THREE.Vector3(1, 0, 0);
    this.xLineAd = new THREE.Vector3(-1, 0, 0);
    this.yLine = new THREE.Vector3(0, 1, 0);
    this.yLineAd = new THREE.Vector3(0, -1, 0);
    this.zLine = new THREE.Vector3(0, 0, 1);
    this.zLineAd = new THREE.Vector3(0, 0, -1);
  }

  /**
   * 获得自身坐标系的坐标轴在世界坐标系中坐标
   */
  updateCurLocalAxisInWorld() {
    var center = new THREE.Vector3(0, 0, 0);
    var xPoint = new THREE.Vector3(1, 0, 0);
    var xPointAd = new THREE.Vector3(-1, 0, 0);
    var yPoint = new THREE.Vector3(0, 1, 0);
    var yPointAd = new THREE.Vector3(0, -1, 0);
    var zPoint = new THREE.Vector3(0, 0, 1);
    var zPointAd = new THREE.Vector3(0, 0, -1);

    var matrix = this.group.matrixWorld;//魔方的在世界坐标系的变换矩阵
    center.applyMatrix4(matrix);
    xPoint.applyMatrix4(matrix);
    xPointAd.applyMatrix4(matrix);
    yPoint.applyMatrix4(matrix);
    yPointAd.applyMatrix4(matrix);
    zPoint.applyMatrix4(matrix);
    zPointAd.applyMatrix4(matrix);

    this.center = center;
    this.xLine = xPoint.sub(center);
    this.xLineAd = xPointAd.sub(center);
    this.yLine = yPoint.sub(center);
    this.yLineAd = yPointAd.sub(center);
    this.zLine = zPoint.sub(center);
    this.zLineAd = zPointAd.sub(center);
  }
  
  model(type) {
    //创建魔方集合
    this.group = new THREE.Group();
    this.group.childType = type;

    this.cubes = SimpleCube(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.num, BasicParams.len, BasicParams.colors);//生成魔方小正方体
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

      /**
       * 小方块不再直接加入场景了；
       * 而是先加入魔方集合，然后再把魔方集合加入场景。
       */
      //this.main.scene.add(item);
      this.group.add(item);
    }

    //外层透明正方体
    var width = BasicParams.num * BasicParams.len;
    var cubegeo = new THREE.BoxGeometry(width, width, width);
    var hex = 0x000000;
    for (var i = 0; i < cubegeo.faces.length; i += 2) {
      cubegeo.faces[i].color.setHex(hex);
      cubegeo.faces[i + 1].color.setHex(hex);
    }
    var cubemat = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors, opacity: 0, transparent: true });
    this.container = new THREE.Mesh(cubegeo, cubemat);
    this.container.cubeType = 'coverCube';
    this.group.add(this.container);

    //进行一定的旋转变换保证三个面可见
    if (type == this.main.frontViewName) {
      this.group.rotateY(45 / 180 * Math.PI);
    } else {
      this.group.rotateY((270 - 45) / 180 * Math.PI);
    }
    this.group.rotateOnAxis(new THREE.Vector3(1, 0, 1), 25 / 180 * Math.PI);

    this.main.scene.add(this.group);
    this.getMinCubeIndex();
  }

  /**
   * 计算转动方向
   */
  getDirection(sub, normalize) {
    this.updateCurLocalAxisInWorld();
    var direction;
    //判断差向量和x、y、z轴的夹角
    var xAngle = sub.angleTo(this.xLine);
    var xAngleAd = sub.angleTo(this.xLineAd);
    var yAngle = sub.angleTo(this.yLine);
    var yAngleAd = sub.angleTo(this.yLineAd);
    var zAngle = sub.angleTo(this.zLine);
    var zAngleAd = sub.angleTo(this.zLineAd);
    var minAngle = Math.min.apply(null, [xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

    var xLine = new THREE.Vector3(1, 0, 0);
    var xLineAd = new THREE.Vector3(-1, 0, 0);
    var yLine = new THREE.Vector3(0, 1, 0);
    var yLineAd = new THREE.Vector3(0, -1, 0);
    var zLine = new THREE.Vector3(0, 0, 1);
    var zLineAd = new THREE.Vector3(0, 0, -1);

    switch (minAngle) {
      case xAngle:
        direction = 0;//向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;//绕z轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;//绕z轴逆时针
        } else if (normalize.equals(zLine)) {
          direction = direction + 0.3;//绕y轴逆时针
        } else {
          direction = direction + 0.4;//绕y轴顺时针
        }
        break;
      case xAngleAd:
        direction = 1;//向x轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(zLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case yAngle:
        direction = 2;//向y轴正方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case yAngleAd:
        direction = 3;//向y轴反方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case zAngle:
        direction = 4;//向z轴正方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case zAngleAd:
        direction = 5;//向z轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      default:
        break;
    }
    return direction;
  }

  /**
   * 根据触摸方块的索引以及滑动方向获得转动元素
   */
  getBoxs(cubeIndex, direction) {
    var targetIndex = cubeIndex;
    targetIndex = targetIndex - this.minCubeIndex;
    var numI = parseInt(targetIndex / 9);
    var numJ = targetIndex % 9;
    var boxs = [];
    //根据绘制时的规律判断 no = i*9+j
    switch (direction) {
      case 0.1:
      case 0.2:
      case 1.1:
      case 1.2:
      case 2.3:
      case 2.4:
      case 3.3:
      case 3.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
          if (numI === parseInt(tempId / 9)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      case 0.3:
      case 0.4:
      case 1.3:
      case 1.4:
      case 4.3:
      case 4.4:
      case 5.3:
      case 5.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
          if (parseInt(numJ / 3) === parseInt(tempId % 9 / 3)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      case 2.1:
      case 2.2:
      case 3.1:
      case 3.2:
      case 4.1:
      case 4.2:
      case 5.1:
      case 5.2:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
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

  /**
   * 转动动画
   * currentstamp 当前时间
   * startstamp   开始时间
   */
  rotateAnimation(elements, direction, currentstamp, startstamp, laststamp, callback, totalTime) {
    var self = this;
    var isAnimationEnd = false;//动画是否结束

    if (startstamp === 0) {
      startstamp = currentstamp;
      laststamp = currentstamp;
    }
    if (currentstamp - startstamp >= totalTime) {
      isAnimationEnd = true;
      currentstamp = startstamp + totalTime;
    }
    var rotateMatrix = new THREE.Matrix4();//旋转矩阵
    var origin = new THREE.Vector3(0, 0, 0);
    var xLine = new THREE.Vector3(1, 0, 0);
    var yLine = new THREE.Vector3(0, 1, 0);
    var zLine = new THREE.Vector3(0, 0, 1);

    switch (direction) {
      case 0.1:
      case 1.2:
      case 2.4:
      case 3.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, zLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 0.2:
      case 1.1:
      case 2.3:
      case 3.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, zLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 0.4:
      case 1.3:
      case 4.3:
      case 5.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, yLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, yLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 2.2:
      case 3.1:
      case 4.1:
      case 5.2:
        rotateMatrix = this.rotateAroundWorldAxis(origin, xLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 2.1:
      case 3.2:
      case 4.2:
      case 5.1:
        rotateMatrix = this.rotateAroundWorldAxis(origin, xLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      default:
        break;
    }
    for (var i = 0; i < elements.length; i++) {
      elements[i].applyMatrix(rotateMatrix);
    }
    if (!isAnimationEnd) {
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, startstamp, currentstamp, callback, totalTime);
      });
    } else {
      callback();
    }
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
   * 转动魔方
   */
  rotateMove(cubeIndex, direction, callback, totalTime) {
    var self = this;
    totalTime = totalTime ? totalTime : this.defaultTotalTime;
    var elements = this.getBoxs(cubeIndex, direction);
    requestAnimationFrame(function (timestamp) {
      self.rotateAnimation(elements, direction, timestamp, 0, 0, function () {
        self.updateCubeIndex(elements);
        if (callback) {
          callback();
        }
      }, totalTime);
    });
  }

  /**
   * 转动魔方整体
   */
  rotateMoveWhole(cubeIndex, direction, callback, totalTime) {
    if (cubeIndex != null && direction != null) {
      var self = this;
      totalTime = totalTime ? totalTime : this.defaultTotalTime;
      var elements = this.cubes;
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, 0, 0, function () {
          self.updateCubeIndex(elements);
          if (callback) {
            callback();
          }
        }, totalTime);
      });
    }
  }

  /**
   * 获取最小索引值
   */
  getMinCubeIndex() {
    var ids = [];
    for (var i = 0; i < this.cubes.length; i++) {
      ids.push(this.cubes[i].cubeIndex);
    }
    this.minCubeIndex = Math.min.apply(null, ids);
  }

  /**
   * 绕过点p的向量vector旋转一定角度
   */
  rotateAroundWorldAxis(p, vector, rad) {
    vector.normalize();
    var u = vector.x;
    var v = vector.y;
    var w = vector.z;

    var a = p.x;
    var b = p.y;
    var c = p.z;

    var matrix4 = new THREE.Matrix4();

    matrix4.set(u * u + (v * v + w * w) * Math.cos(rad), u * v * (1 - Math.cos(rad)) - w * Math.sin(rad), u * w * (1 - Math.cos(rad)) + v * Math.sin(rad), (a * (v * v + w * w) - u * (b * v + c * w)) * (1 - Math.cos(rad)) + (b * w - c * v) * Math.sin(rad),
      u * v * (1 - Math.cos(rad)) + w * Math.sin(rad), v * v + (u * u + w * w) * Math.cos(rad), v * w * (1 - Math.cos(rad)) - u * Math.sin(rad), (b * (u * u + w * w) - v * (a * u + c * w)) * (1 - Math.cos(rad)) + (c * u - a * w) * Math.sin(rad),
      u * w * (1 - Math.cos(rad)) - v * Math.sin(rad), v * w * (1 - Math.cos(rad)) + u * Math.sin(rad), w * w + (u * u + v * v) * Math.cos(rad), (c * (u * u + v * v) - w * (a * u + b * v)) * (1 - Math.cos(rad)) + (a * v - b * u) * Math.sin(rad),
      0, 0, 0, 1);

    return matrix4;
  }

  /**
   * 高度所占比例发生变化
   */
  resizeHeight(percent, transformTag) {
    if (percent < this.main.minPercent) {
      percent = this.main.minPercent;
    }
    if (percent > (1 - this.main.minPercent)) {
      percent = 1 - this.main.minPercent;
    }
    this.group.scale.set(percent, percent, percent);
    this.group.position.y = this.main.originHeight * (0.5 - percent / 2) * transformTag;
  }
}