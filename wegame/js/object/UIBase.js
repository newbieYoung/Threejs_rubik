/**
 * main
 * isActive
 */

export default class UIBase {

  constructor(main) {
    this.main = main;
    this.isActive = false;
  }

  //状态切换
  enable(touch) {
    this.isActive = true;
  }
  disable(touch) {
    this.isActive = false;
  }
}