import * as THREE from '../threejs/three.js'
import UIBase from './UIBase.js'

export default class Button extends UIBase {

  constructor(main) {
    super(main);
    this.radio = this.main.originWidth / 750;
    this.uiRadio = this.main.uiRadio;
  }

  /**
   * 设置尺寸
   */
  setSize(width,height){
    //实际尺寸
    this.realWidth = width;
    this.realHeight = height;

    //逻辑尺寸
    this.width = this.realWidth * this.radio;
    this.height = this.realHeight * this.radio;

    //屏幕尺寸
    this.screenRect = {
      width: this.width / this.main.uiRadio,
      height: this.height / this.main.uiRadio
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

  /**
   * 加载纹理背景
   */
  loadBackground(url,callback){
    var self = this;
    var loader = new THREE.TextureLoader();
    loader.load(url, function (texture) {
      var geometry = new THREE.PlaneBufferGeometry(self.width, self.height);
      var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      self.plane = new THREE.Mesh(geometry, material);
      self.plane.position.set(0, 0, 0);
      self.main.scene.add(self.plane)
      if (callback){
        callback();
      }
    }, function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (xhr) {
      console.log('An error happened');
    });
  }

  /**
   * 返回中心位置
   */
  getPosition() {
    return this.plane.position.clone();
  }
}