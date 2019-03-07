import * as THREE from '../threejs/three.js'
import UIComponent from './UIComponent.js'

/**
 * coverWidth
 * coverHeight
 * optionHeight
 * offsetZ
 * options
 * cover
 * content
 * items
 * optionGroup
 * hoveredItem
 */

export default class UISelector extends UIComponent {

  constructor(main) {
    super(main);

    this.coverWidth = 750;
    this.coverHeight = this.coverWidth * window.innerHeight / window.innerWidth;
    this.optionHeight = 80;
    this.offsetZ = 110;//UI平面Z轴偏移
    this.options = [{
      text: '2阶',
      data: { orderNum: 2, cubeLen: 60 }
    }, {
      text: '3阶',
      data: { orderNum: 3, cubeLen: 50 }
    }, {
      text: '4阶',
      data: { orderNum: 4, cubeLen: 40 }
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
    if (hoveredItem!=null){
      this.hoveredItem = hoveredItem;
      this.enable();
      return true;
    }else{
      return false;
    }
  }

  //状态切换
  enable() {
    this.isActive = true;
    this.items[this.hoveredItem].plane.material.color.setHex(0xeeeeee);
  }
  disable() {
    this.isActive = false;
    for(var i=0;i<this.items.length;i++){
      this.items[i].plane.material.color.setHex(0xffffff);
    }
  }

  /**
   * 在场景中显示
   */
  showInScene() {
    this.cover.showInScene();
    this.main.scene.add(this.optionGroup);
  }

  /**
   * 在场景中隐藏
   */
  hideInScene(){
    this.cover.hideInScene();
    this.main.scene.remove(this.optionGroup);
  }

  //创建遮罩
  _createCover(){
    this.cover = new UIComponent(this.main);
    this.cover.loadStyle({
      width:this.coverWidth,
      height:this.coverHeight,
      backgroundColor: 'rgba(0,0,0,.4)',
    });
    this.cover.setPosition(null,null,this.cover.plane.position.z+this.offsetZ);
  }

  //创建选项
  _createOptions(){
    var center = (this.options.length+1)/2;
    this.items = [];
    this.optionGroup = new THREE.Group();
    for(var i=0;i<this.options.length;i++){
      var item = new UIComponent(this.main);
      var uiParams = {
        width: this.coverWidth / 2,
        height: this.optionHeight,
        backgroundColor: 'rgba(255,255,255,1)',
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
      item.loadStyle(uiParams);
      var y = item.plane.position.y + (center - i - 1) * this.optionHeight * this.radio;
      var z = item.plane.position.z + this.offsetZ;
      item.setPosition(null, y, z);
      this.optionGroup.add(item.plane);
      this.items.push(item);
    }
  }
}