export default class UIBase {

  constructor(main) {
    this.main = main;
    this.isActive = false;
  }

  //状态切换
  enable() {
    this.isActive = true;
  }
  disable() {
    this.isActive = false;
  }
}