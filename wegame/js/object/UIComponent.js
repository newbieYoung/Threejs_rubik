import * as THREE from '../threejs/three.js'
import UIBase from './UIBase.js'

/**
 * radio
 * uiRadio
 * radius
 * bgColor
 * plane
 * realWidth
 * realHeight
 * width
 * height
 * screenRect : {width,height,left,top}
 */

export default class UIComponent extends UIBase {
  
  constructor(main) {
    super(main);
    this.radio = this.main.originWidth / 750;
    this.uiRadio = this.main.uiRadio;
  }

  /**
   * 在场景中显示
   */
  showInScene(){
    this.main.scene.add(this.plane);
  }

  /**
   * 在场景中隐藏
   */
  hideInScene(){
    this.main.scene.remove(this.plane);
  }

  /**
   * 创建UI元素
   */
  create(width, height, color, radius){
    this.radius = radius;
    this.bgColor = color;
    this.setSize(width,height);
    var geometry = new THREE.PlaneGeometry(this.width, this.height);
    var texture = new THREE.CanvasTexture(this._background());
    var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    this.plane = new THREE.Mesh(geometry, material);
    this.showInScene();
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
      self.showInScene();
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
   * 设置位置
   */
  setPosition(x,y,z){
    if(x){
      this.plane.position.x = x;
    }
    if(y){
      this.plane.position.y = y;
    }
    if(z){
      this.plane.position.z = z;
    }

    this.screenRect.left = (this.main.originWidth / 2 + this.plane.position.x - this.width / 2) / this.main.uiRadio;
    this.screenRect.top = (this.main.originHeight / 2 - this.plane.position.y - this.height / 2) / this.main.uiRadio;
  }

  /**
   * 返回中心位置
   */
  getPosition() {
    return this.plane.position.clone();
  }

  //创建圆角矩形
  _radiusRect(context, options) {
    var min = options.width > options.height ? options.height : options.width;
    if (options.radius * 2 > min) {
      options.radius = min / 2;
    }
    context.moveTo(options.x + options.radius, options.y);
    context.lineTo(options.x + options.width - options.radius, options.y);
    context.quadraticCurveTo(options.x + options.width, options.y, options.x + options.width, options.y + options.radius);//quadraticCurveTo二次贝塞尔曲线
    context.lineTo(options.x + options.width, options.y + options.height - options.radius);
    context.quadraticCurveTo(options.x + options.width, options.y + options.height, options.x + options.width - options.radius, options.y + options.height);
    context.lineTo(options.x + options.radius, options.y + options.height);
    context.quadraticCurveTo(options.x, options.y + options.height, options.x, options.y + options.height - options.radius);
    context.lineTo(options.x, options.y + options.radius);
    context.quadraticCurveTo(options.x, options.y, options.x + options.radius, options.y);
    context.strokeStyle = options.backgroundColor;
    context.stroke();
    context.fillStyle = options.backgroundColor;
    context.fill();
  }

  //生成背景素材
  _background() {
    var canvas = document.createElement('canvas');
    canvas.width = this.realWidth;
    canvas.height = this.realHeight;
    var context = canvas.getContext('2d');
    context.beginPath();
    this._radiusRect(context, { radius: this.radius, width: this.realWidth, height: this.realHeight, x: 0, y: 0, backgroundColor: this.bgColor });
    context.closePath();
    return canvas;
  }
}