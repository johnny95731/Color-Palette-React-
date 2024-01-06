# Color-Palette
網頁配色調色盤工具，。

## Header工具列
上方工具列依序為「Refresh(重新整理所有)」、「Sort(排序)」、「Insert Algo(插入色塊算法)」、「Mode(編輯色彩模式)」。

- ### ![Refresh](res/img/arrow-clockwise.svg) All
  更換所有沒上鎖的色塊，快捷鍵: `空白建(space)`<br />
  
- ### ![](res/img/file-earmark-plus.svg) Sort (排序)
  排序色塊。三種方法為「依照亮度(Gray, 快捷鍵: `g`)」、「隨機排序(Random, 快捷鍵: `r`)」、「反轉左右順序(Invert)」。
  
- ### ![](res/img/file-earmark-plus.svg)  Blend (混色方法)
  混色方法，提供「平均值（Mean，預設）」、「隨機(Random)」。平均值以Space選取值計算。
  
- ### ![](res/img/sliders.svg)  Space (色彩空間)
  顯示模式及編輯模式中，使用的色彩空間。提供「RGB（預設）」、「HSB」、「HSL」、「CMY」。
  
- ### ![](res/img/bookmark-plus.svg) Add / ![](res/img/bookmark-dash.svg) Del (調色盤加入書籤)
  將調色盤（顏色組合）加入書籤，
  
- ### ![](res/img/bookmarks.svg) Bookmarks (開啟書籤)
  開啟書籤欄，包括顏色及調色盤。

## 色塊Block
鼠標移至色塊上會顯示工具，依序為「刪除」、「鎖定」、「加入書籤」、「拉動色塊」、「重新整理」、「編輯」。鼠標在色塊兩側會顯示箭頭，點選箭頭可在兩色塊間插入色塊。色塊的數量為2~8，預設5。

- ### ![Del](res/img/x-lg.svg) 刪除
  刪除色塊。色塊數量為2時隱藏。

- ### ![](res/img/unlock-fill.svg) 非鎖定中 / ![](res/img/lock-fill.svg) 鎖定中
  色塊鎖定可避免被Refresh更換顏色，仍可使用編輯模式修改。

- ### ![](res/img/star.svg) 加入書籤
  隨機更換顏色。

- ### ![](res/img/arrows.svg) 拉動色塊
  拉動色塊

- ### ![](res/img/arrow-clockwise.svg) 更換
  隨機更換顏色。

- ### ![](res/img/sliders.svg) 編輯模式
  進入編輯模式，可使用「Hex碼」以及「數值滑桿」更換顏色。<br />

- ### 顯示模式 / 編輯模式
  在顯示模式中，顯示Hex碼以及特定色彩空間數值。點選文字即可複製字串。<br />
  可在上方「Edit」選單改變色彩空間，預設為RGB。<br />
  在編輯模式中，Hex碼換更換為可編輯狀態，色彩空間轉為滑桿。<br />
  編輯Hex碼後，會在點選其他位置時更新，若不是有效的Hex顏色，則不會更新。<br />
  滑桿會即時更新數值。

## 版權宣告
Favicon: color-wheel.png來自flaticon之[Color creator](https://www.flaticon.com/authors/color-creator)<br />
triangle-down.svg來自[svgrepo](https://www.svgrepo.com/svg/108052/arrow-down-filled-triangle)<br />
其餘圖案來自[Bootstrap Icons](https://icons.getbootstrap.com/)
