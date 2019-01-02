import * as THREE from '../threejs/three.js'

export default class DisorganizeBtn {

  constructor(main) {
    this.main = main;
    this.isActive = false;
  }

  /**
   * 默认位置
   */
  defaultPosition() {}

  /**
   * 判断是否在范围内
   */
  isHover(touch) {}

  /**
   * 状态切换
   */
  enable() {}
  disable() {}
}