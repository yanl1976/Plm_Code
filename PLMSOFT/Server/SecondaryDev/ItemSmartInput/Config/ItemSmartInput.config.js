/**
 * 物料录入助手 —— 地址配置文件
 *
 * 作用：把「治理服务地址」从 ItemSmartInput.js 里抽出来。
 *       IP / 端口变化时只改本文件，不用重新发布主 JS。
 *
 * 生效方式：本文件由 ItemSmartInput.fileref 注册，且**先于** ItemSmartInput.js 加载。
 *           改完保存 → 浏览器 Ctrl + F5 即可，无需重启 IIS、无需重启 Node 服务。
 *
 * 字段说明：
 *   apiBase  治理服务地址，二选一：
 *              'http://192.168.20.31:3100'  指定完整地址（PLM 与服务不在同一台机器时的常规写法）
 *              'auto'                       同机部署：自动用「当前访问 PLM 的主机名」+ apiPort
 *   apiPort  仅当 apiBase = 'auto' 时生效，默认 3100
 *
 * 注意：apiBase 必须是【浏览器】能访问到的地址。
 *       写 127.0.0.1 只会指向用户自己的电脑，跨机访问必然失败。
 */
window.ItemSmartInputConfig = {
  apiBase: 'http://192.168.20.31:3100',
  apiPort: 3100
};
