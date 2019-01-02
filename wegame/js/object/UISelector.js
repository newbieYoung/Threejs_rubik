import * as THREE from '../threejs/three.js'
import UIComponent from './UIComponent.js'

/**
 * coverWidth
 * coverHeight
 * optionHeight
 * options
 * cover
 * content
 * items
 * hoveredItem
 */

export default class UISelector extends UIComponent {

  constructor(main) {
    super(main);

    this.coverWidth = 750;
    this.coverHeight = this.coverWidth * window.innerHeight / window.innerWidth;
    this.optionHeight = 80;
    this.options = [{
      text: '2阶',
      num: 2
    }, {
      text: '3阶',
      num: 3
    }, {
      text: '4阶',
      num: 4
    }]
    
    this._createCover();
    this._createOptions();
  }

  /**
   * 判断是否在范围内
   */
  isHover(touch) {
    var hoveredItem = null;
    for(var i=0;i<this.items.length;i++){
      var item = this.items[i];
      if(item.isHover(touch)){
        hoveredItem = i;
        break;
      }
    }
    console.log(hoveredItem);
    if (hoveredItem){
      this.hoveredItem = hoveredItem;
      return true;
    }else{
      return false;
    }
  }

  //状态切换
  enable(touch) {
    this.isActive = true;
  }
  disable(touch) {
    this.isActive = false;
  }

  /**
   * 在场景中显示
   */
  showInScene() {
    this.cover.showInScene();
    for(var i=0;i<this.items.length;i++){
      this.items[i].showInScene();
    }
  }

  /**
   * 在场景中隐藏
   */
  hideInScene(){
    this.cover.hideInScene();
    for(var i=0;i<this.items.length;i++){
      this.items[i].hideInScene();
    }
  }

  //创建遮罩
  _createCover(){
    this.cover = new UIComponent(this.main);
    this.cover.create({
      width:this.coverWidth,
      height:this.coverHeight,
      backgroundColor: 'rgba(0,0,0,.4)',
    });
    this.cover.setPosition(null,null,this.cover.plane.position.z+100)
  }

  //创建选项
  _createOptions(){
    var center = (this.options.length+1)/2;
    this.items = [];
    for(var i=0;i<this.options.length;i++){
      var item = new UIComponent(this.main);
      var uiParams = {
        width: this.coverWidth / 2,
        height: this.optionHeight,
        backgroundColor: 'rgba(255,255,255,1)',
        fontWeight:'400',
        fontSize:'25',
        fontColor:'rgba(0,0,0,1)',
        fontFamily:'sans-serif',
        content: this.options[i].text,
        pixelRatio:2
      };
      if (i!=0){
        uiParams.borderTop = 1;
        uiParams.borderColor = 'rgba(153,153,153,1)';
      }
      item.create(uiParams);
      item.plane.position.y += (center - i - 1) * this.optionHeight * this.radio;
      item.plane.position.z += 100;
      this.items.push(item);
    }
  }
}