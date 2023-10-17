# Color-Palette
網頁配色調色盤工具。

## 工具列
上方工具列依序為「Refresh(重新整理所有)」、「Sort(排序)」、「Insert Algo(插入色塊算法)」、「Mode(編輯色彩模式)」。

- ### Refresh(重新整理所有)
  將所有沒上鎖的色塊重新指派顏色。預計加入以調和色或對比色方式隨機產生的方式。
  
- ### Sort(排序)
  排序色塊。三種方法為「依照亮度(Gray)」、「隨機排序(Random)」、「反轉左右順序(Invert)」。
  
- ### nsert Algo(插入色塊算法)
  插入色塊的方法。兩種方法為「RGB 平均值（預設）」、「隨機(Random)」。
  
- ### Mode(編輯模式之色彩空間)
  進入編輯模式時，使用的色彩空間。提供「RGB（預設）」、「HSB」、「HSL」、「CMY」。

## 色塊Block
鼠標移至色塊上會顯示工具，依序為「刪除」、「鎖定」、「重新整理」、「編輯」。鼠標在色塊兩側會顯示箭頭，點選箭頭可在兩色塊間插入色塊。色塊的數量為2~8，預設5。
工具下方為色塊之Hex碼與rgb數值，在進入編輯模式時更換為編輯區塊。

- ### 刪除
  刪除色塊。色塊數量為2時隱藏。

- ### 鎖定
  將色塊鎖定，避免被重新指派顏色。

- ### 重新整理
  隨機重新指派顏色。

- ### 編輯
  進入編輯模式。具有「Hex碼input」以及「數值滑桿」。\
  編輯input後，會在離開input（點選其他位置）更新，若不是有效的Hex顏色，則不會更新。\
  滑桿的數值會即時更新，所使用的色彩空間可在上方「Mode」選單改變，預設為RGB模式。

## 版權宣告
Favicon: color-wheel.png來自flaticon之[Color creator](https://www.flaticon.com/authors/color-creator)
其餘圖案來自[Bootstrap Icons](https://icons.getbootstrap.com/)
