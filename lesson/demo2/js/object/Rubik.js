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
  var leftUpX = x - num/2*len;
  var leftUpY = y + num/2*len;
  var leftUpZ = z + num/2*len;

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
        materials.push(new THREE.MeshLambertMaterial({ map: texture}));
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
  }
  
  model() {
    this.cubes = SimpleCube(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.num, BasicParams.len, BasicParams.colors);//生成魔方小正方体
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      this.main.scene.add(item);
    }
  }
}