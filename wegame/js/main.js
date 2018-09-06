
import MainPage from 'ui/MainPage.js'

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.context = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mainPage = new MainPage();//初始化游戏主页面
    this.render();
  }

  /**
   * 渲染
   */
  render() {
    this.context.clearRect(0,0,this.width,this.height);
    this.mainPage.render(this.context);      
    requestAnimationFrame(this.render.bind(this), canvas);
  }
}