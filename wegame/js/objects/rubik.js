import * as THREE from '../libs/three.js'

export default class Rubik{
  /**
   * 魔方
   * x、y、z 魔方正面左上角坐标
   * num 魔方单位方向上数量
   * len 魔方单位正方体宽高
   * colors 魔方六面体颜色
   */
  constructor(x, y, z, num, len, colors) {
    var cubes = [];
    for (var i = 0; i < num; i++) {
      for (var j = 0; j < num * num; j++) {
        var cubegeo = new THREE.BoxGeometry(len, len, len);
        var materials = [];
        var myFaces = [];
        //一个小正方体有六个面，每个面使用相同材质的纹理，但是颜色不一样
        myFaces.push(this.faces(colors[0]));
        myFaces.push(this.faces(colors[1]));
        myFaces.push(this.faces(colors[2]));
        myFaces.push(this.faces(colors[3]));
        myFaces.push(this.faces(colors[4]));
        myFaces.push(this.faces(colors[5]));
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

  //生成canvas素材
  faces(rgbaColor) {
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
}