import * as THREE from '../threejs/three.js'

export default class RestoreBtn {

  constructor(main) {
    this.main = main;
    var self = this;

    //实际尺寸
    this.realWidth = 129;
    this.realHeight = 64;

    this.radio = this.main.originWidth / 750;

    //逻辑尺寸
    this.width = this.realWidth * this.radio;
    this.height = this.realHeight * this.radio;

    //加载图片
    var loader = new THREE.TextureLoader();
    loader.load('images/restore-btn.png', function (texture) {
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
    this.plane.position.x = -this.main.originWidth / 2 + this.width / 2 + 50 * this.radio;
    this.plane.position.y = this.main.originHeight / 2 - this.height * 3 / 2 - 40 * this.radio;
  }
}