import * as THREE from '../threejs/three.js'
import UIComponent from './UIComponent.js'

export default class TouchLine extends UIComponent {

  constructor(main) {
    super(main)
    this.setSize(750,64);

    var self = this;
    this.loadBackground('images/touch-line.png', function () {
      self.defaultPosition();
      self.showInScene();
    });
  }

  /**
   * 默认位置
   */
  defaultPosition(){
    this.enable();
    this.screenRect.left = 0;
    this.screenRect.top = window.innerHeight / 2 - this.screenRect.height / 2;
    this.move(window.innerHeight * (1-this.main.minPercent));
    this.disable();
  }

  move(y){
    if (this.isActive){
      var shouldHide = false;
      if (y < window.innerHeight * this.main.minPercent || y > window.innerHeight * (1-this.main.minPercent)) {
        shouldHide = true;
        if (y < window.innerHeight * this.main.minPercent) {
          y = window.innerHeight * this.main.minPercent;
        } else {
          y = window.innerHeight * (1-this.main.minPercent);
        }
      }

      var len = this.screenRect.top + this.screenRect.height / 2 - y;//屏幕移动距离
      this.screenRect.top = y - this.screenRect.height / 2;

      var percent = len / window.innerHeight;
      var len2 = this.main.originHeight * percent;
      this.plane.position.y += len2;
    }
  }
}