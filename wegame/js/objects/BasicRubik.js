import * as THREE from '../libs/three.js'

//基础模型参数
const BasicParams = {
  x: -75,
  y: 75,
  z: 75,
  num: 3,
  len: 50,
  defaultColor:'#666666',
  //右、左、上、下、前、后
  colors: ['#ff6b02', '#dd422f',
    '#ffffff', '#fdcd02',
    '#3d81f7', '#019d53']
};

/**
 * 魔方
 * x、y、z 魔方正面左上角坐标
 * num 魔方单位方向上数量
 * len 魔方单位正方体宽高
 * colors 魔方六面体颜色
 */
function SimpleCube(x, y, z, num, len, colors) {
  var cubes = [];
  for (var i = 0; i < num; i++) {
    for (var j = 0; j < num * num; j++) {
      //小正方体六个面，每个面使用相同材质的纹理，但是颜色不一样，内面为默认色
      var myFaces = [];
      var no = i * num * num + j;
      if (no % 3 == 2) {//右
        myFaces[0] = faces(colors[0]);
      }
      if (no % 3 == 0) {//左
        myFaces[1] = faces(colors[1]);
      }
      if (no % 9 <= 2) {//上
        myFaces[2] = faces(colors[2]);
      }
      if (no % 9 >= 6) {//下
        myFaces[3] = faces(colors[3]);
      }
      if (parseInt(no / 9) == 0) {//前
        myFaces[4] = faces(colors[4]);
      }
      if (parseInt(no / 9) == 2) {//后
        myFaces[5] = faces(colors[5]);
      }
      for (var k = 0; k < 6; k++) {
        if (!myFaces[k]) {
          myFaces[k] = faces(BasicParams.defaultColor);
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
      var cubemat = new THREE.MeshFaceMaterial(materials);
      var cube = new THREE.Mesh(cubegeo, cubemat);
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

export default class BasicRubik{
  constructor(main) {
    this.main = main;
    this.initStatus = [];
  }

  /**
   * 生成模型并加入到场景中
   */
  model(){
    //生成魔方小正方体
    this.cubes = SimpleCube(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.num, BasicParams.len, BasicParams.colors);
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
      this.main.scene.add(item);//并依次加入到场景中
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
    this.main.scene.add(this.container);
  }

  /**
   * 根据方向获得运动元素
   */
  getBoxs(target, direction) {
    var targetId = target.object.cubeIndex;
    var ids = [];
    for (var i = 0; i < this.cubes.length; i++) {
      ids.push(this.cubes[i].cubeIndex);
    }
    var minId = Math.min.apply(null,ids);
    targetId = targetId - minId;
    var numI = parseInt(targetId / 9);
    var numJ = targetId % 9;
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
          var tempId = this.cubes[i].cubeIndex - minId;
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
          var tempId = this.cubes[i].cubeIndex - minId;
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
}