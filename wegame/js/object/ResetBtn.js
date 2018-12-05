import * as THREE from '../threejs/three.js'

export default class ResetBtn {

  constructor(main) {
    this.main = main;
    this.isActive = false;

    var self = this;
    //实际尺寸
    this.realWidth = 64;
    this.realHeight = 64;

    this.radio = this.main.originWidth / 750;

    //逻辑尺寸
    this.width = this.realWidth * this.radio;
    this.height = this.width;

    //屏幕尺寸
    this.screenRect = {
      width: this.width / this.main.uiRadio,
      height: this.height / this.main.uiRadio
    }
    
    //加载图片
    var loader = new THREE.TextureLoader();
    loader.load('images/reset-btn.png', function (texture) {
      var geometry = new THREE.PlaneBufferGeometry(self.width, self.height);
      var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
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
  defaultPosition() {
    this.plane.position.x = -this.main.originWidth/2 + this.width/2 + 50*this.radio;
    this.plane.position.y = this.main.originHeight / 2 - this.height / 2 - 20 * this.radio;
    
    this.screenRect.left = (this.main.originWidth / 2 + this.plane.position.x - this.width / 2) / this.main.uiRadio;
    this.screenRect.top = (this.main.originHeight / 2 - this.plane.position.y - this.height / 2) / this.main.uiRadio;
  }

  /**
   * 判断是否在范围内
   */
  isHover(touch) {
    var isHover = false;
    if (touch.clientY >= this.screenRect.top && touch.clientY <= this.screenRect.top + this.screenRect.height && touch.clientX >= this.screenRect.left && touch.clientX <= this.screenRect.left + this.screenRect.width) {
      isHover = true;
    }
    return isHover;
  }

  enable() {
    this.isActive = true;
  }
  disable() {
    this.isActive = false;
  }
}