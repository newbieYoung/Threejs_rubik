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
    this.width = this.main.originWidth;
    this.height = this.realHeight * this.width / self.realWidth;

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
      self.defaultPosition();
    }, function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (xhr) {
      console.log('An error happened');
    });
  }

  /**
   * 默认位置
   */
  defaultPosition(){
    this.enable();
    this.move(window.innerHeight * 0.8);//默认正视图占80%区域，反视图占20%区域
    this.disable();
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
    if (this.isVisiable){
      this.isVisiable = false;
      this.main.scene.remove(this.plane);
    }
  }

  show(){
    if (!this.isVisiable){
      this.isVisiable = true;
      this.main.scene.remove(this.plane);
    }
  }

  move(y){
    if (this.isActive){
      var shouldHide = false;
      if (y < window.innerHeight * 0.2 || y > window.innerHeight * 0.8) {//小视图区域得最少得占20%，否则就隐藏掉
        shouldHide = true;
        if (y < window.innerHeight * 0.2) {
          y = window.innerHeight * 0.2;
        } else {
          y = window.innerHeight * 0.8;
        }
      }

      var len = this.screenRect.top + this.screenRect.height / 2 - y;//屏幕移动距离
      var percent = len / window.innerHeight;
      var len2 = this.main.originHeight * percent;
      this.plane.position.y += len2;
      this.screenRect.top = y - this.screenRect.height / 2;

      if (shouldHide){
        this.disable();
        this.hide();
      }
    }
  }
}