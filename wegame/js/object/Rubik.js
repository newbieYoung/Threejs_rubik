import * as THREE from '../threejs/three.js'

//基础模型参数
const BasicParams = {
  x: 0,
  y: 0,
  z: 0,
  defaultColor: '#666666',
  //右、左、上、下、前、后
  colors: ['#ff6b02', '#dd422f',
    '#ffffff', '#fdcd02',
    '#3d81f7', '#019d53'],
  sequences: ['R', 'L', 'U', 'D', 'F', 'B']//默认序列名
};

/**
 * 获取数组最小值
 */
function min(arr){
  var min = arr[0];
  var no = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      min = arr[i];
      no = i;
    }
  }
  return { no: no, value: min };
}

/**
 * 简易魔方
 * x、y、z 魔方中心点坐标
 * colors 魔方六面体颜色
 */
function SimpleCube(x, y, z, num, len, colors) {
  //魔方左上角坐标
  var leftUpX = x - num / 2 * len;
  var leftUpY = y + num / 2 * len;
  var leftUpZ = z + num / 2 * len;

  //根据颜色生成材质
  var materialArr = [];
  for (var i = 0; i < BasicParams.colors.length; i++){
    var texture = new THREE.Texture(faces(BasicParams.colors[i]));
    texture.needsUpdate = true;
    var material = new THREE.MeshLambertMaterial({ map: texture });
    materialArr.push(material);
  }
  var defaultTexture = new THREE.Texture(faces(BasicParams.defaultColor));
  defaultTexture.needsUpdate = true;
  var defaultMaterial = new THREE.MeshLambertMaterial({ map: defaultTexture });

  var cubes = [];
  for (var i = 0; i < num; i++) {
    for (var j = 0; j < num * num; j++) {

      //小方块外部面才有颜色，内部面默认为灰色
      var materials = [];
      var no = i * num * num + j;
      if (no % num == (num-1)) {//右
        materials[0] = materialArr[0];
      }
      if (no % num == 0) {//左
        materials[1] = materialArr[1];
      }
      if (no % Math.pow(num,2) <= (num-1)) {//上
        materials[2] = materialArr[2];
      }
      if (no % Math.pow(num, 2) >= (num-1)*num) {//下
        materials[3] = materialArr[3];
      }
      if (parseInt(no / Math.pow(num, 2)) == 0) {//前
        materials[4] = materialArr[4];
      }
      if (parseInt(no / Math.pow(num, 2)) == (num-1)) {//后
        materials[5] = materialArr[5];
      }
      for (var k = 0; k < 6; k++) {
        if (!materials[k]) {
          materials[k] = defaultMaterial;
        }
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
    this.slideLimitAngle = 15;//缓动转动阀值
    this.defaultTotalTime = 200;//默认转动动画时长
    this.orderNum = 3;//默认三阶魔方
    this.cubeLen = 50;//默认小方块尺寸
    this.isVisible = false;//在场景中是否可见

    this.startTime = 0;//魔方还原开始时间
    this.endTime = 0;//魔方还原完成时间
    this.startSequences = [];//魔方还原开始序列
    this.resetProcess = [];//魔方还原过程

    //魔方的六个转动方向（世界坐标系，默认为自身坐标系，魔方创建完成之后会进行转换）
    this.xLine = new THREE.Vector3(1, 0, 0);
    this.xLineAd = new THREE.Vector3(-1, 0, 0);
    this.yLine = new THREE.Vector3(0, 1, 0);
    this.yLineAd = new THREE.Vector3(0, -1, 0);
    this.zLine = new THREE.Vector3(0, 0, 1);
    this.zLineAd = new THREE.Vector3(0, 0, -1);

    //魔方的六个转动方向（自身坐标系）
    this.wXLine = new THREE.Vector3(1, 0, 0);
    this.wXLineAd = new THREE.Vector3(-1, 0, 0);
    this.wYLine = new THREE.Vector3(0, 1, 0);
    this.wYLineAd = new THREE.Vector3(0, -1, 0);
    this.wZLine = new THREE.Vector3(0, 0, 1);
    this.wZLineAd = new THREE.Vector3(0, 0, -1);
  }

  /**
   * 获取信息熵（每个面单独判断，目前这种混乱程度的判断方法没有考虑每个面魔方颜色块的分布规律的影响，只考虑数量）
   */
  getEntropy(){
    var sequences = this.toSequences();
    var faceLen = Math.pow(this.orderNum, 2);
    var H = 0;
    for(var i=0;i<sequences.length;i=i+faceLen){
      var letters = [];
      var counts = [];
      var h = 0;//单个面的信息熵
      for (var j = 0; j < faceLen; j++) {
        var letter = sequences[i+j];
        var index = letters.indexOf(letter);
        if (index==-1){//新增
          letters.push(letter);
          counts.push(1);
        }else{
          counts[index]++;//递加
        }
      }
      for (var z = 0; z < counts.length; z++) {
        var p = counts[z] / faceLen;
        h += -(p * Math.log(p) / Math.log(2));//H = -∑Pi*log2(Pi)
      }
      H += h;
    }
    return H;
  }

  /**
   * 获取魔方状态序列
   */
  toSequences() {
    this.main.renderOnce();
    var sequences = [];
    for (var i = 0; i < this.UCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.UCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.yLine)]);
    }
    for (var i = 0; i < this.RCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.RCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.xLine)]);
    }
    for (var i = 0; i < this.FCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.FCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.zLine)]);
    }
    for (var i = 0; i < this.DCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.DCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.yLineAd)]);
    }
    for (var i = 0; i < this.LCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.LCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.xLineAd)]);
    }
    for (var i = 0; i < this.BCubeIndex.length; i++) {
      var cube = this.getCubeByIndex(this.BCubeIndex[i]);
      sequences.push(BasicParams.sequences[this.getFaceColorByVector(cube, this.zLineAd)]);
    }
    return sequences;
  }

  /**
   * 获取法向量和已知向量方向相同的面的颜色序号
   * vector 为世界坐标系向量
   */
  getFaceColorByVector(cube,vector){
    var materials = cube.material.materials;
    var faces = cube.geometry.faces;
    var normalMatrix = cube.normalMatrix;

    /**
     * 转换视角时摄像机位置发生了变动，模型开始上表面的法向量是世界坐标系的Y轴，现在依然是世界坐标系的Y轴；
     * 但是小方块面的法向量乘以其法向量矩阵得到的是视图坐标系中的向量；
     * 世界坐标系转换成视图坐标系需要乘以视图矩阵的逆反矩阵。
     */
    var viewMatrix = new THREE.Matrix4();
    var camera = this.main.camera;
    viewMatrix.lookAt(camera.position, this.main.viewCenter, camera.up);
    viewMatrix.getInverse(viewMatrix);
    var tempVector = vector.clone();
    tempVector.applyMatrix4(viewMatrix);
    var angles = [];
    for (var i = 0; i < faces.length; i++) {
      var tempNormal = faces[i].normal.clone();
      tempNormal.applyMatrix3(normalMatrix);
      /**
       * 按道理这里应该判断两向量夹角是否等于0，但是因为存在精度问题；
       * 有可能得到的角度很接近0，但却不等于0，另外不确定到底保留几位小数合适；
       * 因此使用判断最小值的方式。
       */
      angles.push(tempNormal.angleTo(tempVector));
    }
    var minNo = min(angles).no;
    return faces[minNo].materialIndex;
  }

  /**
   * 获取顶部索引值
   */
  getUCubeIndex() {
    this.UCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = (this.orderNum - i - 1) * Math.pow(this.orderNum, 2);
      for (var j = 0; j < this.orderNum; j++) {
        this.UCubeIndex.push(start + j);
      }
    }
  }

  /**
   * 获取右部索引值
   */
  getRCubeIndex(){
    this.RCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = (i + 1) * this.orderNum - 1;
      for (var j = 0; j < this.orderNum; j++) {
        this.RCubeIndex.push(start + j * Math.pow(this.orderNum, 2));
      }
    }
  }

  /**
   * 获取前部索引值
   */
  getFCubeIndex(){
    this.FCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = i * this.orderNum;
      for (var j = 0; j < this.orderNum; j++) {
        this.FCubeIndex.push(start + j);
      }
    }
  }

  /**
   * 获取底部索引值
   */
  getDCubeIndex(){
    this.DCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = Math.pow(this.orderNum, 2) * (i + 1) - this.orderNum;
      for (var j = 0; j < this.orderNum; j++) {
        this.DCubeIndex.push(start + j);
      }
    }
  }

  /**
   * 获取左部索引值
   */
  getLCubeIndex(){
    this.LCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = (Math.pow(this.orderNum, 2) - this.orderNum + i) * this.orderNum;
      for (var j = 0; j < this.orderNum; j++) {
        this.LCubeIndex.push(start - Math.pow(this.orderNum, 2) * j);
      }
    }
  }

  /**
   * 获取后部索引值
   */
  getBCubeIndex(){
    this.BCubeIndex = [];
    for (var i = 0; i < this.orderNum; i++) {
      var start = (Math.pow(this.orderNum, 2) - this.orderNum + i) * this.orderNum + (this.orderNum - 1);
      for (var j = 0; j < this.orderNum; j++) {
        this.BCubeIndex.push(start - j);
      }
    }
  }

  /**
   * 获得自身坐标系的坐标轴在世界坐标系中坐标
   */
  updateCurLocalAxisInWorld(){
    var center = new THREE.Vector3(0, 0, 0);
    var xPoint = new THREE.Vector3(1, 0, 0);
    var xPointAd = new THREE.Vector3(-1, 0, 0);
    var yPoint = new THREE.Vector3(0, 1, 0);
    var yPointAd = new THREE.Vector3(0, -1, 0);
    var zPoint = new THREE.Vector3(0, 0, 1);
    var zPointAd = new THREE.Vector3(0, 0, -1);

    var matrix = this.group.matrixWorld;
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

  /**
   * 改变魔方阶数
   */
  changeOrder(num,len){
    this.orderNum = num;
    this.cubeLen = len;
    this.createCube();
  }

  /**
   * 创建方块
   */
  createCube(){
    //删除以前的物体
    this.initStatus = [];
    if(this.container){
      this.group.remove(this.container);
    }
    if (this.cubes && this.cubes.length>0){
      for (var i = 0; i < this.cubes.length; i++) {
        this.group.remove(this.cubes[i]);
      }
    }

    //生成魔方小正方体
    this.cubes = SimpleCube(BasicParams.x, BasicParams.y, BasicParams.z, this.orderNum, this.cubeLen, BasicParams.colors);
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
      this.group.add(item);
    }
    //透明正方体
    var width = this.orderNum * this.cubeLen;
    var cubegeo = new THREE.BoxGeometry(width, width, width);
    var cubemat = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });
    this.container = new THREE.Mesh(cubegeo, cubemat);
    this.container.cubeType = 'coverCube';
    this.group.add(this.container);

    this.getMinCubeIndex();
    this.getUCubeIndex();
    this.getRCubeIndex();
    this.getFCubeIndex();
    this.getDCubeIndex();
    this.getLCubeIndex();
    this.getBCubeIndex();
  }

  /**
   * 生成模型并加入到场景中
   * type 视角类型，front表示正视角、back表示反视角
   */
  model(type) {
    //网格元素直接放入到一个集合里边，方便整体进行矩阵变换，比如缩放等。
    this.group = new THREE.Group();
    this.group.childType = type;

    this.createCube();
    
    //进行一定的旋转变换保证三个面可视
    if(type==this.main.frontViewName){
      this.group.rotateY(45/180*Math.PI);
    }else{
      this.group.rotateY((270-45) / 180 * Math.PI);
    }
    this.group.rotateOnAxis(new THREE.Vector3(1, 0, 1), 25 / 180 * Math.PI);
    this.showInScene();
  }

  /**
   * 显示在场景中
   */
  showInScene(){
    this.isVisible = true;
    this.main.scene.add(this.group);
  }

  /**
   * 隐藏
   */
  hideInScene(){
    this.isVisible = false;
    this.main.scene.remove(this.group);
  }

  /**
   * 高度所占比例发生变化
   */
  resizeHeight(percent,transformTag){
    if (percent < this.main.minPercent){
      percent = this.main.minPercent;
    }
    if (percent > (1 - this.main.minPercent)){
      percent = 1 - this.main.minPercent;
    }
    this.group.scale.set(percent, percent, percent);
    this.group.position.y = this.main.originHeight * (0.5 - percent / 2) * transformTag;
  }

  /**
   * 更新位置索引
   */
  updateCubeIndex(elements) {
    for (var i = 0; i < elements.length; i++) {
      var temp1 = elements[i];
      for (var j = 0; j < this.initStatus.length; j++) {
        var temp2 = this.initStatus[j];
        if (Math.abs(temp1.position.x - temp2.x) <= this.cubeLen / 2 &&
          Math.abs(temp1.position.y - temp2.y) <= this.cubeLen / 2 &&
          Math.abs(temp1.position.z - temp2.z) <= this.cubeLen / 2) {
          temp1.cubeIndex = temp2.cubeIndex;
          break;
        }
      }
    }
  }

  /**
   * 转动一定角度
   */
  rotate(elements, direction ,angle) {
    var rotateMatrix = new THREE.Matrix4();//旋转矩阵
    var origin = new THREE.Vector3(0, 0, 0);

    switch (direction) {
      case 0.1:
      case 1.2:
      case 2.4:
      case 3.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wZLine, -angle);
        break;
      case 0.2:
      case 1.1:
      case 2.3:
      case 3.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wZLine, angle);
        break;
      case 0.4:
      case 1.3:
      case 4.3:
      case 5.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wYLine, -angle);
        break;
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wYLine, angle);
        break;
      case 2.2:
      case 3.1:
      case 4.1:
      case 5.2:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wXLine, angle);
        break;
      case 2.1:
      case 3.2:
      case 4.2:
      case 5.1:
        rotateMatrix = this.rotateAroundWorldAxis(origin, this.wXLine, -angle);
        break;
      default:
        break;
    }
    for (var i = 0; i < elements.length; i++) {
      elements[i].applyMatrix(rotateMatrix);
    }
  }

  /**
   * 自动转动动画
   * currentstamp 当前时间
   * startstamp   开始时间
   */
  rotateAnimation(elements, direction, currentstamp, startstamp, laststamp, callback ,totalTime ,rotateAngle) {
    var self = this;
    var isAnimationEnd = false;//动画是否结束
    if (rotateAngle == null){
      rotateAngle = 90;
    }

    if (startstamp === 0) {
      startstamp = currentstamp;
      laststamp = currentstamp;
    }
    if (currentstamp - startstamp >= totalTime) {
      isAnimationEnd = true;
      currentstamp = startstamp + totalTime;
    }
    var angle = rotateAngle * Math.PI / 180 * (currentstamp - laststamp) / totalTime;

    this.rotate(elements,direction,angle);
    
    if (!isAnimationEnd) {
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, startstamp, currentstamp, callback, totalTime, rotateAngle);
      });
    }else{
      callback();
    }
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
   * 计算转动向量
   */
  getDirectionAxis(sub){
    this.updateCurLocalAxisInWorld();
    //判断差向量和x、y、z轴的夹角
    var xAngle = sub.angleTo(this.xLine);
    var xAngleAd = sub.angleTo(this.xLineAd);
    var yAngle = sub.angleTo(this.yLine);
    var yAngleAd = sub.angleTo(this.yLineAd);
    var zAngle = sub.angleTo(this.zLine);
    var zAngleAd = sub.angleTo(this.zLineAd);
    var minAngle = Math.min.apply(null, [xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

    var axis;
    switch (minAngle){
      case xAngle:
        axis = this.xLine.clone();
        break;
      case xAngleAd:
        axis = this.xLineAd.clone();
        break;
      case yAngle:
        axis = this.yLine.clone();
        break;
      case yAngleAd:
        axis = this.yLineAd.clone();
        break;
      case zAngle:
        axis = this.zLine.clone();
        break;
      case zAngleAd:
        axis = this.zLineAd.clone();
        break;
    }

    return axis;
  }

  /**
   * 计算转动方向
   */
  getDirection(axis, normalize) {
    var direction;

    if(axis.equals(this.xLine)){
      direction = 0;//向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
      if (normalize.equals(this.wYLine)) {
        direction = direction + 0.1;//绕z轴顺时针
      } else if (normalize.equals(this.wYLineAd)) {
        direction = direction + 0.2;//绕z轴逆时针
      } else if (normalize.equals(this.wZLine)) {
        direction = direction + 0.3;//绕y轴逆时针
      } else {
        direction = direction + 0.4;//绕y轴顺时针
      }
    }else if(axis.equals(this.xLineAd)){
      direction = 1;//向x轴反方向旋转90度
      if (normalize.equals(this.wYLine)) {
        direction = direction + 0.1;
      } else if (normalize.equals(this.wYLineAd)) {
        direction = direction + 0.2;
      } else if (normalize.equals(this.wZLine)) {
        direction = direction + 0.3;
      } else {
        direction = direction + 0.4;
      }
    }else if(axis.equals(this.yLine)){
      direction = 2;//向y轴正方向旋转90度
      if (normalize.equals(this.wZLine)) {
        direction = direction + 0.1;
      } else if (normalize.equals(this.wZLineAd)) {
        direction = direction + 0.2;
      } else if (normalize.equals(this.wXLine)) {
        direction = direction + 0.3;
      } else {
        direction = direction + 0.4;
      }
    }else if(axis.equals(this.yLineAd)){
      direction = 3;//向y轴反方向旋转90度
      if (normalize.equals(this.wZLine)) {
        direction = direction + 0.1;
      } else if (normalize.equals(this.wZLineAd)) {
        direction = direction + 0.2;
      } else if (normalize.equals(this.wXLine)) {
        direction = direction + 0.3;
      } else {
        direction = direction + 0.4;
      }
    }else if(axis.equals(this.zLine)){
      direction = 4;//向z轴正方向旋转90度
      if (normalize.equals(this.wYLine)) {
        direction = direction + 0.1;
      } else if (normalize.equals(this.wYLineAd)) {
        direction = direction + 0.2;
      } else if (normalize.equals(this.wXLine)) {
        direction = direction + 0.3;
      } else {
        direction = direction + 0.4;
      }
    }else if(axis.equals(this.zLineAd)){
      direction = 5;//向z轴反方向旋转90度
      if (normalize.equals(this.wYLine)) {
        direction = direction + 0.1;
      } else if (normalize.equals(this.wYLineAd)) {
        direction = direction + 0.2;
      } else if (normalize.equals(this.wXLine)) {
        direction = direction + 0.3;
      } else {
        direction = direction + 0.4;
      }
    }

    return direction;
  }

  /**
   * 根据索引获取方块
   */
  getCubeByIndex(index) {
    var cube;
    for (var i = 0; i < this.cubes.length; i++) {
      if (this.cubes[i].cubeIndex == index + this.minCubeIndex) {
        cube = this.cubes[i];
        break;
      }
    }
    return cube;
  }

  /**
   * 滑动魔方参数重置
   */
  slideReset(){
    this.slideElements = null;
    this.slideDirection = null;
    this.slideAngle = null;
    this.slideAbsAngle = null;
    this.slideStartTime = null;
    this.slideCurrentTime = null;
  }

  /**
   * 滑动魔方
   */
  slideMove(startTouch, moveTouch, anotherRubik, startPoint, startNormalize, movePoint, moveNormalize){
    if (this.slideElements == null) {
      var sub = movePoint[0].point.sub(startPoint[0].point);//计算滑动向量
      if (sub.length() > 0) {
        this.main.isSliding = true;
        var axis = this.getDirectionAxis(sub);//获得转动方向向量
        var cudeIndex = startPoint[0].object.cubeIndex
        this.slideDirection = this.getDirection(axis, startNormalize[0]);//根据转动方向和滑动平面区分转动情形
        this.slideAngle = 0;
        this.slideAbsAngle = 0;
        this.slideStartTime = new Date().getTime();
        this.slideCurrentTime = new Date().getTime();

        if (moveNormalize.length >= 2 && moveNormalize[0].equals(moveNormalize[1])) {//同一面多指操作
          this.slideElements = this.cubes;
        } else {
          this.slideElements = this.getBoxs(cudeIndex, this.slideDirection);
        }

        //设置另外一个视图魔方滑动参数
        anotherRubik.slideDirection = this.slideDirection;
        anotherRubik.slideAngle = this.slideAngle;
        anotherRubik.slideAbsAngle = 0;
        anotherRubik.slideStartTime = this.slideStartTime;
        anotherRubik.slideCurrentTime = this.slideCurrentTime;
        anotherRubik.slideElements = [];
        for (var i = 0; i < this.slideElements.length; i++) {
          anotherRubik.slideElements.push(anotherRubik.getCubeByIndex(this.slideElements[i].cubeIndex - this.minCubeIndex));
        }
      }
    }else{
      var angle = this.getRotateAngle(startTouch[0], moveTouch[0], this.slideDirection);
      this.rotate(this.slideElements, this.slideDirection, angle * Math.PI / 180);
      this.slideAngle += angle;
      this.slideAbsAngle += Math.abs(angle);
      this.slideCurrentTime = new Date().getTime();

      anotherRubik.rotate(anotherRubik.slideElements, anotherRubik.slideDirection, angle * Math.PI / 180);
      anotherRubik.slideAngle = this.slideAngle;
      anotherRubik.slideAbsAngle = this.slideAbsAngle;
      anotherRubik.slideCurrentTime = this.slideCurrentTime;
    }
  }

  /**
   * 滑动魔方结束
   */
  slideMoveEnd(callback){
    var angle = this.slideAngle % 90;
    var endAngle = this.slideAngle;
    if (Math.abs(angle) >= this.slideLimitAngle){//转动阀值
      if(angle>0){
        endAngle = parseInt(this.slideAngle / 90) * 90 + 90;
      }else{
        endAngle = parseInt(this.slideAngle / 90) * 90 - 90;
      }
    }else{
      if (angle > 0) {
        endAngle = parseInt(this.slideAngle / 90) * 90;
      } else {
        endAngle = parseInt(this.slideAngle / 90) * 90;
      }
    }

    var rotateAngle = endAngle - this.slideAngle;
    var rotateSpeed = this.slideAbsAngle / (this.slideCurrentTime - this.slideStartTime); // 手指滑动旋转速度
    var totalTime = Math.abs(rotateAngle) / rotateSpeed;

    var self = this;
    if (totalTime>0){//当手指滑动刚好停在初始状态时不需要自动还原
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(self.slideElements, self.slideDirection, timestamp, 0, 0, function () {
          self.updateCubeIndex(self.slideElements);
          self.slideReset();
          if (callback != null) {
            callback();
          }
        }, totalTime, rotateAngle);
      });
    }else{
      self.updateCubeIndex(self.slideElements);
      self.slideReset();
      if (callback != null) {
        callback();
      }
    }
  }

  /**
   * 获取旋转角度
   */
  getRotateAngle(startTouch,moveTouch,direction){
    var rotateAngle = 0;
    var angle = 0;
    switch (direction){
      case 0.3:
      case 4.4:
      case 1.4:
      case 5.3:
        angle = (moveTouch.clientX - startTouch.clientX) / window.innerWidth * 180;
        break;
      case 1.3:
      case 5.4:
      case 0.4:
      case 4.3:
        angle = (startTouch.clientX - moveTouch.clientX) / window.innerWidth * 180;
        break;
      case 3.1:
      case 3.4:
      case 3.2:
      case 3.3:
        angle = (moveTouch.clientY - startTouch.clientY) / window.innerWidth * 180;
        break;
      case 2.1:
      case 2.4:
      case 2.2:
      case 2.3:
        angle = (startTouch.clientY - moveTouch.clientY) / window.innerWidth * 180;
        break;
      case 4.1:
      case 1.2:
        var u = new THREE.Vector2(moveTouch.clientX - startTouch.clientX, startTouch.clientY - moveTouch.clientY);
        var v = new THREE.Vector2(2,-1);
        angle = u.dot(v) / v.length() / window.innerWidth * 180;
        break;
      case 5.1:
      case 0.2:
        var u = new THREE.Vector2(moveTouch.clientX - startTouch.clientX, startTouch.clientY - moveTouch.clientY);
        var v = new THREE.Vector2(-2, 1);
        angle = u.dot(v) / v.length() / window.innerWidth * 180;
        break;
      case 0.1:
      case 5.2:
        var u = new THREE.Vector2(moveTouch.clientX - startTouch.clientX, startTouch.clientY - moveTouch.clientY);
        var v = new THREE.Vector2(2, 1);
        angle = u.dot(v) / v.length() / window.innerWidth * 180;
        break;
      case 1.1:
      case 4.2:
        var u = new THREE.Vector2(moveTouch.clientX - startTouch.clientX, startTouch.clientY - moveTouch.clientY);
        var v = new THREE.Vector2(-2, -1);
        angle = u.dot(v) / v.length() / window.innerWidth * 180;
        break;
    }
    rotateAngle = angle - this.slideAngle;
    return rotateAngle;
  }

  /**
   * 转动魔方
   */
  rotateMove(cubeIndex, direction, callback, totalTime) {
    var self = this;
    totalTime = totalTime ? totalTime:this.defaultTotalTime;
    var elements = this.getBoxs(cubeIndex, direction);
    requestAnimationFrame(function (timestamp) {
      self.rotateAnimation(elements, direction, timestamp, 0, 0,function(){
        self.updateCubeIndex(elements);
        if (callback){
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
  getMinCubeIndex(){
    var ids = [];
    for (var i = 0; i < this.cubes.length; i++) {
      ids.push(this.cubes[i].cubeIndex);
    }
    this.minCubeIndex = Math.min.apply(null, ids);
  }

  /**
   * 根据触摸方块的索引以及滑动方向获得转动元素
   */
  getBoxs(cubeIndex, direction) {
    var targetIndex = cubeIndex;
    targetIndex = targetIndex - this.minCubeIndex;
    var numI = parseInt(targetIndex / Math.pow(this.orderNum,2));
    var numJ = targetIndex % Math.pow(this.orderNum, 2);
    var boxs = [];
    //根据绘制时的规律判断 no = i * Math.pow(this.orderNum, 2)+j
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
          if (numI === parseInt(tempId / Math.pow(this.orderNum, 2))) {
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
          if (parseInt(numJ / this.orderNum) === parseInt(tempId % Math.pow(this.orderNum, 2) / this.orderNum)) {
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
          if (tempId % Math.pow(this.orderNum, 2) % this.orderNum === numJ % this.orderNum) {
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
   * 以正视角魔方为基准
   * 魔方基本公式 U、R、F、D、L、B、u、r、f、d、l、b
   */
  U(next,num) {
    num = num?num:0;
    var cubeIndex = this.minCubeIndex + num*this.orderNum;
    this.rotateMove(cubeIndex, 1.3, next, 100);
  }
  R(next,num) {
    num = num?num:0;
    var cubeIndex = this.minCubeIndex + num*Math.pow(this.orderNum,2);
    this.rotateMove(cubeIndex, 2.4, next, 100);
  }
  F(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + num;
    this.rotateMove(cubeIndex, 4.1, next, 100);
  }
  D(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + (this.orderNum-1)*this.orderNum - num*this.orderNum;
    this.rotateMove(cubeIndex, 4.4, next, 100);
  }
  L(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + (this.orderNum - 1) * Math.pow(this.orderNum, 2) - num * Math.pow(this.orderNum, 2);
    this.rotateMove(cubeIndex, 1.1, next, 100);
  }
  B(next,num) {
    num = num?num:0;
    var cubeIndex = this.minCubeIndex + (this.orderNum-1) - num;
    this.rotateMove(cubeIndex, 2.1, next, 100);
  }
  u(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + num * this.orderNum;
    this.rotateMove(cubeIndex, 4.4, next, 100);
  }
  r(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + num * Math.pow(this.orderNum, 2);
    this.rotateMove(cubeIndex, 1.1, next, 100);
  }
  f(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + num;
    this.rotateMove(cubeIndex, 2.1, next, 100);
  }
  d(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + (this.orderNum - 1) * this.orderNum - num * this.orderNum;
    this.rotateMove(cubeIndex, 1.3, next, 100);
  }
  l(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + (this.orderNum - 1) * Math.pow(this.orderNum, 2) - num * Math.pow(this.orderNum, 2);
    this.rotateMove(cubeIndex, 2.4, next, 100);
  }
  b(next,num) {
    num = num ? num : 0;
    var cubeIndex = this.minCubeIndex + (this.orderNum - 1) - num;
    this.rotateMove(cubeIndex, 4.1, next, 100);
  }

  /**
   * 按顺序执行数组里边的方法
   */
  runMethodAtNo(arr, no, next) {
    var self = this;
    var len = parseInt(this.orderNum / 2) - 1;
    var num = Math.round(Math.random() * len);
    if (no >= arr.length - 1) {
      if (next) {
        this[arr[no]](next, num);
      } else {
        this[arr[no]](function(){},num);
      }
    } else {
      this[arr[no]](function () {
        if (no < arr.length - 1) {
          no++
          self.runMethodAtNo(arr, no, next);
        }
      },num);
    }
  }

  /**
   * 开始还原
   */
  startReset(){
    this.startTime = new Date().getTime();
    this.startSequences = this.toSequences();
    this.endTime = 0;
    this.resetProcess = [];
  }

  /**
   * 判断是否还原完成
   */
  isReset(){
    var sequences = this.toSequences();
    var faceLen = Math.pow(this.orderNum, 2);
    if (sequences.length == faceLen*6){
      for (var i = 0; i < sequences.length; i += faceLen) {
        var item = sequences[i];
        for (var j = 1; j < faceLen;j++){
          if (item != sequences[i+j]){
            return false;
          }
        }
      }
      return true;
    }else{
      return false;
    }
  }

  /**
   * 随机旋转，用于打乱魔方
   */
  randomRotate(callback) {
    var stepNum = 21;
    var stepArr = [];
    var funcArr = ['R', 'U', 'F', 'B', 'L', 'D', 'r', 'u', 'f', 'b', 'l', 'd'];
    for (var i = 0; i < stepNum; i++) {
      var num = parseInt(Math.random() * funcArr.length);
      stepArr.push(funcArr[num]);
    }
    this.runMethodAtNo(stepArr, 0, callback);
    return stepArr;
  }

  /**
   * 重置魔方
   */
  reset(){
    for(var i=0;i<this.cubes.length;i++){
      var matrix = this.cubes[i].matrix.clone();
      matrix.getInverse(matrix);
      var cube = this.cubes[i];
      cube.applyMatrix(matrix);

      for(var j=0;j<this.initStatus.length;j++){
        var status = this.initStatus[j];
        if (cube.id == status.cubeIndex){
          cube.position.x = status.x;
          cube.position.y = status.y;
          cube.position.z = status.z;
          cube.cubeIndex = cube.id;
          break;
        }
      }
    }
    this.startTime = 0;
    this.endTime = 0;
    this.startSequences = [];
    this.rotateSteps = [];
  }

  /**
   * 存储某个魔方的状态
   */
  save(rubik, position ,number) {
    for (var i = 0; i < this.cubes.length; i++) {
      var matrix = rubik.cubes[i].matrix.clone();
      var selfMat = this.cubes[i].matrix.clone();
      selfMat = selfMat.getInverse(selfMat);
      this.cubes[i].applyMatrix(selfMat);
      this.cubes[i].applyMatrix(matrix);
    }
    this.updateCubeIndex(this.cubes);

    if (position){
      this.group.position.x = position.x;
      this.group.position.y = position.y;
      this.group.position.z = position.z;
    }

    if (number!=null){
      this.group.scale.set(number, number, number);
    }
  }
}