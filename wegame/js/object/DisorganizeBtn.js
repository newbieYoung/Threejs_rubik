import * as THREE from '../threejs/three.js'
import UIComponent from './UIComponent.js'

export default class DisorganizeBtn extends UIComponent {

  constructor(main) {
    super(main);
    this.setSize(64,64);
    
    var self = this;
    this.loadBackground('images/disorganize-btn.jpg',function(){
      self.defaultPosition();
      self.showInScene();
    });
  }

  /**
   * 默认位置
   */
  defaultPosition() {
    this.plane.position.x = -this.main.originWidth / 2 + this.width * 3 / 2 + 60 * this.radio;
    this.plane.position.y = this.main.originHeight / 2 - this.height * 3 / 2 - 35 * this.radio;

    this.screenRect.left = (this.main.originWidth / 2 + this.plane.position.x - this.width / 2) / this.main.uiRadio;
    this.screenRect.top = (this.main.originHeight / 2 - this.plane.position.y - this.height / 2) / this.main.uiRadio;
  }
}