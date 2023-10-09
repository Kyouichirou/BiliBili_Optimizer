# BiliBili_Optimizer使用指南

![x](https://github.com/Kyouichirou/BiliBili_Optimizer/blob/main/images/t0150e030dee399c1a0.jpg?raw=true)

## 一. 前言

> 测试环境
>
> Chrome, Version 117.0.5938.89 (Official Build) (64-bit)
>
> Chromium, Version 86.0.4240.198 (64-bit)
>
> *建议: 使用尽可能高版本的chrome/chromium, 以及Tampermonkey.*
>
> *不建议使用**edge**(继承了微软出品高度臃肿垃圾的优秀传统), 推荐chrome或[centbrower](https://www.centbrowser.cn/)*

脚本主要生效页面: 

- 视频(不包含直播, 番剧, 只针对/video/页面)
- 主页
- 搜索
- up主页面

<!--more-->

## 二. 内容拦截

> 不想看到.
>
> 看完之后不想再看到.

这是脚本的**核心内容**.

- 拦截up, 拦截操作会自动同步到 视频, 主页, 搜索 这三个页面, 即页面中的视频是该up发布的将被移除, 不限制数量

  相关操作在up的页面

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/4f97d5a7-31dd-498e-bcd5-a9c69a26ba55)


- 拦截视频, 拦截操作会自动同步到 视频, 主页, 搜索 这三个页面, 限制数量, 默认999, 新添加进来的数据会被提前, 后面的弹出.

  见下面的快捷键, 和视频播放页面的菜单

- 关键词拦截, 将检查视频的标题和up主的名称

- 临时拦截up, a类关键词拦截触发, 数据只在当前页面生效

- 临时拦截视频, 快捷键触发, 数据只在当前页面生效

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/5449d4d3-5b98-4f96-8de0-4ce7ae7a1021)


大部分的拦截, 会是这种模式, 这是为了尽量减少对html元素的操作带来的负面影响, 少数被隐藏(这部分内容是html预先设置的, 只能隐藏).

每个视频都会被完整检查上述的内容, 任意一项满足, 即执行拦截.

## 三. 搜索优化

增加播放历史, 和评分.

- remove, 移除评分
- 历史记录, 自动执行, 999条, 当在视频页面停留超过一半的时间, 即认为已经播放

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/ecf0ea7b-5b08-4af3-96b0-c973812e3b73)

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/3382bac5-0de1-48c1-a531-6e565fb0bf4d)


## 四. 追踪清除

清除点击, 播放, 右键菜单等添加的追踪参数.

B站不管是视频还是其他的很多页面的url, 多会被页面事件添加各种追踪参数.

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/f7a366c4-0a22-4445-8d76-dbc340eccfcd)


例如搜索页面的视频url, 原本无追踪参数, 但是右键之后就会被添加.

## 五. 快捷键

| 快捷键 | 辅助                               | 功能                                               | 生效页面         |
| ------ | ---------------------------------- | -------------------------------------------------- | ---------------- |
| p      |                                    | 暂停/播放视频                                      | 视频             |
| l      |                                    | 视频关/开灯                                        | 视频             |
| t      |                                    | 视频影院模式                                       | 视频             |
| +      |                                    | 视频声音调大                                       | 视频             |
| -      |                                    | 视频声音调小                                       | 视频             |
| u      |                                    | 视频页面内全屏                                     | 视频             |
| f      |                                    | 视频全屏                                           | 视频             |
| m      |                                    | 静音                                               | 视频             |
| b      |                                    | 必应搜索                                           | 全站             |
| s      |                                    | 哔哩搜索                                           | 全站             |
| z      |                                    | 知乎搜索                                           | 全站             |
| ctrl   | 鼠标右键(鼠标放置在需要操作元素上) | 隐藏视频(仅在执行页面生效, 关闭后该数据将不被保存) | 视频, 主页, 搜索 |
| shift  | 鼠标右键(鼠标放置在需要操作元素上) | 拦截视频                                           | 视频, 主页, 搜索 |

搜索的执行逻辑, 选中, 假如无选中, 会尝试读取搜索框中的内容.

## 六. 页面优化

简单的`css`注入, 简化一下页面头部, 去除部分**广告, 热搜, 直播**等垃圾内容.

![image](https://github.com/Kyouichirou/BiliBili_Optimizer/assets/64763483/e95639ee-09cb-40d9-b549-ee27c5964d79)

## 七. 其他

![image](https://raw.githubusercontent.com/Kyouichirou/BiliBili_Optimizer/main/images/2023-10-09%2011%2059%2019.png)

- 视频播放速度, 以0.5变化, 最高不超过5倍, 在当前页面播放, 则速度会在播放下一个视频的时候继续维持, slow调低到2以下, 则恢复原来的页面播放速度控制状态.
- 自动关灯
  - 默认模式下, 根据时间自动触发, 时间设置根据月份, 以9月作为简单分割, 时间超过16, 17将自动关灯
  - 强制模式, 一直触发
  - 禁用, 不自动触发.

## 八. 小结

以上脚本仅作为交流学习使用, 无意侵犯B站....*B站功成不必在我, 倒闭必须有我(香菇滑鸡)*.
