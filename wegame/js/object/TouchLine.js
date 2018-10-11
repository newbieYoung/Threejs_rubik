import * as THREE from '../threejs/three.js'

export default class TouchLine {

  constructor(main) {
    this.main = main;
    this.isActive = false;
    this.isVisiable = true;

    var self = this;
    //滑动条实际尺寸
    this.realWidth = 750;
    this.realHeight = 68;

    //滑动条逻辑尺寸
    this.width = 248;//把touchline放在原点位置时视野内宽度为248*2
    this.height = this.realHeight * this.width / self.realWidth;
    this.wholeWidth = this.width;
    this.wholeHeight = this.wholeWidth / this.main.camera.aspect;

    this.screenRect = {
      width: window.innerWidth,
      height: this.realHeight * window.innerWidth / self.realWidth
    }
    this.screenRect.left = 0;
    this.screenRect.top = window.innerHeight / 2 - this.screenRect.height / 2;
    
    //球体
    var loader = new THREE.TextureLoader();
    loader.load('images/touch-line.png', function (texture) {
      var geometry = new THREE.PlaneBufferGeometry(self.width, self.height);
      var material = new THREE.MeshBasicMaterial({ map: texture,transparent:true});
      self.plane = new THREE.Mesh(geometry, material);
      self.plane.position.set(0, 0, 0);
      self.main.scene.add(self.plane)
    }, function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (xhr) {
      console.log('An error happened');
    });
  }

  enable(){
    if (this.isVisiable){
      this.isActive = true;
    }
  }

  disable(){
    this.isActive = false;
  }

  hide(){
    this.isVisiable = true;
  }

  show(){
    this.isVisiable = false;
  }

  move(y){
    var len = this.screenRect.top + this.screenRect.height / 2 - y;//屏幕移动距离
    var percent = len / window.innerHeight;
    var len2 = this.wholeHeight * percent;
    this.plane.position.y += len2;
    this.screenRect.top = y - this.screenRect.height / 2;
  }
}