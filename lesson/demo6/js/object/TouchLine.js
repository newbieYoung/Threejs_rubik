import * as THREE from '../threejs/three.js'

export default class TouchLine {

  constructor(main) {
    this.main = main;
    this.isActive = false;

    var self = this;

    //实际尺寸
    this.realWidth = 750;
    this.realHeight = 64;

    //逻辑尺寸
    this.width = this.main.originWidth;
    this.height = this.realHeight * this.width / this.realWidth;

    //屏幕尺寸
    this.screenRect = {
      width: window.innerWidth,
      height: this.realHeight * window.innerWidth / self.realWidth
    }
    this.screenRect.left = 0;
    this.screenRect.top = window.innerHeight / 2 - this.screenRect.height / 2;

    //加载图片
    var loader = new THREE.TextureLoader();
    loader.load('images/touch-line.png', function (texture) {
      var geometry = new THREE.PlaneGeometry(self.width, self.height);
      var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      self.plane = new THREE.Mesh(geometry, material);
      self.plane.position.set(0, 0, 0);
      self.main.scene.add(self.plane);
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
    this.enable();
    this.move(window.innerHeight * (1 - this.main.minPercent));
    this.disable();
  }

  enable() {
    this.isActive = true;
  }

  disable() {
    this.isActive = false;
  }

  move(y) {
    if (this.isActive) {
      if (y < window.innerHeight * this.main.minPercent || y > window.innerHeight * (1 - this.main.minPercent)) {
        if (y < window.innerHeight * this.main.minPercent) {
          y = window.innerHeight * this.main.minPercent;
        } else {
          y = window.innerHeight * (1 - this.main.minPercent);
        }
      }

      var len = this.screenRect.top + this.screenRect.height / 2 - y;//屏幕移动距离
      this.screenRect.top = y - this.screenRect.height / 2;

      var percent = len / window.innerHeight;
      var len2 = this.main.originHeight * percent;
      this.plane.position.y += len2;
    }
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
}