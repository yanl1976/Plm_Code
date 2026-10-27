# PLM Callable Services (DataService)

> Auto-generated. Source: all `*Service.dll` / `*WebService.dll` under `Server\`.
> Call pattern: `HoteamUI.DataService.Call("<Namespace>.<Class>.<Method>", { para: ... })`

## Hoteam.InforCenter.Base.WebService.dll

### [class] Hoteam.InforCenter.Base.WebService.PlmApiService
- `String GetAuthCode(String UserCode, String Password)`

### [class] Hoteam.InforCenter.Base.WebService.PLMWebService
- `List`1 ExportFileFromPageGrid(ExportFilePara para)`
- `List`1 GetMenuItemByName(GetMenuItemByName para)`
- `String GetWebSiteSetting()`
- `Boolean GeneratorPageByWebModel(MsePageCreate para)`

### [class] Hoteam.InforCenter.Base.WebService.Tool.ApiLogHelper
- `Void WriteLog(String ApiId, String ApiIP, String ApiName, String Gettext, String ResultText)`

### [class] Hoteam.InforCenter.Base.WebService.Tool.LoginCheckPara
- (no public methods)

### [class] Hoteam.InforCenter.Base.WebService.Tool.ApiResultData
- (no public methods)

### [enum] Hoteam.InforCenter.Base.WebService.Tool.ApiCodeEnum
- values: Success, SomeSucess, Workerror, Permissionerror, Permissinoelogerror, Calldataerror, Logicerror

### [class] Hoteam.InforCenter.Base.WebService.Tool.PLMCallDataBasePara
- (no public methods)

### [class] Hoteam.InforCenter.Base.WebService.Tool.ApiBaseObject
- (no public methods)

### [class] Hoteam.InforCenter.Base.WebService.Tool.ApiLinkObject
- (no public methods)

### [class] Hoteam.InforCenter.Base.WebService.Tool.Field
- (no public methods)

### [class] Hoteam.InforCenter.Base.WebService.Tool.PublicApiTools
- `T PLMCallDataService(String serviceUri, Dictionary`2 para, Boolean checkAuth, String connect)`
- `String MergePara(String frompara, String topara)`
- `String Encrypt(String stringToEncrypt, String shortKey)`
- `String Decrypt(String stringToDecrypt, String sKey)`

### [class] Hoteam.InforCenter.Base.WebService.Tool.ApiDemo
- `ApiResultData APIGetXXXXData1(PLMCallDataBasePara callDataBasePara)`

## Hoteam.InforCenter.CReportEdit.WebService.dll

### [class] Hoteam.InforCenter.CReportEdit.WebService.CReportEditWebService
- `ReturnReportInformation GetReport(GetReportInformation callDataBasePara)`

### [class] Hoteam.InforCenter.CReportEdit.WebService.Parameter.ReturnReportInformation
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.WebService.Parameter.GetReportInformation
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.WebService.Parameter.ReportObj
- (no public methods)

## Hoteam.InforCenter.DocModel.WebService.dll

### [class] Hoteam.InforCenter.DocModel.Interface.DatasetInformationConst
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.Interface.DatasetParaTypeConst
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.DatasetWebService
- `DatasetInformation GetDatasetInformation(DatasetInformationApiPara para)`

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.DatasetInformationApiPara
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.DatasetInformation
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.DatasetInfo
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.Attachment
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.RelationDoc
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.AssociatedDoc
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.DerivativeDoc
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.WebService.Parameter.AssociatedPseItem
- (no public methods)

## Hoteam.InforCenter.MSE.WebService.dll

### [class] Hoteam.InforCenter.MSE.WebService.MSEWebService
- `RetGetProcessByItemCode GetProcessesByItemCodes(GetProcessByItemCodePara inPara)`
- `RetGetProcessStruct GetProcessStruct(GetProcessStructPara inPara)`
- `RetGetProcessRelation GetProcessRelation(GetProcessRelationPara inPara)`

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.GetProcessByItemCodePara
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.RetGetProcessByItemCode
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.ProcessWithItemCode
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.GetProcessStructPara
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.RetGetProcessStruct
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.ProcessWithRela
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.GetProcessRelationPara
- (no public methods)

### [class] Hoteam.InforCenter.MSE.WebService.Parameter.RetGetProcessRelation
- (no public methods)

## Hoteam.InforCenter.MyProject.WebService.dll

### [class] Hoteam.InforCenter.Project.WebService.ProjectWebService
- `List`1 GetMenuItemByName(String menuName)`
- `String GetResourceLoadData(ResourceLoadPara para)`
- `List`1 GetResourceList(ResourceLoadPara para)`
- `List`1 GetSubDataModelList(SubDataModelPara para)`
- `List`1 GetTaskTypeList(SubDataModelPara para)`
- `GridTitleData GetResourceLoadGridTitleForExe(ResourceLoadGridTitleForExe para)`
- `GridObject GetResourceLoadGridDataForExe(OnePageGridDataParaForExe para)`
- `String GetResourceLoadTaskSum(ResLoadTaskSum para)`
- `String GetObjectData(GetObjectDataPara para)`

### [class] Hoteam.InforCenter.Project.WebService.WebServiceHelper
- `T CallPDMService(String fullName, Object args)`
- `T CallPDMService(SessionPara userpara, String fullName, Object args)`

### [class] Hoteam.InforCenter.ServiceManage.Business.MyServiceClientManager
- `String CallDataService(DataPara para, String content, String url)`
- `Void AsyncCallDataService(DataPara para, String content, String url)`
- `String CallDataService(DataPara para, String content, String url, Boolean isAsync)`
- `String CallWCFService(DataPara para, String content, String url, Boolean isAsync)`

### [class] Hoteam.InforCenter.ServiceManage.Business.MyServiceManager
- `T CallWebService(String servicepath, String method, String paras)`
- `T CallDataService(String serviceuri, String paras)`
- `String GetHttpUrl(String path)`
- `String GetDefaultHttpUrl()`
- `String MergePara(String frompara, String topara)`
- `Void SetLangage(String lang)`
- `Void SetServerAddress(String callServiceAddress, Int32 callServicePort)`
- `Void SetDataBaseConnect(String connect)`
- `Void SetLoginDeviceType(String deviceType)`
- `Void SetLoginUser(SessionPara para)`
- `Void SetUserInfo(SessionPara para)`
- `Boolean TryLogin(TryLoginUserPara userPara)`
- `Void LogOut()`
- `Boolean CheckUserIsOnline()`

### [class] Hoteam.InforCenter.MyProject.WebService.CoreParaX
- (no public methods)

### [class] Hoteam.InforCenter.MyProject.WebService.CoreParaXLoadGridTitleForExe
- (no public methods)

### [class] Hoteam.InforCenter.MyProject.WebService.CoreParaXSubDataModelPara
- (no public methods)

### [class] Hoteam.InforCenter.MyProject.WebService.CoreParaXOnePageGridDataParaForExe
- (no public methods)

## Hoteam.InforCenter.NavIntegration.WebService.dll

### [class] Hoteam.InforCenter.NavIntegration.WebService.NavIntegrations
- `Void Init()`
- `NavIntegration Get(String name)`
- `NavIntegration GetNavigationItemByName(String Name)`
- `List`1 GetRootNavigationItem()`

### [class] Hoteam.InforCenter.NavIntegration.WebService.NavIntegrationFiles
- (no public methods)

### [class] Hoteam.InforCenter.NavIntegration.WebService.NavIntegration
- `String GetHeader(String lanuage)`
- `String GetCaption(String lanuage)`
- `String GetText(String lanuage)`
- `Void InitData()`

### [class] Hoteam.InforCenter.NavIntegration.WebService.PagePara
- (no public methods)

### [class] Hoteam.InforCenter.NavIntegration.WebService.NavIntegrationAccordionObject
- (no public methods)

### [class] Hoteam.InforCenter.NavIntegration.WebService.NavIntegrationWebService
- `List`1 GetIntegrationNavInfo(SessionPara para)`
- `String GetLocalSoftwarePara(SessionPara para)`
- `String RedirectMethod(SessionPara para)`

## Hoteam.InforCenter.ProcessRoute.WebService.dll

### [class] Hoteam.InforCenter.ProcessRoute.WebService.ProcessRouteWebService
- `ReturnPRouteInformation GetProcessRoute(GetPRouteInformation callDataBasePara)`

### [class] Hoteam.InforCenter.ProcessRoute.WebService.Parameter.ReturnPRouteInformation
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.WebService.Parameter.GetPRouteInformation
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.WebService.Parameter.ItemRouteObj
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.WebService.Parameter.BomRoutesObj
- (no public methods)

## Hoteam.InforCenter.PseBom.WebService.dll

### [class] Hoteam.InforCenter.PseBom.WebService.BomWebService
- `ReturnBomInformation BomInformation(GetBomInformation callDataBasePara)`

### [class] Hoteam.InforCenter.PseBom.WebService.Parameter.ReturnBomInformation
- (no public methods)

### [class] Hoteam.InforCenter.PseBom.WebService.Parameter.GetBomInformation
- (no public methods)

### [class] Hoteam.InforCenter.PseBom.WebService.Parameter.BomLineRelation
- (no public methods)

## Hoteam.InforCenter.PSEItem.WebService.dll

### [class] Hoteam.InforCenter.PSEItem.WebService.ItemWebService
- `ReturnItemInformation ItemInformation(GetItemInformation callDataBasePara)`

### [class] Hoteam.InforCenter.PSEItem.WebService.Parameter.GetItemInformation
- (no public methods)

### [class] Hoteam.InforCenter.PSEItem.WebService.Parameter.ReturnItemInformation
- (no public methods)

### [class] Hoteam.InforCenter.PSEItem.WebService.Parameter.ItemInformation
- (no public methods)

### [class] Hoteam.InforCenter.PSEItem.WebService.Parameter.ApiDocInfo
- (no public methods)

## Hoteam.InforCenter.Registered.WebService.dll

### [class] Hoteam.InforCenter.Registered.WebService.GenGifCode
- `Byte[] GetCodeImage(String& randomcode)`

### [class] Hoteam.InforCenter.Registered.WebService.Organization.Parameter.PasswordPara
- (no public methods)

### [class] Hoteam.InforCenter.Registered.WebService.Organization.Business.MailSetting
- (no public methods)

### [class] Hoteam.InforCenter.Registered.WebService.Organization.Business.PersonalSetting
- (no public methods)

### [class] Hoteam.InforCenter.Registered.WebService.Organization.Business.RetMainFlat
- (no public methods)

### [class] Hoteam.InforCenter.Registered.WebService.RegisteredWebService+RegisterMailInfo
- (no public methods)

## Hoteam.InforCenter.Report.WebService.dll

### [class] Hoteam.InforCenter.Report.WebServices.ReportService
- `List`1 GetReportPath(String paraString)`
- `String GetReportBase64(String name)`

## Hoteam.InforCenter.ThreeRoleAuthPlatform.WebService.dll

### [class] Hoteam.InforCenter.ThreeRoleAuthPlatform.WebService.ThreeRoleAuthPlatformWebService
- `TryLoginUserPara TryLogin(TryLoginUserPara para)`
- `String GetUserClientIP()`

## Hoteam.InforCenter.WebSocket.Service.dll

### [class] Hoteam.InforCenter.WebSocket.Service.WebSocketHelper
- `Void add_OnOpen(OnOpenEvent value)`
- `Void remove_OnOpen(OnOpenEvent value)`
- `Void add_OnClose(OnCloseEvent value)`
- `Void remove_OnClose(OnCloseEvent value)`
- `Void add_OnMessage(OnMessageEvent value)`
- `Void remove_OnMessage(OnMessageEvent value)`
- ` StartServer(<unresolved>)`

### [class] Hoteam.InforCenter.WebSocket.Service.WSInit
- `Void Init()`

### [class] Hoteam.InforCenter.WebSocket.Service.WSNativeInit
- `Void Init()`
- ` InitWebSocketServer(<unresolved>)`
- ` InitWebSocketServerSSL(<unresolved>)`

### [class] Hoteam.InforCenter.WebSocket.Service.CustomWebSocketSession
- `Void Send(String message)`

### [class] Hoteam.InforCenter.WebSocket.Service.WebSocketHelper+OnOpenEvent
- `Void Invoke(WebSocketSession socketSession)`
- `IAsyncResult BeginInvoke(WebSocketSession socketSession, AsyncCallback callback, Object object)`
- `Void EndInvoke(IAsyncResult result)`

### [class] Hoteam.InforCenter.WebSocket.Service.WebSocketHelper+OnCloseEvent
- `Void Invoke(WebSocketSession session, CloseReason value)`
- `IAsyncResult BeginInvoke(WebSocketSession session, CloseReason value, AsyncCallback callback, Object object)`
- `Void EndInvoke(IAsyncResult result)`

### [class] Hoteam.InforCenter.WebSocket.Service.WebSocketHelper+OnMessageEvent
- `Void Invoke(CustomWebSocketSession socketSession, String message)`
- `IAsyncResult BeginInvoke(CustomWebSocketSession socketSession, String message, AsyncCallback callback, Object object)`
- `Void EndInvoke(IAsyncResult result)`

## Hoteam.InforCenter.CommandService.Service.dll

### [class] Hoteam.InforCenter.CommandService.Service.CommandServiceManagementService
- `TreeRootData GetConversionStatisticsRoot(TreeViewPara para)`
- `List`1 GetConversionStatisticsAllData(TreeViewPara para)`
- `GridObject GetConversionInfoGridData(OnePageGridDataPara para)`
- `GridTitleData GetConversionInfoGridTitle(GridRowTitlePara para)`
- `Boolean ReConversion(ReConversionPara para)`
- `GridTitleData GetCommandServiceServiceLogListTitle(GridRowTitlePara para)`
- `GridObject GetCommandServiceServiceLogListData(OnePageGridDataPara para)`
- `TreeRootData GetConversionCountInfoRoot(TreeViewPara para)`
- `Boolean DeleteCommandInfo(DeleteCommandInfoPara para)`
- `Boolean DeleteCommandByCondition(SessionPara para)`
- `String GetCommandMessageByCommandID(SessionPara para)`
- `List`1 GetConversionStatusListByWorkflowID(GetConversionStatusListByWorkflowIDPara para)`
- `Boolean GeneratorWaterMarkImageID(SessionPara para)`
- `Boolean ToReserveConversion(ToReservePara para)`
- `Boolean Requeue(RequeuePara para)`
- `String GetBaseConfig(SessionPara para)`
- `String GetAssignServerInfo(SessionPara para)`
- `Dictionary`2 GetConversionAddressList(SessionPara para)`
- `GridObject GetCommandGridForCreateCommand(SessionPara para)`
- `Boolean SaveEndpointCommand(CreateCommandPara para)`
- `List`1 GetSelectedCommandForCreateCommand(CreateCommandPara para)`
- `Boolean TestMongoDBConnect(TestMongoDBPara para)`
- `Boolean SaveCommandBaseConfig(CommandBaseConfigPara para)`
- `Boolean CheckCommandIsReference(CheckCommandIsReferencePara para)`
- `Boolean CheckEndPointGroupIsReference(CheckEndPointGroupIsReferencePara para)`
- `Boolean SaveAssignServerConfig(SaveAssignServerConfigPara para)`
- `Boolean SyncConfig(SessionPara para)`
- `Boolean SyncWaterMark(SessionPara para)`
- `GridObject GetConversionConnectedStatusGrid(SessionPara para)`
- `CommandServiceStatusPageInfo GetCommandServiceStatusInfo(SessionPara para)`
- `String StartAssignServer(SessionPara para)`
- `String StopAssignServer(SessionPara para)`
- `String StopConversionEndPoint(ConversionEndPoinSuspendAndResetPara para)`
- `String StartConversionEndPoint(ConversionEndPoinSuspendAndResetPara para)`
- `Boolean SetConfigFileNoSync(SessionPara para)`
- `String AllServiceStop(SessionPara para)`
- `String AllServiceStart(SessionPara para)`
- `TreeRootData GetArchivedCommandTreeData(TreeViewPara para)`
- `GridTitleData GetArchivedCommandGridTitle(GridRowTitlePara para)`
- `GridObject GetArchivedCommandGridData(OnePageGridDataPara para)`
- `Boolean ArchivedDeleteCommandInfo(ArchivedDeleteCommandInfoPara para)`
- `GridTitleData GetMyCommandServiceListGridTitle(GridRowTitlePara para)`
- `GridObject GetMyCommandServiceListGridData(OnePageGridDataPara para)`
- `Dictionary`2 GetConversionFilterGroupValue(SessionPara para)`

### [interface] Hoteam.InforCenter.CommandService.Service.ICommandServiceManagementService
- `TreeRootData GetConversionStatisticsRoot(TreeViewPara para)`
- `GridObject GetConversionInfoGridData(OnePageGridDataPara para)`
- `GridTitleData GetConversionInfoGridTitle(GridRowTitlePara para)`
- `Boolean ReConversion(ReConversionPara para)`
- `GridTitleData GetCommandServiceServiceLogListTitle(GridRowTitlePara para)`
- `GridObject GetCommandServiceServiceLogListData(OnePageGridDataPara para)`
- `TreeRootData GetConversionCountInfoRoot(TreeViewPara para)`
- `Boolean DeleteCommandInfo(DeleteCommandInfoPara para)`
- `Boolean DeleteCommandByCondition(SessionPara para)`
- `String GetCommandMessageByCommandID(SessionPara para)`
- `List`1 GetConversionStatusListByWorkflowID(GetConversionStatusListByWorkflowIDPara para)`
- `Boolean GeneratorWaterMarkImageID(SessionPara para)`
- `Boolean ToReserveConversion(ToReservePara para)`
- `Boolean Requeue(RequeuePara para)`
- `String GetBaseConfig(SessionPara para)`
- `String GetAssignServerInfo(SessionPara para)`
- `Dictionary`2 GetConversionAddressList(SessionPara para)`
- `GridObject GetCommandGridForCreateCommand(SessionPara para)`
- `Boolean SaveEndpointCommand(CreateCommandPara para)`
- `List`1 GetSelectedCommandForCreateCommand(CreateCommandPara para)`
- `Boolean TestMongoDBConnect(TestMongoDBPara para)`
- `Boolean SaveCommandBaseConfig(CommandBaseConfigPara para)`
- `Boolean CheckCommandIsReference(CheckCommandIsReferencePara para)`
- `Boolean SaveAssignServerConfig(SaveAssignServerConfigPara para)`
- `Boolean SyncConfig(SessionPara para)`
- `GridObject GetConversionConnectedStatusGrid(SessionPara para)`
- `CommandServiceStatusPageInfo GetCommandServiceStatusInfo(SessionPara para)`
- `String StartAssignServer(SessionPara para)`
- `String StopAssignServer(SessionPara para)`
- `String StopConversionEndPoint(ConversionEndPoinSuspendAndResetPara para)`
- `String StartConversionEndPoint(ConversionEndPoinSuspendAndResetPara para)`
- `Boolean SetConfigFileNoSync(SessionPara para)`
- `String AllServiceStop(SessionPara para)`
- `String AllServiceStart(SessionPara para)`
- `Boolean SyncWaterMark(SessionPara para)`
- `TreeRootData GetArchivedCommandTreeData(TreeViewPara para)`
- `GridTitleData GetArchivedCommandGridTitle(GridRowTitlePara para)`
- `GridObject GetArchivedCommandGridData(OnePageGridDataPara para)`
- `GridTitleData GetMyCommandServiceListGridTitle(GridRowTitlePara para)`
- `GridObject GetMyCommandServiceListGridData(OnePageGridDataPara para)`
- `Boolean CheckEndPointGroupIsReference(CheckEndPointGroupIsReferencePara para)`
- `Dictionary`2 GetConversionFilterGroupValue(SessionPara para)`
- `List`1 GetConversionStatisticsAllData(TreeViewPara para)`
- `Boolean ArchivedDeleteCommandInfo(ArchivedDeleteCommandInfoPara para)`

### [class] Hoteam.InforCenter.CommandService.Service.RequeuePara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.ToReservePara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.ArchivedDeleteCommandInfoPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.CheckCommandIsReferencePara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.CheckEndPointGroupIsReferencePara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.CommandBaseConfigPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.CommandServiceStatusPageInfo
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.ConversionEndPoinSuspendAndResetPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.CreateCommandPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.DeleteCommandInfoPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.GetConversionStatusListByWorkflowIDPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.ReConversionPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.SaveAssignServerConfigPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.Paras.TestMongoDBPara
- (no public methods)

### [class] Hoteam.InforCenter.CommandService.Service.CommandServiceManagementService+QueryData
- (no public methods)

## Hoteam.InforCenter.Example.Service.dll

### [class] Hoteam.InforCenter.Example.Service.ExampleService
- `Void SaveEditData(EditGridObject para)`
- `GridObject GetMulityData(GridPagerPara para)`
- `List`1 GetAccordionList(SessionPara para)`
- `GridRowTitleObject GetGridRowTitle(SessionPara para)`
- `GridObject GetGridData(GridPagerPara para)`
- `EditGridRowTitleObject GetEditGridRowTitle(SessionPara para)`
- `EditGridObject GetEditGridData(SessionPara para)`
- `EditTreeGridRowTitleData GetAllEditGridRowTitle(SessionPara para)`
- `EditTreeGridObject GetAllEditGridRowData(SessionPara para)`
- `EditTreeGridRowTitleObject GetEditTreeGridRowTitle(SessionPara para)`
- `EditTreeGridObject GetEditTreeGridData(SessionPara para)`
- `EditTreeGridObject GriEditTreeGridChildrenData(SessionPara para)`
- `EditTreeGridObject GetAsyncEditTreeRootData(SessionPara para)`
- `EditTreeGridObject GetAsyncEditTreeData(SessionPara para)`
- `List`1 GetTreeRootData(TreePara para)`
- `TreeNodeObject UpdateNode(TreePara para)`
- `List`1 UpdateChildrenNodes(TreePara para)`
- `List`1 ReplaceChildrenNodes(TreePara para)`
- `TreeNodeObject AddNode(TreePara para)`
- `TreeChildData GetTreeChildData(TreePara para)`
- `List`1 GetDropDownItemEnable(SessionPara para)`
- `List`1 GetDropDownItemDisable(SessionPara para)`
- `List`1 GetMenuItemFromDataService(SessionPara para)`
- `String GetCodeStandardization(SessionPara para)`
- `Void GetException(ExceptionPara para)`
- `List`1 GetDownloadFileInfo(ItemPara para)`
- `String ImportExcel(ImportExcelPara para)`
- `String ImportProject(ImportExcelPara para)`
- `ProjectDataModel ExportProject(SessionPara para)`
- `ExcelExportTemplateDataModel ExportExcelItemBom(ExportExcelTemplatePara para)`
- `WordExportTemplateDataModel ExportWordItemBom(ExportWordTemplatePara para)`
- `RetunListData GetMobileWorkSpaceRootData(GetListDataPara para)`
- `RetunListData GetMobileWorkSpaceSubData(GetListDataPara para)`
- `RetunListData GetMobileWorkSpaceStructData(GetListDataPara para)`
- `RetunListData GetMobilePartStructData(GetListDataPara para)`
- `EditGridRowTitleData GetEditMulityTitle(SessionPara para)`
- `EditGridObject GetEditMulityData(SessionPara para)`
- `GridObject GetChartData(SessionPara para)`
- `String PatchSaveObject(PatchSaveObjectPara para)`
- `String GetGanttXml(SessionPara para)`
- `String ForeignKeyQueryData(SessionPara para)`
- `String TestCreateInstance(TestCreateInstancePara para)`
- `Dictionary`2 TestGetBrowserInfo(TestGetBrowserInfoPara para)`

### [class] Hoteam.InforCenter.Example.Service.GetListDataPara
- (no public methods)

### [interface] Hoteam.InforCenter.Example.Service.IExampleService
- `GridObject GetMulityData(GridPagerPara para)`
- `List`1 GetAccordionList(SessionPara para)`
- `GridRowTitleObject GetGridRowTitle(SessionPara para)`
- `GridObject GetGridData(GridPagerPara para)`
- `EditGridRowTitleObject GetEditGridRowTitle(SessionPara para)`
- `EditGridObject GetEditGridData(SessionPara para)`
- `EditTreeGridRowTitleData GetAllEditGridRowTitle(SessionPara para)`
- `EditTreeGridObject GetAllEditGridRowData(SessionPara para)`
- `EditTreeGridObject GetAsyncEditTreeRootData(SessionPara para)`
- `EditTreeGridObject GetAsyncEditTreeData(SessionPara para)`
- `EditTreeGridRowTitleObject GetEditTreeGridRowTitle(SessionPara para)`
- `EditTreeGridObject GetEditTreeGridData(SessionPara para)`
- `EditTreeGridObject GriEditTreeGridChildrenData(SessionPara para)`
- `List`1 GetTreeRootData(TreePara para)`
- `TreeChildData GetTreeChildData(TreePara para)`
- `TreeNodeObject UpdateNode(TreePara para)`
- `List`1 UpdateChildrenNodes(TreePara para)`
- `List`1 ReplaceChildrenNodes(TreePara para)`
- `TreeNodeObject AddNode(TreePara para)`
- `List`1 GetDropDownItemEnable(SessionPara para)`
- `List`1 GetDropDownItemDisable(SessionPara para)`
- `List`1 GetMenuItemFromDataService(SessionPara para)`
- `String GetCodeStandardization(SessionPara para)`
- `Void GetException(ExceptionPara para)`
- `List`1 GetDownloadFileInfo(ItemPara para)`
- `RetunListData GetMobileWorkSpaceRootData(GetListDataPara para)`
- `RetunListData GetMobileWorkSpaceSubData(GetListDataPara para)`
- `RetunListData GetMobileWorkSpaceStructData(GetListDataPara para)`
- `RetunListData GetMobilePartStructData(GetListDataPara para)`
- `String ImportExcel(ImportExcelPara para)`
- `ExcelExportTemplateDataModel ExportExcelItemBom(ExportExcelTemplatePara para)`
- `WordExportTemplateDataModel ExportWordItemBom(ExportWordTemplatePara para)`
- `String ImportProject(ImportExcelPara para)`
- `ProjectDataModel ExportProject(SessionPara para)`
- `EditGridRowTitleData GetEditMulityTitle(SessionPara para)`
- `EditGridObject GetEditMulityData(SessionPara para)`
- `GridObject GetChartData(SessionPara para)`
- `String PatchSaveObject(PatchSaveObjectPara para)`
- `String GetGanttXml(SessionPara para)`
- `String ForeignKeyQueryData(SessionPara para)`
- `String TestCreateInstance(TestCreateInstancePara para)`
- `Dictionary`2 TestGetBrowserInfo(TestGetBrowserInfoPara para)`

### [class] Hoteam.InforCenter.Example.Service.RetunListData
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ListItemData
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.Paras.PatchSaveObjectPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.Paras.TestCreateInstancePara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.Paras.TestGetBrowserInfoPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExportTemplate.Parameter.ExportExcelTemplatePara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExportTemplate.Parameter.ExportWordTemplatePara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExportTemplate.Business.ExportExcelTemplateItemBom
- `ExcelExportTemplateDataModel ExportItemBom(ExportExcelTemplatePara para)`

### [class] Hoteam.InforCenter.Example.Service.ExportTemplate.Business.ExportWordTemplateItemBom
- `WordExportTemplateDataModel ExportItemBom(ExportWordTemplatePara para)`

### [class] Hoteam.InforCenter.Example.Service.ExportTemplate.Business.GanttXml
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+GridPagerPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+TreePara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+PlatformException
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+ExceptionPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+ItemPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+ImportExcelPara
- (no public methods)

### [class] Hoteam.InforCenter.Example.Service.ExampleService+ImportProjectPara
- (no public methods)

## Hoteam.InforCenter.Training.Service.dll

### [interface] Hoteam.InforCenter.Training.Service.ITrainingService
- `GridObject GetTrainingGridData(OnePageGridDataPara para)`
- `GridTitleData GetTrainingGridTitleData(GridRowTitlePara para)`
- `Boolean SetTrainingState(TrainingPara para)`

### [class] Hoteam.InforCenter.Training.Service.TrainingService
- `GridObject GetTrainingGridData(OnePageGridDataPara para)`
- `GridTitleData GetTrainingGridTitleData(GridRowTitlePara para)`
- `Boolean SetTrainingState(TrainingPara para)`

## Hoteam.InforCenter.FSManagement.Service.dll

### [class] Hoteam.InforCenter.FSManagement.Service.FSManagementService
- `GridTitleData GetFSManagementGridRowTitle(GridRowTitlePara para)`
- `GridObject GetFSManagementOnePageGridData(OnePageGridDataPara para)`
- `List`1 GetFSManagementTreeAllNode(TreeViewPara para)`
- `GridObject GetFRootOnePageGridData(OnePageGridDataPara para)`
- `GridTitleData GetFSRootGridRowTitle(GridRowTitlePara para)`

### [interface] Hoteam.InforCenter.FSManagement.Service.IFSManagementService
- `List`1 GetFSManagementTreeAllNode(TreeViewPara para)`
- `GridObject GetFSManagementOnePageGridData(OnePageGridDataPara para)`
- `GridTitleData GetFSManagementGridRowTitle(GridRowTitlePara para)`
- `GridTitleData GetFSRootGridRowTitle(GridRowTitlePara para)`
- `GridObject GetFRootOnePageGridData(OnePageGridDataPara para)`

## InforCenter.Platform.IMCIntegration.Service.dll

### [interface] InforCenter.Platform.IMCIntegration.Service.IIMCIntegrationService
- `CallRetData CreateTenant(SessionPara para)`
- `CallRetData UpateTenant(SessionPara para)`
- `CallRetData DeleteTenant(SessionPara para)`
- `CallRetData CreateOrgnization(SessionPara para)`
- `CallRetData UpdateOrgnization(SessionPara para)`
- `CallRetData DeleteOrgnization(SessionPara para)`
- `CallRetData CreateUser(SessionPara para)`
- `CallRetData UpdateUser(SessionPara para)`
- `CallRetData DeleteUser(SessionPara para)`
- `String GetTenant(SessionPara para)`
- `CallRetData CheckUserInfo(SessionPara para)`

### [class] InforCenter.Platform.IMCIntegration.Service.IMCIntegrationService
- `CallRetData CreateTenant(SessionPara para)`
- `CallRetData UpateTenant(SessionPara para)`
- `CallRetData DeleteTenant(SessionPara para)`
- `CallRetData CreateOrgnization(SessionPara para)`
- `CallRetData UpdateOrgnization(SessionPara para)`
- `CallRetData DeleteOrgnization(SessionPara para)`
- `CallRetData CreateUser(SessionPara para)`
- `CallRetData UpdateUser(SessionPara para)`
- `CallRetData DeleteUser(SessionPara para)`
- `String GetTenant(SessionPara para)`
- `CallRetData CheckUserInfo(SessionPara para)`

### [class] InforCenter.Platform.IMCIntegration.Service.LoginCheckPara
- (no public methods)

### [class] InforCenter.Platform.IMCIntegration.Service.Parameter.CallRetData
- (no public methods)

### [class] InforCenter.Platform.IMCIntegration.Service.Parameter.OrgnizationData
- (no public methods)

### [class] InforCenter.Platform.IMCIntegration.Service.Parameter.TenantData
- (no public methods)

### [class] InforCenter.Platform.IMCIntegration.Service.Parameter.UserData
- (no public methods)

## Hoteam.InforCenter.Base.Service.dll

### [interface] Hoteam.InforCenter.Base.Service.IPLMBaseService
- `GridObject DistinctGridDataByEID(CustomGridDataPara para)`
- `AddLinkMessage PasteMasterID(BasePastePara para)`
- `ReturnObject CreateViceObject(CheckPara para)`
- `ReturnObject CheckOutObject(CheckPara para)`
- `Boolean CheckInObject(CheckPara para)`
- `String CheckOutVerify(CheckPara para)`
- `Boolean CheckObjectIsExist(CheckPara para)`
- `Boolean UnCheckOutObject(CheckPara para)`
- `List`1 GetObjectByFilter(ObjectFilterPara para)`
- `String GetReferenceWithObject(CustomGridDataPara para)`
- `String GetReferencePreNode(CustomGridDataPara para)`
- `Void UpdateObjectColumnValue(UpdateObjectPara para)`
- `GridObject GetMyCheckOutListMainFlat(SessionPara para)`
- `GridObject GetMyMessageListMainFlat(SessionPara para)`
- `GridObject GetMyCheckOutListMainFlat2(SessionPara para)`
- `GridObject GetMyMessageListMainFlat2(SessionPara para)`
- `List`1 GetLifeCircleListforBindingDroupdown(LifeCircleStatePara para)`
- `Boolean CheckObjectSupportInspectorByObjectID(CheckPara para)`
- `Dictionary`2 GetExtendType(UpdateObjectPara para)`
- `Boolean CheckPermission(PermissionPara para)`
- `Boolean CheckPermission2(PermissionPara para)`
- `Void CheckCompanyRule(PermissionPara para)`
- `String GetServerTime(SessionPara para)`
- `String GetDefaultValueByType(ObjectFilterPara para)`
- `String GetItemHistoryPicData(UpdateObjectPara para)`
- `List`1 GetEntityTypeList(SessionPara para)`
- `String GetAttributeInfoByObjectType(ObjectFilterPara para)`
- `Int32 MatchBracket(ObjectFilterPara para)`
- `String GetGuid()`
- `List`1 BatchGetGuid(BatchGetGuidPara para)`
- `String GetObjectByEID(ObjectFilterPara para)`
- `List`1 GetViewConditions(ObjectFilterPara para)`
- `String GetWorkDirectory(SessionPara para)`
- `String SetWorkDirectory(WorkDirectoryPara para)`
- `String GetOperateProgress(OperateProgressPara para)`
- `AddLinkMessage CheckObjectPermission(PermissionPara para)`
- `Boolean UpdateSettingsValueByName(UpdateObjectPara para)`
- `GridTitleAndDataForBatchTransfer GetGridTitleForBatchTransfer(PatchPermissionPara para)`
- `GridTitleAndDataForBatchTransfer GetGridDataForBatchTransfer(PatchPermissionPara para)`
- `GridTitleAndDataForBatchTransfer GetChildObjectData(PatchPermissionPara para)`
- `Boolean CheckEntityTypeExist(CheckPara para)`
- `Dictionary`2 GetCustomAutoComboxDatasource(UpdateObjectPara para)`
- `String GetAppSettingValue(GetAppSettingValue para)`
- `String GetSettingsValueByName(GetSettingsValue para)`
- `Void SendSubcribeMessage(PermissionPara para)`
- `List`1 GetObjsByIDs(ObjectFilterPara para)`
- `List`1 GetViewConditionsByListView(ObjectFilterPara para)`
- `String GetLanguageText(ExeQueryLanguagePara para)`
- `Dictionary`2 GetDatasource(UpdateObjectPara para)`
- `List`1 GetLovDatasourceByName(GetLovDatasourcePara para)`
- `String InitPastePosition(PasteDealPositionPara para)`
- `String GetObjectDataNoAuthentication(GetObjectDataPara para)`
- `Boolean IsDataIsolate(ObjectFilterPara para)`
- `Dictionary`2 GetShareGroupCode(ObjectFilterPara para)`
- `Boolean CheckActionRulePermissionIgnoreDataIsolation(CheckActionPara para)`
- `Boolean CheckCheckInObj(CheckPara para)`
- `AddLinkMessage BatchCheckInObject(CheckPara para)`
- `AddLinkMessage BatchUnCheckOutObject(CheckPara para)`
- `String GetViewColumns(ViewColumnsPara para)`
- `String GetObjectPermissionForIcpviewer(CheckActionPara para)`
- `List`1 GetExtendTypeByModeType(GetExtendTypePara para)`
- `Void MoveObjectDown(PasteDealPositionPara para)`
- `Void MoveObjectUp(PasteDealPositionPara para)`
- `Boolean GetSettingVal(GetSettingsValue para)`
- `String GetModelEditColumns(ModelColumnsPara para)`
- `String GetInitProjectWorkflowTemplateEUID(WorkflowTemplatePara para)`
- `GridObject GetMainFlatCountInfo(SessionPara para)`
- `GridObject NewGetMainFlatCountInfoForPDM(SessionPara para)`
- `LoginCheckPara CheckUserInfo(CheckUserData para)`

### [class] Hoteam.InforCenter.Base.Service.PLMBaseService
- `GridObject DistinctGridDataByEID(CustomGridDataPara para)`
- `AddLinkMessage PasteMasterID(BasePastePara para)`
- `ReturnObject CreateViceObject(CheckPara para)`
- `String CheckOutVerify(CheckPara para)`
- `ReturnObject CheckOutObject(CheckPara para)`
- `Boolean CheckInObject(CheckPara para)`
- `AddLinkMessage BatchCheckInObject(CheckPara para)`
- `Boolean UnCheckOutObject(CheckPara para)`
- `AddLinkMessage BatchUnCheckOutObject(CheckPara para)`
- `List`1 GetObjectByFilter(ObjectFilterPara para)`
- `String GetReferenceWithObject(CustomGridDataPara para)`
- `String GetReferencePreNode(CustomGridDataPara para)`
- `Void UpdateObjectColumnValue(UpdateObjectPara para)`
- `GridObject GetMyCheckOutListMainFlat(SessionPara para)`
- `GridObject GetMyMessageListMainFlat(SessionPara para)`
- `GridObject GetMyCheckOutListMainFlat2(SessionPara para)`
- `GridObject GetMyMessageListMainFlat2(SessionPara para)`
- `List`1 GetLifeCircleListforBindingDroupdown(LifeCircleStatePara para)`
- `Boolean CheckObjectSupportInspectorByObjectID(CheckPara para)`
- `Dictionary`2 GetExtendType(UpdateObjectPara para)`
- `Boolean CheckPermission(PermissionPara para)`
- `Boolean CheckPermission2(PermissionPara para)`
- `Void CheckCompanyRule(PermissionPara para)`
- `String GetServerTime(SessionPara para)`
- `String GetDefaultValueByType(ObjectFilterPara para)`
- `String GetItemHistoryPicData(UpdateObjectPara para)`
- `List`1 GetEntityTypeList(SessionPara para)`
- `String GetAttributeInfoByObjectType(ObjectFilterPara para)`
- `Int32 MatchBracket(ObjectFilterPara para)`
- `String GetGuid()`
- `List`1 BatchGetGuid(BatchGetGuidPara para)`
- `String GetObjectByEID(ObjectFilterPara para)`
- `List`1 GetViewConditions(ObjectFilterPara para)`
- `String GetWorkDirectory(SessionPara para)`
- `String SetWorkDirectory(WorkDirectoryPara para)`
- `AddLinkMessage CheckObjectPermission(PermissionPara para)`
- `String GetOperateProgress(OperateProgressPara para)`
- `Boolean UpdateSettingsValueByName(UpdateObjectPara para)`
- `GridTitleAndDataForBatchTransfer GetGridTitleForBatchTransfer(PatchPermissionPara para)`
- `GridTitleAndDataForBatchTransfer GetGridDataForBatchTransfer(PatchPermissionPara para)`
- `GridTitleAndDataForBatchTransfer GetChildObjectData(PatchPermissionPara para)`
- `Boolean CheckEntityTypeExist(CheckPara para)`
- `Dictionary`2 GetCustomAutoComboxDatasource(UpdateObjectPara para)`
- `String GetAppSettingValue(GetAppSettingValue para)`
- `String GetSettingsValueByName(GetSettingsValue para)`
- `Void SendSubcribeMessage(PermissionPara para)`
- `List`1 GetObjsByIDs(ObjectFilterPara para)`
- `List`1 GetViewConditionsByListView(ObjectFilterPara para)`
- `String GetLanguageText(ExeQueryLanguagePara para)`
- `Dictionary`2 GetDatasource(UpdateObjectPara para)`
- `List`1 GetLovDatasourceByName(GetLovDatasourcePara para)`
- `String InitPastePosition(PasteDealPositionPara para)`
- `String GetObjectDataNoAuthentication(GetObjectDataPara para)`
- `Boolean IsDataIsolate(ObjectFilterPara para)`
- `Dictionary`2 GetShareGroupCode(ObjectFilterPara para)`
- `Boolean CheckActionRulePermissionIgnoreDataIsolation(CheckActionPara para)`
- `Boolean CheckCheckInObj(CheckPara para)`
- `String GetViewColumns(ViewColumnsPara para)`
- `String GetObjectPermissionForIcpviewer(CheckActionPara para)`
- `List`1 GetExtendTypeByModeType(GetExtendTypePara para)`
- `Void MoveObjectDown(PasteDealPositionPara para)`
- `Void MoveObjectUp(PasteDealPositionPara para)`
- `String GetModelEditColumns(ModelColumnsPara para)`
- `Boolean CheckObjectIsExist(CheckPara para)`
- `Boolean GetSettingVal(GetSettingsValue para)`
- `String GetInitProjectWorkflowTemplateEUID(WorkflowTemplatePara para)`
- `GridObject GetMainFlatCountInfo(SessionPara para)`
- `GridObject NewGetMainFlatCountInfoForPDM(SessionPara para)`
- `LoginCheckPara CheckUserInfo(CheckUserData para)`

### [class] Hoteam.InforCenter.Base.Service.ExeLanguageInfo
- (no public methods)

## Hoteam.InforCenter.IntergrationCommunication.Service.dll

### [class] Hoteam.InforCenter.IntergrationCommunication.Service.EAICommunicationService
- `EditGridObject GetSendSettingsGrid(PSEItemEditPara para)`
- `EditGridObject GetCommuncationSettingsSystemSetting(PSEItemEditPara para)`
- `Boolean GetUnSendInforMailSetting(PSEItemEditPara para)`

### [interface] Hoteam.InforCenter.IntergrationCommunication.Service.IEAICommunicationService
- `EditGridObject GetSendSettingsGrid(PSEItemEditPara para)`
- `EditGridObject GetCommuncationSettingsSystemSetting(PSEItemEditPara para)`
- `Boolean GetUnSendInforMailSetting(PSEItemEditPara para)`

## Hoteam.InforCenter.Capp.Service.dll

### [class] Hoteam.InforCenter.Capp.Service.CappItemService
- `String CheckCreateCappItem(CappItemEditPara para)`
- `List`1 GetBomTreeData(BomQueryTreePara para)`
- `List`1 GetBomTreeGridData(BomQueryTreePara para)`
- `EditTreeGridRowTitleData GetBomTreeGridTitleData(SessionPara para)`
- `AddLinkMessage BatchCreateCappItem(CappItemEditPara para)`
- `CompareResult GetUpdateBomData(CappItemEditPara para)`
- `TreeRootData GetBomTreeRoot(TreeViewPara para)`
- `List`1 GetBomTreeAllNodes(TreeViewPara para)`
- `Void UpdateBom(CappItemEditPara para)`
- `String UpdateBomAndCheck(CappItemEditPara para)`
- `List`1 GetBomTreeChildNodes(TreeViewPara para)`
- `List`1 GetGMBomTreeChildNodes(TreeViewPara para)`

### [interface] Hoteam.InforCenter.Capp.Service.ICappItemService
- `String CheckCreateCappItem(CappItemEditPara para)`
- `List`1 GetBomTreeData(BomQueryTreePara para)`
- `AddLinkMessage BatchCreateCappItem(CappItemEditPara para)`
- `CompareResult GetUpdateBomData(CappItemEditPara para)`
- `TreeRootData GetBomTreeRoot(TreeViewPara para)`
- `List`1 GetBomTreeAllNodes(TreeViewPara para)`
- `List`1 GetBomTreeChildNodes(TreeViewPara para)`
- `Void UpdateBom(CappItemEditPara para)`
- `String UpdateBomAndCheck(CappItemEditPara para)`
- `List`1 GetBomTreeGridData(BomQueryTreePara para)`
- `EditTreeGridRowTitleData GetBomTreeGridTitleData(SessionPara para)`
- `List`1 GetGMBomTreeChildNodes(TreeViewPara para)`

## Hoteam.InforCenter.Tooling.Service.dll

### [class] Hoteam.InforCenter.Tooling.Service.ApplyRelationService
- `Void CheckTask(ApplyRelationPara para)`
- `GridObject GetData(OnePageGridDataPara para)`
- `Void SaveRelation(ApplyRelationPara para)`

### [interface] Hoteam.InforCenter.Tooling.Service.IApplyRelationService
- `Void SaveRelation(ApplyRelationPara para)`
- `Void CheckTask(ApplyRelationPara para)`
- `GridObject GetData(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.Tooling.Service.ITempToolingService
- `String CreateNewTempTooling(TempToolingSavePara para)`
- `String DeleteTempTooling(TempToolingDeletePara para)`
- `String DeleteTempToolingInApply(TempToolingDeletePara para)`

### [interface] Hoteam.InforCenter.Tooling.Service.IToolingService
- `String SaveApplyObject(ToolingApplyInfoPara para)`
- `GridObject DealWithToolingListData(OnePageGridDataPara para)`
- `String CanConfigCheck(CanConfigCheckPara para)`
- `List`1 GetItemAttsTreeRootNode(TreePara para)`
- `List`1 GetResourceAttTreeRootNode(TreePara para)`
- `GridObject GetConfigListData(GridPagerPara para)`
- `String SaveResourceToolingConfig(ResourceToolingConfigPara para)`
- `String DeleteResourceToolingConfig(ResourceToolingConfigPara para)`
- `List`1 GetResourceClassTreeRootNode(TreePara para)`
- `String ResourceClassCheck(ToolingEnterResourcePara para)`
- `String ToolingEnterResource(ToolingEnterResourcePara para)`
- `GridObject GetImpactAnalysisGridData(ImpactAnalysisPara para)`
- `GridRowTitleObject GetImpactAnalysisGridRowTitle(ImpactAnalysisPara para)`

### [class] Hoteam.InforCenter.Tooling.Service.TempToolingService
- `String CreateNewTempTooling(TempToolingSavePara para)`
- `String DeleteTempTooling(TempToolingDeletePara para)`
- `String DeleteTempToolingInApply(TempToolingDeletePara para)`

### [class] Hoteam.InforCenter.Tooling.Service.ToolingService
- `String CanConfigCheck(CanConfigCheckPara para)`
- `GridObject DealWithToolingListData(OnePageGridDataPara para)`
- `List`1 GetItemAttsTreeRootNode(TreePara para)`
- `List`1 GetResourceAttTreeRootNode(TreePara para)`
- `String SaveApplyObject(ToolingApplyInfoPara para)`
- `GridObject GetConfigListData(GridPagerPara para)`
- `String SaveResourceToolingConfig(ResourceToolingConfigPara para)`
- `String DeleteResourceToolingConfig(ResourceToolingConfigPara para)`
- `List`1 GetResourceClassTreeRootNode(TreePara para)`
- `String ResourceClassCheck(ToolingEnterResourcePara para)`
- `String ToolingEnterResource(ToolingEnterResourcePara para)`
- `GridObject GetImpactAnalysisGridData(ImpactAnalysisPara para)`
- `GridRowTitleObject GetImpactAnalysisGridRowTitle(ImpactAnalysisPara para)`

## Hoteam.InforCenter.CReportEdit.Service.dll

### [interface] Hoteam.InforCenter.CReportEdit.Service.IReportEditService
- `String GetDatabase(SessionPara para)`
- `List`1 GetAllTemplate(CReportEditTemplate para)`
- `List`1 GetAllTemplateType(CReportEditTemplate para)`
- `String GetTemplate(CReportEditTemplatePara para)`
- `List`1 GetDBLabelByTemplate(CReportEditTemplatePara para)`
- `GridObject GetReportLinkResourceData(OnePageGridDataPara para)`
- `EditGridObject GetReportLinkResource(EditGridDataPara para)`
- `String CheckReportLinkResourceExist(CReportLinkResourcePara para)`
- `String AddReportLinkResource(CReportLinkResourcePara para)`
- `String DeleteReportLinkResource(CReportLinkResourcePara para)`
- `String GetResourceByDBLabel(CReportLinkResourcePara para)`
- `String CreateReportObject(CReportObjectPara para)`
- `String EmendReportObject(CReportObjectPara para)`
- `String GetReportObject(CReportObjectPara para)`
- `AddLinkMessage AddItemToCReport(ItemToCReportRelationPara para)`
- `String GetHistoryPicData(CReportObjectPara para)`
- `String GetViceItem(CReportObjectPara para)`
- `AddLinkMessage AddCReportAndLink(ItemToCReportRelationPara para)`
- `String CheckEmendReport(CReportObjectPara para)`
- `Boolean CheckECodeExistInReport(CReportObjectPara para)`
- `Boolean CheckInReport(CReportObjectPara para)`
- `String GetVaultFileInfoFromObjectId(CReportObjectPara para)`
- `String CopyExistReportObject(CReportObjectPara para)`
- `String CopyExistTypicalReportObject(CReportObjectPara para)`
- `List`1 GetViceItems(CReportObjectPara para)`
- `String GetFirstProcess(CReportObjectPara para)`
- `Boolean GetBomItemUsed(CReportObjectPara para)`
- `String BatchCopyTypicalReportObject(CReportObjectPara para)`
- `Void SaveConnectSign(CReportLinkResourcePara para)`
- `Void Move(CReportLinkResourcePara para)`
- `List`1 GetBomTreeChildNodes(TreeViewPara para)`
- `TreeRootData GetBomTreeRoot(TreeViewPara para)`
- `TreeRootData GetBomTreeRootForExe(CReportObjectPara para)`
- `Dictionary`2 GetItemSetting(CReportObjectPara para)`
- `List`1 GetItemSettingForExe(CReportObjectPara para)`
- `Dictionary`2 GetReportBookTemplateForDropDown(CReportObjectPara para)`
- `String SaveReportBookTemplate(CReportObjectPara para)`
- `GridObject GetMSEReportBookTemplateListData(OnePageGridDataPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `EditGridObject GetItemReportObjectEditGridData(EditGridDataPara para)`
- `ReturnReportInformation GetReport(ApiGetReportPara para)`

### [interface] Hoteam.InforCenter.CReportEdit.Service.IReportForOCXService
- `String QueryForOCX(SessionPara para)`
- `Boolean UpdateData(ReportForOCXPara para)`
- `String GetPDFFile(ReportForOCXPara para)`
- `String GetZPDXItemSet(SessionPara para)`
- `String GetDownLoadIp(ReportForOCXDownPara para)`

### [class] Hoteam.InforCenter.CReportEdit.Service.ReportEditService
- `String GetDatabase(SessionPara para)`
- `List`1 GetAllTemplateType(CReportEditTemplate para)`
- `List`1 GetAllTemplate(CReportEditTemplate para)`
- `String GetTemplate(CReportEditTemplatePara para)`
- `List`1 GetDBLabelByTemplate(CReportEditTemplatePara para)`
- `GridObject GetReportLinkResourceData(OnePageGridDataPara para)`
- `GridObject GetSigReportLinkResourceData(OnePageGridDataPara para)`
- `EditGridObject GetReportLinkResource(EditGridDataPara para)`
- `EditGridObject GetSigReportLinkResource(EditGridDataPara para)`
- `String CheckReportLinkResourceExist(CReportLinkResourcePara para)`
- `String AddReportLinkResource(CReportLinkResourcePara para)`
- `String DeleteReportLinkResource(CReportLinkResourcePara para)`
- `String GetResourceByDBLabel(CReportLinkResourcePara para)`
- `List`1 GetBomTreeData(CReportObjectPara para)`
- `String CreateReportObject(CReportObjectPara para)`
- `String CopyExistReportObject(CReportObjectPara para)`
- `String CopyExistTypicalReportObject(CReportObjectPara para)`
- `String BatchCopyTypicalReportObject(CReportObjectPara para)`
- `String GetReportObject(CReportObjectPara para)`
- `String EmendReportObject(CReportObjectPara para)`
- `AddLinkMessage AddItemToCReport(ItemToCReportRelationPara para)`
- `String GetHistoryPicData(CReportObjectPara para)`
- `String GetViceItem(CReportObjectPara para)`
- `AddLinkMessage AddCReportAndLink(ItemToCReportRelationPara para)`
- `String CheckEmendReport(CReportObjectPara para)`
- `Boolean CheckECodeExistInReport(CReportObjectPara para)`
- `Boolean CheckInReport(CReportObjectPara para)`
- `String GetVaultFileInfoFromObjectId(CReportObjectPara para)`
- `List`1 GetViceItems(CReportObjectPara para)`
- `String GetFirstProcess(CReportObjectPara para)`
- `Boolean GetBomItemUsed(CReportObjectPara para)`
- `Void SaveConnectSign(CReportLinkResourcePara para)`
- `Void Move(CReportLinkResourcePara para)`
- `List`1 GetBomTreeChildNodes(TreeViewPara para)`
- `TreeRootData GetBomTreeRoot(TreeViewPara para)`
- `TreeRootData GetBomTreeRootForExe(CReportObjectPara para)`
- `Dictionary`2 GetItemSetting(CReportObjectPara para)`
- `List`1 GetItemSettingForExe(CReportObjectPara para)`
- `Dictionary`2 GetReportBookTemplateForDropDown(CReportObjectPara para)`
- `String SaveReportBookTemplate(CReportObjectPara para)`
- `GridObject GetMSEReportBookTemplateListData(OnePageGridDataPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `EditGridObject GetItemReportObjectEditGridData(EditGridDataPara para)`
- `ReturnReportInformation GetReport(ApiGetReportPara para)`

### [class] Hoteam.InforCenter.CReportEdit.Service.ReportForOCXService
- `String QueryForOCX(SessionPara para)`
- `Boolean UpdateData(ReportForOCXPara para)`
- `String GetPDFFile(ReportForOCXPara para)`
- `String GetZPDXItemSet(SessionPara para)`
- `String GetDownLoadIp(ReportForOCXDownPara para)`

## Hoteam.InforCenter.CappResource.Service.dll

### [class] Hoteam.InforCenter.CappResource.Service.CappResourceService
- `Void MoveAttributeUp(AttributeLinkPara para)`
- `Void MoveAttributeDown(AttributeLinkPara para)`
- `EditGridTitleData GetRecordObjectTitle(GridRowTitlePara para)`
- `EditGridTitleData GetRecordObjectTitleQuery(GridRowTitlePara para)`
- `EditGridObject GetRecordObjectData(EditGridDataPara para)`
- `EditGridObject GetRecordListData(EditGridDataPara para)`
- `EditGridObject GetRecordObjectDataforQuery(EditGridDataPara para)`
- `String GetRecordCanViewAttribute(CappResourcePara para)`
- `String ParseRecord(CappResourcePastePara para)`
- `GridObject GetAllSubStoreClass(OnePageGridDataPara para)`
- `List`1 QueryCappResourceClassify(ClassifyEditPara para)`
- `List`1 GetCappResourceClassCurAttributes(ClassifyEditPara para)`
- `GridObject GetCappResourceClassifyByCappProcess(OnePageGridDataPara para)`
- `GridObject GetCappResourceAttributeByClassify(OnePageGridDataPara para)`
- `Void UsingByResource(CappResourcePara para)`
- `Void RenoveRecordFromMSE(CappResourcePara para)`
- `Boolean ImportCappResourceRecord(ImportCappResourceRecordPara para)`
- `Int32 DeleteResourceStoreClassCheck(DeleteResourcePara para)`
- `Boolean DeleteResourceStoreClass(DeleteResourcePara para)`
- `String GetResClassId(CappResourcePara para)`
- `Dictionary`2 GetResAttrValue(CappResourcePara para)`
- `GridTitleData GetRecordTitle(GridRowTitlePara para)`
- `GridObject GetRecordData(OnePageGridDataPara para)`
- `EditGridTitleData GetRecordEditTitle(GridRowTitlePara para)`
- `EditGridObject GetRecordEditData(OnePageGridDataPara para)`
- `CADUsingResourceInfo GetRecordDataForCAD(GetRecordDataPara para)`
- `Boolean SaveRecordObjectProperty(CappResourcePara para)`
- `GridTitleData GetQueryRecordObjectTitle(GridRowTitlePara para)`
- `GridObject GetQueryRecordObjectDataInfo(OnePageGridDataPara para)`
- `List`1 GetRecordDataByClassID(CappResourcePara para)`
- `Int32 GetMaxUniqueNo(SessionPara para)`
- `List`1 GetResourceAllNode(TreeViewPara para)`
- `List`1 GetResourceAllNodeForCAD(GetResourceAllNodePara para)`
- `List`1 GetResourceAllNodeForEXE(GetResourceAllNodePara para)`
- `String CheckLinkResourceExist(CappResourcePara para)`
- `String AddReportLinkResource(CappResourcePara para)`
- `String GetAllParentIdFilter(CappResourcePara para)`
- `List`1 GetAllMseObjLinkResourceInfo(CappResourcePara para)`
- `String GetAllParentIdFilterForCAD(CappResourcePara para)`
- `GridObject GetLinkResource(OnePageGridDataPara para)`
- `Boolean CheckLinkResource(CappResourcePara para)`
- `Boolean SetRecordUseState(ClassifyEditPara para)`
- `Void AddResourceClassAtt(ClassifyEditPara para)`
- `Int32 GetMaxSequence(CappResourcePara para)`
- `String GetGroupCode(ClassifyEditPara para)`
- `String AddClassAttributeLink(AttributeLinkPara para)`
- `String GetAllParentIds(CappResourcePara para)`
- `String CheckIsMseObj(CappResourcePara para)`
- `String MSEToleranceStandard(MSETolStadPara para)`
- `Void MoveTop(AttributeLinkPara para)`
- `Void MoveBottom(AttributeLinkPara para)`
- `Boolean CheckColIsPseitem(CappResourcePara para)`
- `Dictionary`2 GetResourceClassifyAttributes(ClassifyEditPara para)`
- `Dictionary`2 GetMSEResourceAttCorresponds(CappResourcePara para)`

### [interface] Hoteam.InforCenter.CappResource.Service.ICappResourceService
- `Void MoveAttributeUp(AttributeLinkPara para)`
- `Void MoveAttributeDown(AttributeLinkPara para)`
- `EditGridTitleData GetRecordObjectTitle(GridRowTitlePara para)`
- `EditGridTitleData GetRecordObjectTitleQuery(GridRowTitlePara para)`
- `EditGridObject GetRecordObjectData(EditGridDataPara para)`
- `String GetRecordCanViewAttribute(CappResourcePara para)`
- `String ParseRecord(CappResourcePastePara para)`
- `GridObject GetAllSubStoreClass(OnePageGridDataPara para)`
- `Boolean DeleteResourceStoreClass(DeleteResourcePara para)`
- `List`1 QueryCappResourceClassify(ClassifyEditPara para)`
- `List`1 GetCappResourceClassCurAttributes(ClassifyEditPara para)`
- `GridObject GetCappResourceClassifyByCappProcess(OnePageGridDataPara para)`
- `GridObject GetCappResourceAttributeByClassify(OnePageGridDataPara para)`
- `EditGridObject GetRecordObjectDataforQuery(EditGridDataPara para)`
- `Void UsingByResource(CappResourcePara para)`
- `Int32 DeleteResourceStoreClassCheck(DeleteResourcePara para)`
- `Void RenoveRecordFromMSE(CappResourcePara para)`
- `Boolean ImportCappResourceRecord(ImportCappResourceRecordPara para)`
- `EditGridObject GetRecordListData(EditGridDataPara para)`
- `String GetResClassId(CappResourcePara para)`
- `Dictionary`2 GetResAttrValue(CappResourcePara para)`
- `GridTitleData GetRecordTitle(GridRowTitlePara para)`
- `GridObject GetRecordData(OnePageGridDataPara para)`
- `EditGridTitleData GetRecordEditTitle(GridRowTitlePara para)`
- `EditGridObject GetRecordEditData(OnePageGridDataPara para)`
- `CADUsingResourceInfo GetRecordDataForCAD(GetRecordDataPara para)`
- `Boolean SaveRecordObjectProperty(CappResourcePara para)`
- `GridTitleData GetQueryRecordObjectTitle(GridRowTitlePara para)`
- `GridObject GetQueryRecordObjectDataInfo(OnePageGridDataPara para)`
- `List`1 GetRecordDataByClassID(CappResourcePara para)`
- `Int32 GetMaxUniqueNo(SessionPara para)`
- `List`1 GetResourceAllNode(TreeViewPara para)`
- `List`1 GetResourceAllNodeForCAD(GetResourceAllNodePara para)`
- `List`1 GetResourceAllNodeForEXE(GetResourceAllNodePara para)`
- `String CheckLinkResourceExist(CappResourcePara para)`
- `String AddReportLinkResource(CappResourcePara para)`
- `GridObject GetLinkResource(OnePageGridDataPara para)`
- `Boolean CheckLinkResource(CappResourcePara para)`
- `String CheckIsMseObj(CappResourcePara para)`
- `Boolean SetRecordUseState(ClassifyEditPara para)`
- `Void AddResourceClassAtt(ClassifyEditPara para)`
- `Int32 GetMaxSequence(CappResourcePara para)`
- `String GetGroupCode(ClassifyEditPara para)`
- `String AddClassAttributeLink(AttributeLinkPara para)`
- `String GetAllParentIdFilter(CappResourcePara para)`
- `List`1 GetAllMseObjLinkResourceInfo(CappResourcePara para)`
- `String GetAllParentIdFilterForCAD(CappResourcePara para)`
- `String GetAllParentIds(CappResourcePara para)`
- `String MSEToleranceStandard(MSETolStadPara para)`
- `Void MoveTop(AttributeLinkPara para)`
- `Void MoveBottom(AttributeLinkPara para)`
- `Boolean CheckColIsPseitem(CappResourcePara para)`
- `Dictionary`2 GetResourceClassifyAttributes(ClassifyEditPara para)`
- `Dictionary`2 GetMSEResourceAttCorresponds(CappResourcePara para)`

## Hoteam.InforCenter.Coding.Maintenance.Service.dll

### [class] Hoteam.InforCenter.Coding.Maintenance.Service.CodingMaintenance
- `Boolean CheckRuleReference(CodeRulePara para)`
- `List`1 GetCodeKindList(CodeKindPara para)`
- `List`1 GetAllCodeKindList(CodeKindPara para)`
- `List`1 GetPermissionCodeKindData(CodeMachinePara para)`
- `List`1 GetCodeMarkChar(SessionPara para)`
- `List`1 GetCodeThickRule(SessionPara para)`
- `List`1 GetCodeThinRule(CodeRulePara para)`
- `Boolean SetCodeKindState(CodeKindPara para)`
- `String GetCodeRuleFromParentId(CodeRulePara para)`
- `String GetThinRuleInfoWithThinRuleId(CodeRulePara para)`
- `String GetCodeAndDescriptionWithCodeValue(CodeValuePara para)`
- `Void SetCodeState(CodeKindPara para)`
- `Void SetCodeStateDoc(CodeKindPara para)`
- `List`1 GetCodeStateList(SessionPara para)`
- `AddLinkMessage PasteCodeValue(CodeValuePara para)`
- `AddLinkMessage PasteCodeValueALL(CodeValuePara para)`
- `EditGridRowTitleObject GetCodeKindPermissionGridTitleData(SessionPara para)`
- `EditGridObject GetCodeKindPermissionGridData(CodeKindPara para)`
- `Boolean SaveCodePermissionData(CodePermissionListPara para)`
- `Void RuleMoveUp(CodeRulePara para)`
- `Void RuleMoveDown(CodeRulePara para)`
- `Boolean CheckOrderCodeExist(CodeRulePara para)`
- `GridObject GetParentRuleListData(OnePageGridDataPara para)`
- `EditTreeGridRowTitleData GetCodeValueGridRowTitle(CodeRulePara para)`
- `List`1 GetCodeValueGridRowData(CodeRulePara para)`
- `Boolean CheckCodeRuleLevel(CodeRulePara para)`
- `Boolean CheckCodeValueLevel(CodeRulePara para)`
- `AddLinkMessage PasteCodeRule(CodeRulePara para)`
- `TreeRootData GetObjectTypeTreeRootNode(SessionPara para)`
- `List`1 GetObjectTypeTreeChildNode(TreeViewPara para)`
- `GridTitleData GetObjectInfoTypeTitleData(SessionPara para)`
- `GridObject GetObjectInfoTypeData(OnePageGridDataPara para)`
- `String SaveCodeValueEditTreeGrid(SaveEditGridPara para)`
- `String GetCodeRuleInfoFromCodeKindId(CodeKindPara para)`
- `String GetInitialCodeFromPath(CodeValuePara para)`
- `Boolean SaveInitialCodeFromPath(CodeValuePara para)`
- `Boolean CheckInitialCode(CodeValuePara para)`
- `String GeneratorMultiCodeWithCodeValuePath(CodeValuePara para)`
- `String GetCodeValueStructFromParentID(CodeValuePara para)`
- `String GetCodeKindObjectInfoTypePermissionInfo(CodeKindPara para)`
- `String GetCodeKindUserPermissionInfo(CodeKindPara para)`
- `Boolean RecycleCode(CodeKindPara para)`
- `AddLinkMessage PasteCodeKind(CodeKindPara para)`
- `List`1 GetCodeKindTreeAllNode(TreeViewPara para)`
- `List`1 GetCodeKindTreeAllNodeByOtherModule(CodeKindPara para)`
- `String CheckObjectInfoTypePermission(CodeMachinePara para)`
- `ExcelExportData ExportCodeSolution(CodeKindPara para)`
- `String GetDateTextFromCodeValueId(CodeValuePara para)`
- `String CheckReferenceBeforeDelete(CodeKindPara para)`
- `Void SetCodeRuleOrderNum(CodeRulePara para)`
- `String GetOrderCodeOnPageCreate(CodeMachinePara para)`
- `String GeCodeKindUserPermissionGridData(CodeKindPara para)`
- `List`1 GetCodeRuleLenthDropDown(CodeRulePara para)`
- `List`1 GetObjectTypeList(SessionPara para)`
- `List`1 GetObjectInfotTypeSelectList(SessionPara para)`
- `String GetGeneratorCodeTypeByObjectType(CodeMachinePara para)`
- `String CheckImportTemplateFormat(CodeValuePara para)`
- `GridTitleData GetImportDataGridTitle(GridRowTitlePara para)`
- `GridObject GetImportGridData(OnePageGridDataPara para)`
- `Boolean ImportCodeSolution(CodeValuePara para)`
- `String CheckImportValueTemplateFormat(CodeValuePara para)`
- `String ImportCodeValue(CodeValuePara para)`
- `ExcelExportData ExportCodeValueByCodeRule(CodeValuePara para)`
- `Void CheckCodeKindState(CodeKindPara para)`
- `List`1 GetParentRuleData(CodeRulePara para)`
- `String ConfirmCodekindReplace(CodeValuePara para)`
- `GridObject GetAppliedCodeGridData(OnePageGridDataPara para)`
- `String GetAppliedCodeGridDataToCad(CodeMachinePara para)`
- `GridObject GetOccupationCodeGridData(OnePageGridDataPara para)`
- `String GetOccupationCodeGridDataToCad(CodeMachinePara para)`
- `Boolean CheckAppliedCodeExist(CodeMachinePara para)`
- `TreeRootData GetCodeValueTreeRootNode(TreeViewPara para)`
- `TreeChildData GetCodeValueTreeChildNode(TreeViewPara para)`
- `List`1 GetCodeValueDropDownData(CodeValuePara para)`
- `List`1 GetCurrentCodeValueDropDownData(CodeValuePara para)`
- `CheckCodeRuleData GetNextCodeRuleMode(CodeValuePara para)`
- `String SaveGeneratorCodePath(CodeMachinePara para)`
- `String GetGeneratorCodePathByUserAndObjType(CodeMachinePara para)`
- `String GetGeneratorCodePathByUserAndObjTypeOnWeb(CodeMachinePara para)`
- `List`1 GetCodeValueQueryData(TreeViewQueryPara para)`
- `List`1 GetCurValueData(CodeRulePara para)`
- `Boolean UpdateCodeResExcuted(CodeValuePara para)`
- `Boolean UpdateCodeResGeneratorPath(SessionPara para)`
- `Boolean CodeKindDel_DelCodes(CodeKindPara para)`
- `Boolean CheckCodeKindIsStart(CodeKindPara para)`
- `String GetOrderCodeOnPageCreate_Path(CodeMachinePara para)`
- `String GetCodeDataByPath(CodeMachinePara para)`
- `String GetPathIDByPath(CodeMachinePara para)`
- `String GetPathByCode(CodeMachinePara para)`
- `GridObject GetClassifyDataList(CodeKindPara para)`
- `CodeKind GetCodeKindInfo(CodeKindPara para)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Service.ICodingMaintenance
- `Void CheckCodeKindState(CodeKindPara para)`
- `GridTitleData GetImportDataGridTitle(GridRowTitlePara para)`
- `GridObject GetImportGridData(OnePageGridDataPara para)`
- `GridObject GetAppliedCodeGridData(OnePageGridDataPara para)`
- `String CheckImportTemplateFormat(CodeValuePara para)`
- `String ConfirmCodekindReplace(CodeValuePara para)`
- `Boolean ImportCodeSolution(CodeValuePara para)`
- `String GeCodeKindUserPermissionGridData(CodeKindPara para)`
- `String CheckReferenceBeforeDelete(CodeKindPara para)`
- `ExcelExportData ExportCodeSolution(CodeKindPara para)`
- `AddLinkMessage PasteCodeKind(CodeKindPara para)`
- `String GetCodeKindUserPermissionInfo(CodeKindPara para)`
- `String GetCodeKindObjectInfoTypePermissionInfo(CodeKindPara para)`
- `String GetCodeRuleInfoFromCodeKindId(CodeKindPara para)`
- `TreeRootData GetObjectTypeTreeRootNode(SessionPara para)`
- `List`1 GetObjectTypeTreeChildNode(TreeViewPara para)`
- `List`1 GetObjectTypeList(SessionPara para)`
- `List`1 GetObjectInfotTypeSelectList(SessionPara para)`
- `GridTitleData GetObjectInfoTypeTitleData(SessionPara para)`
- `GridObject GetObjectInfoTypeData(OnePageGridDataPara para)`
- `List`1 GetCodeKindList(CodeKindPara para)`
- `List`1 GetAllCodeKindList(CodeKindPara para)`
- `EditGridRowTitleObject GetCodeKindPermissionGridTitleData(SessionPara para)`
- `EditGridObject GetCodeKindPermissionGridData(CodeKindPara para)`
- `Boolean SaveCodePermissionData(CodePermissionListPara para)`
- `Boolean SetCodeKindState(CodeKindPara para)`
- `List`1 GetCodeRuleLenthDropDown(CodeRulePara para)`
- `Void SetCodeRuleOrderNum(CodeRulePara para)`
- `AddLinkMessage PasteCodeRule(CodeRulePara para)`
- `List`1 GetParentRuleData(CodeRulePara para)`
- `GridObject GetParentRuleListData(OnePageGridDataPara para)`
- `Boolean CheckOrderCodeExist(CodeRulePara para)`
- `List`1 GetCodeThickRule(SessionPara para)`
- `List`1 GetCodeThinRule(CodeRulePara para)`
- `List`1 GetCodeMarkChar(SessionPara para)`
- `Boolean CheckRuleReference(CodeRulePara para)`
- `Void RuleMoveUp(CodeRulePara para)`
- `Void RuleMoveDown(CodeRulePara para)`
- `String CheckImportValueTemplateFormat(CodeValuePara para)`
- `String ImportCodeValue(CodeValuePara para)`
- `ExcelExportData ExportCodeValueByCodeRule(CodeValuePara para)`
- `String SaveCodeValueEditTreeGrid(SaveEditGridPara para)`
- `EditTreeGridRowTitleData GetCodeValueGridRowTitle(CodeRulePara para)`
- `List`1 GetCodeValueGridRowData(CodeRulePara para)`
- `Boolean CheckCodeRuleLevel(CodeRulePara para)`
- `Boolean CheckCodeValueLevel(CodeRulePara para)`
- `List`1 GetCodeKindTreeAllNode(TreeViewPara para)`
- `List`1 GetCodeKindTreeAllNodeByOtherModule(CodeKindPara para)`
- `TreeRootData GetCodeValueTreeRootNode(TreeViewPara para)`
- `TreeChildData GetCodeValueTreeChildNode(TreeViewPara para)`
- `List`1 GetCodeValueDropDownData(CodeValuePara para)`
- `List`1 GetCurrentCodeValueDropDownData(CodeValuePara para)`
- `CheckCodeRuleData GetNextCodeRuleMode(CodeValuePara para)`
- `String GetCodeRuleFromParentId(CodeRulePara para)`
- `String GetThinRuleInfoWithThinRuleId(CodeRulePara para)`
- `AddLinkMessage PasteCodeValue(CodeValuePara para)`
- `AddLinkMessage PasteCodeValueALL(CodeValuePara para)`
- `String GetCodeValueStructFromParentID(CodeValuePara para)`
- `String GeneratorMultiCodeWithCodeValuePath(CodeValuePara para)`
- `Boolean CheckInitialCode(CodeValuePara para)`
- `Boolean SaveInitialCodeFromPath(CodeValuePara para)`
- `String GetInitialCodeFromPath(CodeValuePara para)`
- `String GetCodeAndDescriptionWithCodeValue(CodeValuePara para)`
- `Void SetCodeState(CodeKindPara para)`
- `Void SetCodeStateDoc(CodeKindPara para)`
- `Boolean RecycleCode(CodeKindPara para)`
- `List`1 GetCodeStateList(SessionPara para)`
- `String GetOrderCodeOnPageCreate(CodeMachinePara para)`
- `String GetDateTextFromCodeValueId(CodeValuePara para)`
- `String CheckObjectInfoTypePermission(CodeMachinePara para)`
- `List`1 GetPermissionCodeKindData(CodeMachinePara para)`
- `String GetGeneratorCodeTypeByObjectType(CodeMachinePara para)`
- `String GetAppliedCodeGridDataToCad(CodeMachinePara para)`
- `GridObject GetOccupationCodeGridData(OnePageGridDataPara para)`
- `String GetOccupationCodeGridDataToCad(CodeMachinePara para)`
- `Boolean CheckAppliedCodeExist(CodeMachinePara para)`
- `String SaveGeneratorCodePath(CodeMachinePara para)`
- `String GetGeneratorCodePathByUserAndObjType(CodeMachinePara para)`
- `String GetGeneratorCodePathByUserAndObjTypeOnWeb(CodeMachinePara para)`
- `List`1 GetCodeValueQueryData(TreeViewQueryPara para)`
- `List`1 GetCurValueData(CodeRulePara para)`
- `Boolean UpdateCodeResExcuted(CodeValuePara para)`
- `Boolean UpdateCodeResGeneratorPath(SessionPara para)`
- `Boolean CodeKindDel_DelCodes(CodeKindPara para)`
- `Boolean CheckCodeKindIsStart(CodeKindPara para)`
- `String GetOrderCodeOnPageCreate_Path(CodeMachinePara para)`
- `String GetCodeDataByPath(CodeMachinePara para)`
- `String GetPathIDByPath(CodeMachinePara para)`
- `String GetPathByCode(CodeMachinePara para)`
- `GridObject GetClassifyDataList(CodeKindPara para)`
- `CodeKind GetCodeKindInfo(CodeKindPara para)`

## Hoteam.InforCenter.ConsumptionStation.Service.dll

### [class] Hoteam.InforCenter.ConsumptionStation.Service.ConsumptionStationService
- `String CheckIfTheDataMatch(ConsumptionStationPara para)`
- `TreeRootData GetFactoryStructureRootNode(TreeViewPara para)`
- `List`1 GetFactoryStructureChildNode(TreeViewPara para)`
- `BOMTitleData GetBomFieldsService(SessionPara para)`
- `List`1 GetBomTreeService(GetBomStructPara para)`
- `EditGridTitleData GetLinkedConsumptionDataTitleData(GridRowTitlePara para)`
- `EditGridObject GetLinkedConsumptionData(EditGridDataPara para)`
- `String GetBomListService(EditBomOnePageDataPara para)`
- `String SaveConsumptionStationData(SaveCSData para)`
- `String DeleteConsumptionStationData(SaveCSData para)`
- `String PublishAssociation(SaveCSData para)`
- `String UpdateConsumptionData(ConsumptionStationPara para)`
- `String UpdateIsrefitemConsumptionData(ConsumptionStationPara para)`
- `String UpdateSuitabilityConsumptionData(ConsumptionStationPara para)`
- `Int32 GetDecimalPlaces(SessionPara para)`
- `BOMTitleData GetEditlistFieldsService(SessionPara para)`
- `List`1 GetEditListTreeService(EditlistStrData para)`
- `String GetEditListService(EditBomOnePageDataPara para)`

### [interface] Hoteam.InforCenter.ConsumptionStation.Service.IConsumptionStationService
- `String CheckIfTheDataMatch(ConsumptionStationPara para)`
- `TreeRootData GetFactoryStructureRootNode(TreeViewPara para)`
- `List`1 GetFactoryStructureChildNode(TreeViewPara para)`
- `BOMTitleData GetBomFieldsService(SessionPara para)`
- `List`1 GetBomTreeService(GetBomStructPara para)`
- `EditGridTitleData GetLinkedConsumptionDataTitleData(GridRowTitlePara para)`
- `EditGridObject GetLinkedConsumptionData(EditGridDataPara para)`
- `String GetBomListService(EditBomOnePageDataPara para)`
- `String SaveConsumptionStationData(SaveCSData para)`
- `String DeleteConsumptionStationData(SaveCSData para)`
- `String PublishAssociation(SaveCSData para)`
- `String UpdateConsumptionData(ConsumptionStationPara para)`
- `String UpdateIsrefitemConsumptionData(ConsumptionStationPara para)`
- `String UpdateSuitabilityConsumptionData(ConsumptionStationPara para)`
- `Int32 GetDecimalPlaces(SessionPara para)`
- `List`1 GetEditListTreeService(EditlistStrData para)`
- `BOMTitleData GetEditlistFieldsService(SessionPara para)`
- `String GetEditListService(EditBomOnePageDataPara para)`

## Hoteam.InforCenter.DeployCode.Service.dll

### [class] Hoteam.InforCenter.DeployCode.Service.DeployCodeService
- `String SaveDeployCode(DeployCodePara para)`
- `String DeleteDeployCodeValue(DeployCodePara para)`
- `Boolean CheckInfoTypeRepeat(DeployCodePara para)`
- `String CheckDelCodeValue(DeployCodePara para)`
- `EditGridTitleData GetValueEditTitleData(GridRowTitlePara para)`
- `Boolean IsDefaultValueFill(DeployCodePara para)`
- `Dictionary`2 GetValuesByVariant(DeployCodePara para)`
- `GridObject GetVariantValueInfoGridData(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.DeployCode.Service.IDeployCodeService
- `String SaveDeployCode(DeployCodePara para)`
- `String DeleteDeployCodeValue(DeployCodePara para)`
- `String CheckDelCodeValue(DeployCodePara para)`
- `Boolean CheckInfoTypeRepeat(DeployCodePara para)`
- `EditGridTitleData GetValueEditTitleData(GridRowTitlePara para)`
- `Boolean IsDefaultValueFill(DeployCodePara para)`
- `Dictionary`2 GetValuesByVariant(DeployCodePara para)`
- `GridObject GetVariantValueInfoGridData(OnePageGridDataPara para)`

## Hoteam.InforCenter.BomVariable.Service.dll

### [class] Hoteam.InforCenter.BomVariable.Service.BomVariableService
- `List`1 GetVariantsByItemID(EnumerationPara para)`
- `EditGridTitleData GetConditionTitleData(GridRowTitlePara para)`
- `String SaveCondition(BomCodeLinkPara para)`
- `String CheckRemoveVariant(BomCodeLinkPara para)`
- `EditGridObject GetProductConfigData(EditGridDataPara para)`
- `List`1 GetRestrictByItemID(BomCodeLinkPara para)`
- `String SaveConfig(ProductMatchPara para)`
- `String CheckSameConfig(ProductMatchPara para)`
- `List`1 GetConfigBomData(ProductMatchPara para)`
- `EditGridObject GetConditionData(EditGridDataPara para)`
- `String AddConfigBom(ProductMatchPara para)`
- `Boolean CheckRestrict(ProductMatchPara para)`

### [interface] Hoteam.InforCenter.BomVariable.Service.IBomVariableService
- `List`1 GetVariantsByItemID(EnumerationPara para)`
- `EditGridTitleData GetConditionTitleData(GridRowTitlePara para)`
- `String SaveCondition(BomCodeLinkPara para)`
- `String CheckRemoveVariant(BomCodeLinkPara para)`
- `EditGridObject GetProductConfigData(EditGridDataPara para)`
- `List`1 GetRestrictByItemID(BomCodeLinkPara para)`
- `String SaveConfig(ProductMatchPara para)`
- `String CheckSameConfig(ProductMatchPara para)`
- `List`1 GetConfigBomData(ProductMatchPara para)`
- `EditGridObject GetConditionData(EditGridDataPara para)`
- `String AddConfigBom(ProductMatchPara para)`
- `Boolean CheckRestrict(ProductMatchPara para)`

## Hoteam.InforCenter.DocModel.Service.dll

### [class] Hoteam.InforCenter.DocModel.Service.DatasetService
- `String SaveDataSetInfo(DataSetSavePara para)`
- `String CreateFileForDocDataSet(FilePara para)`
- `List`1 GetDataSetDownloadFiles(DataSetPara para)`
- `String GetDocDatasetHistoryPicData(DataSetPara para)`
- `GridObject GetDataSetFileList(OnePageGridDataPara para)`
- `List`1 GetDataSetDownloadFiles2(FilePara para)`
- `Void CheckOutDataset(DataSetPara para)`
- `String Check_CheckIn(DataSetPara para)`
- `List`1 GetDataSetHistoryDownloadFiles(DataSetPara para)`
- `List`1 GetSubDataModelList(FileTypePara para)`
- `List`1 GetSubDataModelListByEditMode(SessionPara para)`
- `String GetDocTypeFileExtend(DataSetSavePara para)`
- `String GetAllDocTypeFileExtend(SessionPara para)`
- `String EmendNewDataSet(DataSetSavePara para)`
- `AddLinkMessage AddDataSetRelations(DataSetSavePara para)`
- `AddLinkMessage PasteDataSetRef(DocPastePara para)`
- `AddLinkMessage PasteDataSetGenerator(DocPastePara para)`
- `String GetOperFileEID(FilePara para)`
- `String GetDocDataSetThumbnail(DataSetPara para)`
- `String GetDocDataSetThumbnailAndVolume(DataSetPara para)`
- `List`1 GetDocDataSetThumbnailAndVolumeInfo(DataSetPara para)`
- `List`1 GetDownloadFileInfo(DataSetSavePara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `Boolean CheckDataSetCodeRepeat(DataSetPara para)`
- `String BatchCreateDataSet(DataSetSavePara para)`
- `List`1 GetDocTypeTreeNode(SessionPara para)`
- `GridTitleData GetDownloadDocGridTile(DocDonwloadPara para)`
- `String GetDownloadDataSet(DocDonwloadPara para)`
- `List`1 GetBatchDownloadFile(DocDonwloadPara para)`
- `List`1 GetCurrentDataSetTypeList(DataSetPara para)`
- `EditGridTitleData GetBatchUploadTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchUploadData(OnePageGridDataPara para)`
- `String BatchUploadDataSet(DataSetSavePara para)`
- `String BatchUploadDataSetInTask(DataSetSavePara para)`
- `GridTitleData GetComparisonGridTitle(GridRowTitlePara para)`
- `GridObject GetComparisonGridData(OnePageGridDataPara para)`
- `List`1 GetCheckOutMainFile(DataSetPara para)`
- `List`1 GetBaseLineMainFile(DataSetPara para)`
- `Boolean UpdateCheckOutMainFile(DataSetSavePara para)`
- `List`1 GetCheckOutAllFile(DataSetPara para)`
- `Boolean UpdateDocInfoByCheckInFile(DataSetSavePara para)`
- `Boolean UpdateCheckInfo(DataSetSavePara para)`
- `EditGridObject GetImportExcelData(ImportWcfPara para)`
- `EditGridTitleData GetImportExcelTitlData(SessionPara para)`
- `Boolean ImportDataSet(DataSetSavePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `String CheckImportTemplateFormat(ImportCheckPara para)`
- `GridTitleData GetAttachmentGridRowTitle(SessionPara para)`
- `GridObject GetAttachmentGridData(OnePageGridDataPara para)`
- `String SaveUrlAttachment(SaveObjectDataPara para)`
- `GridObject GetMyDocListMainFlatData(SessionPara para)`
- `GridObject GetMyDocListMainFlatData2(SessionPara para)`
- `Void CheckObjectExist(DataSetPara para)`
- `String CheckDatasetCheckOutUser(DataSetPara para)`
- `ReturnObject CheckOutObject(CheckPara para)`
- `Boolean CheckECodeExistInDatasets(DataSetPara para)`
- `String CheckECodeExistInDatasetsAny(DataSetPara para)`
- `String CheckECodeExistInDatasetsForCAD(DataSetPara para)`
- `String CheckEmendDataset(DataSetPara para)`
- `List`1 GetCheckOutAllFileAndCheckInObject(DataSetPara para)`
- `Boolean UpdateCheckOutAttachmentFile(DataSetSavePara para)`
- `Void SendObjectActionMessage(DataSetPara para)`
- `Boolean UpdataCheckOutIP(CheckPara para)`
- `List`1 GetOrderBySubDataModelList(SubDataModelPara para)`
- `Boolean UnCheckOutDataset(CheckPara para)`
- `Boolean DeleteFileByFileInfo(DataSetPara para)`
- `Boolean ReplaceDataset(DataSetPara para)`
- `String GetExtendDocID(DataSetPara para)`
- `String GetWorkflowTemplateID(DataSetPara para)`
- `String GetFileServerInfo(GetFileServerInfoPara para)`
- `String CopyAsLatest(DataSetPara para)`
- `Boolean CheckTypeExistByDocDataset()`
- `String GetFormDefaultDataByTemplateId(DataSetPara para)`
- `Boolean GetClearSignCommandStateByDocID(DataSetPara para)`
- `String BatchUploadItemCheck(DataSetPara para)`
- `String BatchUploadDataSetAndItem(DataSetSavePara para)`
- `List`1 GetEditAndOpenMainFile(DataSetPara para)`
- `GridObject GetProcessDocListData(OnePageGridDataPara para)`
- `String GetIsAttachDocCount(DataSetPara para)`
- `GridObject GetSKGYDocListData(OnePageGridDataPara para)`
- `String CheckDataControlDocPara(DataSetSavePara para)`
- `String UPDATEDCDocParaEID(DataSetSavePara para)`
- `String GetResourceToCNCParaModel(DataSetPara para)`
- `String GetDownDocFileMedelVault(DataSetPara para)`
- `String GetComment(DataSetPara para)`
- `DeleteMessage CheckObjectCanDelete(DataSetPara para)`
- `DocRetInfo GetRelatedItemCodeByDocEID(DataSetPara para)`
- `ReturnObject CheckMainModelCheckStatus(DataSetPara para)`
- `DatasetInformation GetDatasetInformation(DatasetInformationPara para)`

### [class] Hoteam.InforCenter.DocModel.Service.DatasetTypeService
- `Boolean IsUsed(FileTypePara para)`

### [interface] Hoteam.InforCenter.DocModel.Service.IDatasetService
- `Boolean UnCheckOutDataset(CheckPara para)`
- `List`1 GetOrderBySubDataModelList(SubDataModelPara para)`
- `String SaveDataSetInfo(DataSetSavePara para)`
- `Void SendObjectActionMessage(DataSetPara para)`
- `List`1 GetDataSetDownloadFiles2(FilePara para)`
- `List`1 GetDataSetDownloadFiles(DataSetPara para)`
- `List`1 GetDataSetHistoryDownloadFiles(DataSetPara para)`
- `List`1 GetSubDataModelListByEditMode(SessionPara para)`
- `ReturnObject CheckOutObject(CheckPara para)`
- `Boolean UpdataCheckOutIP(CheckPara para)`
- `String Check_CheckIn(DataSetPara para)`
- `Void CheckOutDataset(DataSetPara para)`
- `String CheckDatasetCheckOutUser(DataSetPara para)`
- `List`1 GetSubDataModelList(FileTypePara para)`
- `String CreateFileForDocDataSet(FilePara para)`
- `String GetDocDatasetHistoryPicData(DataSetPara para)`
- `String EmendNewDataSet(DataSetSavePara para)`
- `AddLinkMessage AddDataSetRelations(DataSetSavePara para)`
- `AddLinkMessage PasteDataSetRef(DocPastePara para)`
- `AddLinkMessage PasteDataSetGenerator(DocPastePara para)`
- `GridObject GetDataSetFileList(OnePageGridDataPara para)`
- `String GetDocDataSetThumbnail(DataSetPara para)`
- `String GetDocDataSetThumbnailAndVolume(DataSetPara para)`
- `List`1 GetDocDataSetThumbnailAndVolumeInfo(DataSetPara para)`
- `List`1 GetDownloadFileInfo(DataSetSavePara para)`
- `String GetDocTypeFileExtend(DataSetSavePara para)`
- `String GetAllDocTypeFileExtend(SessionPara para)`
- `String GetOperFileEID(FilePara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `Boolean CheckDataSetCodeRepeat(DataSetPara para)`
- `String BatchCreateDataSet(DataSetSavePara para)`
- `List`1 GetDocTypeTreeNode(SessionPara para)`
- `GridTitleData GetDownloadDocGridTile(DocDonwloadPara para)`
- `String GetDownloadDataSet(DocDonwloadPara para)`
- `List`1 GetBatchDownloadFile(DocDonwloadPara para)`
- `List`1 GetCurrentDataSetTypeList(DataSetPara para)`
- `EditGridTitleData GetBatchUploadTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchUploadData(OnePageGridDataPara para)`
- `String BatchUploadDataSet(DataSetSavePara para)`
- `String BatchUploadDataSetInTask(DataSetSavePara para)`
- `GridTitleData GetComparisonGridTitle(GridRowTitlePara para)`
- `GridObject GetComparisonGridData(OnePageGridDataPara para)`
- `List`1 GetCheckOutMainFile(DataSetPara para)`
- `List`1 GetBaseLineMainFile(DataSetPara para)`
- `Boolean UpdateCheckOutMainFile(DataSetSavePara para)`
- `Boolean UpdateCheckOutAttachmentFile(DataSetSavePara para)`
- `List`1 GetCheckOutAllFile(DataSetPara para)`
- `List`1 GetCheckOutAllFileAndCheckInObject(DataSetPara para)`
- `Boolean UpdateDocInfoByCheckInFile(DataSetSavePara para)`
- `Boolean UpdateCheckInfo(DataSetSavePara para)`
- `EditGridObject GetImportExcelData(ImportWcfPara para)`
- `EditGridTitleData GetImportExcelTitlData(SessionPara para)`
- `Boolean ImportDataSet(DataSetSavePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `String CheckImportTemplateFormat(ImportCheckPara para)`
- `GridTitleData GetAttachmentGridRowTitle(SessionPara para)`
- `GridObject GetAttachmentGridData(OnePageGridDataPara para)`
- `String SaveUrlAttachment(SaveObjectDataPara para)`
- `GridObject GetMyDocListMainFlatData(SessionPara para)`
- `GridObject GetMyDocListMainFlatData2(SessionPara para)`
- `Void CheckObjectExist(DataSetPara para)`
- `Boolean CheckECodeExistInDatasets(DataSetPara para)`
- `String CheckECodeExistInDatasetsAny(DataSetPara para)`
- `String CheckECodeExistInDatasetsForCAD(DataSetPara para)`
- `String CheckEmendDataset(DataSetPara para)`
- `Boolean DeleteFileByFileInfo(DataSetPara para)`
- `Boolean ReplaceDataset(DataSetPara para)`
- `String GetExtendDocID(DataSetPara para)`
- `String GetWorkflowTemplateID(DataSetPara para)`
- `String GetFileServerInfo(GetFileServerInfoPara para)`
- `String CopyAsLatest(DataSetPara para)`
- `Boolean CheckTypeExistByDocDataset()`
- `String GetFormDefaultDataByTemplateId(DataSetPara para)`
- `Boolean GetClearSignCommandStateByDocID(DataSetPara para)`
- `String BatchUploadItemCheck(DataSetPara para)`
- `String BatchUploadDataSetAndItem(DataSetSavePara para)`
- `List`1 GetEditAndOpenMainFile(DataSetPara para)`
- `GridObject GetProcessDocListData(OnePageGridDataPara para)`
- `String GetIsAttachDocCount(DataSetPara para)`
- `GridObject GetSKGYDocListData(OnePageGridDataPara para)`
- `String CheckDataControlDocPara(DataSetSavePara para)`
- `String UPDATEDCDocParaEID(DataSetSavePara para)`
- `String GetResourceToCNCParaModel(DataSetPara para)`
- `String GetDownDocFileMedelVault(DataSetPara para)`
- `String GetComment(DataSetPara para)`
- `DeleteMessage CheckObjectCanDelete(DataSetPara para)`
- `DocRetInfo GetRelatedItemCodeByDocEID(DataSetPara para)`
- `DatasetInformation GetDatasetInformation(DatasetInformationPara para)`
- `ReturnObject CheckMainModelCheckStatus(DataSetPara para)`

### [interface] Hoteam.InforCenter.DocModel.Service.IDatasetTypeService
- `Boolean IsUsed(FileTypePara para)`

## Hoteam.InforCenter.Mobile.Doc.Service.dll

### [class] Hoteam.InforCenter.Mobile.Doc.Service.DatasetMobileService
- `Boolean ShowCheckOut(DataSetMobilePara para)`
- `String CheckOut(DataSetMobilePara para)`
- `String CheckIn(DataSetMobilePara para)`
- `String CheckCheckIn(DataSetMobilePara para)`

### [interface] Hoteam.InforCenter.Mobile.Doc.Service.IDatasetMobileService
- `String CheckOut(DataSetMobilePara para)`
- `String CheckIn(DataSetMobilePara para)`
- `Boolean ShowCheckOut(DataSetMobilePara para)`
- `String CheckCheckIn(DataSetMobilePara para)`

## Hoteam.InforCenter.DocTemplate.Service.dll

### [class] Hoteam.InforCenter.DocTemplate.Service.DocTemplateService
- `String CreateFileTemplateOnDocTemplateModule(DocTemplatePara para)`
- `Void DocFileTemplateDown(DocTemplatePara para)`
- `Void DocFileTemplateUp(DocTemplatePara para)`
- `List`1 DownloadDocFileTemplateFile(DocTemplatePara para)`
- `List`1 GetDocDataSetTypeFromExtendType(DocTemplatePara para)`
- `List`1 GetDocTemplateAllNode(SessionPara para)`
- `GridObject GetDocTemplateGridData(OnePageGridDataPara para)`
- `String GetGridDataFromObjectIds(DocTemplatePara para)`
- `String GetVaultFileInfoFromObjectId(DocTemplatePara para)`
- `String GetAutoVueBrowseFileInfo(DocTemplatePara para)`
- `Boolean MultiCreateDocFileTemplate(DocTemplatePara para)`
- `String MultiCreateDocFileTemplateNew(DocTemplatePara para)`
- `TreeRootData GetDocTemplateNode(TreeViewPara para)`
- `List`1 GetDocFileTemplateNode(TreeViewPara para)`
- `String GetDocDataSetThumbnail(DocTemplatePara para)`
- `List`1 GetTemplateClassifySelectList(SessionPara para)`
- `String GetDocClassFromExtendObjType(DocTemplatePara para)`
- `GridTitleData GetDocTemplateToFileTemplateGridTitle(GridRowTitlePara para)`
- `GridObject GetDocTemplateToFileTemplateGridData(OnePageGridDataPara para)`
- `List`1 GetDocTemplateToFileTemplateSelectList(DocTemplatePara para)`
- `List`1 GetDocTemplateToFileTemplateSelectListForCad(DocTemplatePara para)`
- `Boolean CheckOnlyFileTemplate(DocTemplatePara para)`
- `Boolean RemoveAction(DocTemplatePara para)`
- `String GetDocBrowserByExt(DocTemplatePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `GridTitleData GetImportExcelTitlData(SessionPara para)`
- `ImportCheckResult CheckImportTemplateFormat(ImportCheckPara para)`
- `Boolean ImportDocTemplate(DocTemplatePara para)`
- `String CheckDocTemplateExists(DocTemplatePara para)`
- `TreeRootData GetTemplateRootNodeData(TreeViewPara para)`
- `TreeChildData GetTemplateChildNodeData(TreeViewPara para)`
- `String SaveDocTemplateFormData(DocTemplatePara para)`
- `List`1 GetDocTemplateTreeNode(TreeViewPara para)`
- `TreeRootData GetQueryTemplateByName(TreeViewQueryPara para)`
- `String GetBaseLineVaultFileInfoFromObjectId(DocTemplatePara para)`

### [interface] Hoteam.InforCenter.DocTemplate.Service.IDocTemplateService
- `List`1 GetDocTemplateToFileTemplateSelectList(DocTemplatePara para)`
- `GridTitleData GetDocTemplateToFileTemplateGridTitle(GridRowTitlePara para)`
- `GridObject GetDocTemplateToFileTemplateGridData(OnePageGridDataPara para)`
- `List`1 GetDocTemplateAllNode(SessionPara para)`
- `GridObject GetDocTemplateGridData(OnePageGridDataPara para)`
- `String GetGridDataFromObjectIds(DocTemplatePara para)`
- `Boolean MultiCreateDocFileTemplate(DocTemplatePara para)`
- `String MultiCreateDocFileTemplateNew(DocTemplatePara para)`
- `String CreateFileTemplateOnDocTemplateModule(DocTemplatePara para)`
- `Void DocFileTemplateDown(DocTemplatePara para)`
- `Void DocFileTemplateUp(DocTemplatePara para)`
- `String GetVaultFileInfoFromObjectId(DocTemplatePara para)`
- `String GetAutoVueBrowseFileInfo(DocTemplatePara para)`
- `List`1 DownloadDocFileTemplateFile(DocTemplatePara para)`
- `List`1 GetDocDataSetTypeFromExtendType(DocTemplatePara para)`
- `TreeRootData GetDocTemplateNode(TreeViewPara para)`
- `List`1 GetDocFileTemplateNode(TreeViewPara para)`
- `String GetDocDataSetThumbnail(DocTemplatePara para)`
- `List`1 GetTemplateClassifySelectList(SessionPara para)`
- `List`1 GetDocTemplateToFileTemplateSelectListForCad(DocTemplatePara para)`
- `String GetDocClassFromExtendObjType(DocTemplatePara para)`
- `Boolean CheckOnlyFileTemplate(DocTemplatePara para)`
- `Boolean RemoveAction(DocTemplatePara para)`
- `String GetDocBrowserByExt(DocTemplatePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `GridTitleData GetImportExcelTitlData(SessionPara para)`
- `ImportCheckResult CheckImportTemplateFormat(ImportCheckPara para)`
- `Boolean ImportDocTemplate(DocTemplatePara para)`
- `String CheckDocTemplateExists(DocTemplatePara para)`
- `TreeRootData GetTemplateRootNodeData(TreeViewPara para)`
- `TreeChildData GetTemplateChildNodeData(TreeViewPara para)`
- `String SaveDocTemplateFormData(DocTemplatePara para)`
- `List`1 GetDocTemplateTreeNode(TreeViewPara para)`
- `TreeRootData GetQueryTemplateByName(TreeViewQueryPara para)`
- `String GetBaseLineVaultFileInfoFromObjectId(DocTemplatePara para)`

## Hoteam.InforCenter.Formula.Service.dll

### [class] Hoteam.InforCenter.Formula.Service.FormulaService
- `TreeRootData GetTreeRootNode(TreeViewPara para)`
- `List`1 GetTreeNodes(TreeViewPara para)`
- `GridObject GetFormulaMaterialListData(OnePageGridDataPara para)`
- `EditGridObject DealWithFormulaParaData(EditGridDataPara para)`
- `List`1 GetFormulaSymbols(SessionPara para)`
- `String FormulaCalculate(FormulaCalculatePara para)`
- `String SaveFormula(FormulaPara para)`
- `List`1 GetItemFormAttsTreeRootNode(TreePara para)`
- `List`1 GetItemFormulaTreeRootNode(TreePara para)`
- `GridObject GetConfigListData(GridPagerPara para)`
- `String SaveItemAttToFormulapara(ItemAttToFormulaPara para)`
- `GridObject GetConfigListDataByClickNode(ItemAttToFormulaPara para)`
- `String DeleteItemAttToFormulapara(ItemAttToFormulaPara para)`
- `String DeleteFormulaParaSure(DeleteFormulaPara para)`
- `String DeleteFormulaPara(DeleteFormulaPara para)`
- `MaterialCalculateLoadPageReturnData MaterialCalculateLoadPage(MaterialCalculateLoadPagePara para)`
- `String MaterialCalculate(MaterialCalculatePara para)`
- `String SaveFormulaParaValue(SaveFormulaParaValuePara para)`
- `String AllFormulaForComputing(ComputePara para)`
- `List`1 OneFormulaQueryList(ComputePara para)`
- `List`1 LoadFunTreeRootData(LoadFunTreeRootPara para)`
- `String RegFormulaText(RegFormulaTextPata para)`

## Hoteam.InforCenter.GrManagement.Service.dll

### [class] Hoteam.InforCenter.GrManagement.Service.GrMService
- `List`1 GetGrPermissionID(ObjectFilterPara para)`
- `Void SaveGrPermission(GrPara para)`
- `String GetIsolateFilter(ObjectFilterPara para)`
- `Boolean IsSharedById(ObjectFilterPara para)`

### [interface] Hoteam.InforCenter.GrManagement.Service.IGrMService
- `List`1 GetGrPermissionID(ObjectFilterPara para)`
- `Void SaveGrPermission(GrPara para)`
- `String GetIsolateFilter(ObjectFilterPara para)`
- `Boolean IsSharedById(ObjectFilterPara para)`

## Hoteam.InforCenter.ISTF16949.Service.dll

### [interface] Hoteam.InforCenter.ISTF16949.Service.ITFService
- `List`1 GetTemplateTreeData(TFQueryPara para)`
- `String CreateTFObject(TFObjectPara para)`
- `GridObject GetCheckData(OnePageGridDataPara para)`
- `String CheckData(TFObjectPara para)`
- `GridObject GetStaticticsData(OnePageGridDataPara para)`
- `String CopyTFTemplate(TFTemplateCopyPara para)`
- `String EditTFObject(TFObjectPara para)`
- `AddLinkMessage SaveFileTemplateRelation(TFObjectPara para)`

### [class] Hoteam.InforCenter.ISTF16949.Service.TFService
- `List`1 GetTemplateTreeData(TFQueryPara para)`
- `String CreateTFObject(TFObjectPara para)`
- `GridObject GetCheckData(OnePageGridDataPara para)`
- `String CheckData(TFObjectPara para)`
- `GridObject GetStaticticsData(OnePageGridDataPara para)`
- `String CopyTFTemplate(TFTemplateCopyPara para)`
- `String EditTFObject(TFObjectPara para)`
- `AddLinkMessage SaveFileTemplateRelation(TFObjectPara para)`

## Hoteam.InforCenter.IntegrationERP.Service.dll

### [interface] Hoteam.InforCenter.IntegrationERP.Service.IIntegrationERPService
- `GridObject IntegrationGetItem(OnePageGridDataPara para)`
- `GridObject IntegrationGetBOM(OnePageGridDataPara para)`
- `String GetEAIsettingRoule(EAISettingpara para)`
- `String IntegrationChackData(OnePageGridDataPara para)`
- `String IntegrationSendData(OnePageGridDataPara para)`
- `String GetDataFlowAccount(OnePageGridDataPara para)`
- `List`1 IntegrationGetItemDatafromCache(OnePageGridDataPara para)`
- `GridObject IntegrationGetRouteQuery(OnePageGridDataPara para)`
- `GridObject IntegrationGetProcess(OnePageGridDataPara para)`
- `GridObject IntegrationGetCReport(OnePageGridDataPara para)`
- `GridObject IntegrationGetDoc(OnePageGridDataPara para)`
- `String GetNodeThirdDBvalue(EAISettingpara para)`
- `List`1 GetAllThirdpartyDBs(EAISettingpara para)`
- `Void SaveNodeThirdDBvalue(EAISettingpara para)`
- `Void CreateRemeberDataTable(EAISettingpara para)`
- `String GetDataNumber(EAISettingpara para)`
- `String CheckEaiSettingData(EAISettingpara para)`
- `GridTitleData GetIntegrationGridTitle(GridRowTitlePara para)`
- `GridTitleData GetErpDataGridTitle(GridRowTitlePara para)`
- `String IntergrationSendDateToERP(OnePageGridDataPara para)`
- `GridObject IntegrationGetErpItem(OnePageGridDataPara para)`
- `GridObject IntegrationGetErpBOM(OnePageGridDataPara para)`
- `String GetDocMessageWebServiceMethod(OnePageGridDataPara para)`
- `Dictionary`2 GetEnumerationItemByObjectValue(EAISettingpara para)`

### [class] Hoteam.InforCenter.IntegrationERP.Service.IntegrationERPService
- `GridObject IntegrationGetItem(OnePageGridDataPara para)`
- `GridObject IntegrationGetBOM(OnePageGridDataPara para)`
- `GridObject IntegrationGetRouteQuery(OnePageGridDataPara para)`
- `GridObject IntegrationGetProcess(OnePageGridDataPara para)`
- `GridObject IntegrationGetCReport(OnePageGridDataPara para)`
- `GridObject IntegrationGetDoc(OnePageGridDataPara para)`
- `String GetEAIsettingRoule(EAISettingpara para)`
- `String IntegrationChackData(OnePageGridDataPara para)`
- `String IntegrationSendData(OnePageGridDataPara para)`
- `String GetDataFlowAccount(OnePageGridDataPara para)`
- `List`1 IntegrationGetItemDatafromCache(OnePageGridDataPara para)`
- `String GetNodeThirdDBvalue(EAISettingpara para)`
- `List`1 GetAllThirdpartyDBs(EAISettingpara para)`
- `Void SaveNodeThirdDBvalue(EAISettingpara para)`
- `Void CreateRemeberDataTable(EAISettingpara para)`
- `String GetDataNumber(EAISettingpara para)`
- `String CheckEaiSettingData(EAISettingpara para)`
- `GridTitleData GetIntegrationGridTitle(GridRowTitlePara para)`
- `GridTitleData GetErpDataGridTitle(GridRowTitlePara para)`
- `String IntergrationSendDateToERP(OnePageGridDataPara para)`
- `GridObject IntegrationGetErpItem(OnePageGridDataPara para)`
- `GridObject IntegrationGetErpBOM(OnePageGridDataPara para)`
- `String GetDocMessageWebServiceMethod(OnePageGridDataPara para)`
- `Dictionary`2 GetEnumerationItemByObjectValue(EAISettingpara para)`

## Hoteam.InforCenter.MazyTable.Service.dll

### [interface] Hoteam.InforCenter.MazyTable.Service.IMazyTableService
- `EditGridObject GetEditMazyTableData(OnePageGridDataPara para)`
- `EditGridTitleData GetEditMazyTableTitleData(GridRowTitlePara para)`
- `GridObject GetMazyTableData(OnePageGridDataPara para)`
- `GridObject GetMazyTableDataForImport(MazyTablePara para)`
- `GridTitleData GetMazyTableTitleData(GridRowTitlePara para)`
- `GridTitleData GetMazyTableTitleDataForImport(MazyTablePara para)`
- `Boolean SaveMazyTableValue(MTSaveValuePara para)`
- `String MTGroupDeleteCheck(MazyTablePara para)`
- `String MazyTableIsExistValueCheck(MazyTablePara para)`
- `EditGridTitleData GetMTParaListTitleData(GridRowTitlePara para)`
- `EditGridObject GetMTParaListData(EditGridDataPara para)`
- `EditGridTitleData GetCoordinateValuetTitleData(GridRowTitlePara para)`
- `EditGridObject GetCoordinateValueData(EditGridDataPara para)`
- `String CreateOrEidtCoordinateValue(MazyTablePara para)`
- `String GetCoordinateValue(MazyTablePara para)`
- `Void DeleteCoordinateValue(MazyTablePara para)`
- `String SaveMTPara(MazyTablePara para)`
- `Int32 GetMTValueParaCount(MazyTablePara para)`
- `Void DeleteMazyTableMTValue(MazyTablePara para)`
- `ExcelExportData GetMazyTableExportExcelData(MazyTablePara para)`
- `GridObject GetMazyTableExcelData(ImportWcfPara para)`
- `String GetAllMazyTable(SessionPara para)`
- `String GetAllParasByMazyTableID(MazyTablePara para)`
- `ImportMTCheckResult ImportMTTableCheckData(ImportMTTableCheckPara para)`
- `String ImportMazyTableFromExcel(MazyTableImportPara para)`
- `Void MoveObjectDown(MazyTablePara para)`
- `Void MoveObjectUp(MazyTablePara para)`

### [class] Hoteam.InforCenter.MazyTable.Service.MazyTableService
- `EditGridObject GetEditMazyTableData(OnePageGridDataPara para)`
- `EditGridTitleData GetEditMazyTableTitleData(GridRowTitlePara para)`
- `GridObject GetMazyTableData(OnePageGridDataPara para)`
- `GridObject GetMazyTableDataForImport(MazyTablePara para)`
- `GridTitleData GetMazyTableTitleData(GridRowTitlePara para)`
- `GridTitleData GetMazyTableTitleDataForImport(MazyTablePara para)`
- `Boolean SaveMazyTableValue(MTSaveValuePara para)`
- `String MTGroupDeleteCheck(MazyTablePara para)`
- `String MazyTableIsExistValueCheck(MazyTablePara para)`
- `EditGridTitleData GetMTParaListTitleData(GridRowTitlePara para)`
- `EditGridObject GetMTParaListData(EditGridDataPara para)`
- `EditGridTitleData GetCoordinateValuetTitleData(GridRowTitlePara para)`
- `EditGridObject GetCoordinateValueData(EditGridDataPara para)`
- `String CreateOrEidtCoordinateValue(MazyTablePara para)`
- `String GetCoordinateValue(MazyTablePara para)`
- `Void DeleteCoordinateValue(MazyTablePara para)`
- `String SaveMTPara(MazyTablePara para)`
- `Int32 GetMTValueParaCount(MazyTablePara para)`
- `Void DeleteMazyTableMTValue(MazyTablePara para)`
- `ExcelExportData GetMazyTableExportExcelData(MazyTablePara para)`
- `GridObject GetMazyTableExcelData(ImportWcfPara para)`
- `String GetAllMazyTable(SessionPara para)`
- `String GetAllParasByMazyTableID(MazyTablePara para)`
- `ImportMTCheckResult ImportMTTableCheckData(ImportMTTableCheckPara para)`
- `String ImportMazyTableFromExcel(MazyTableImportPara para)`
- `Void MoveObjectDown(MazyTablePara para)`
- `Void MoveObjectUp(MazyTablePara para)`

## Hoteam.InforCenter.MSE.Service.dll

### [interface] Hoteam.InforCenter.MSE.Service.IMSEService
- `EditGridTitleData GetMseParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetMseParaGridData(EditGridDataPara para)`
- `GridObject GetMseCLOpinionGridData(OnePageGridDataPara para)`
- `String MseAddInspectionCheckData(MSEPara para)`
- `String MseAddInspectionNewData(MSEPara para)`
- `String MseJyxAddNewData(MSEPara para)`
- `String MSEUpdateInspectionItems(MSEPara para)`
- `GridObject GetMseJyxAttribute(OnePageGridDataPara para)`
- `String MSEJYXsortByOrder(MSEPara para)`
- `Boolean MSEJYXClearData(MSEPara para)`
- `EditGridObject GetMSEZLCHAttInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetZLCHBindResourceAttlistTitle(GridRowTitlePara para)`
- `EditGridObject GetZLCHBindResourceAttlistData(EditGridDataPara para)`
- `GridObject GetZLCHBindedAttlistData(OnePageGridDataPara para)`
- `TreeRootData GetPureProcessAttTree(TreeViewPara para)`
- `GridObject GetJYCLGridData(OnePageGridDataPara para)`
- `String SaveJYCLAtt(SaveObjectDataPara para)`
- `TreeRootData TaskOutputGetRootNode(TreeViewPara para)`
- `String CheckIsolatedOrHighSecurityDataById(MSEPara para)`
- `String GetSecurityLevel(MSEPara para)`
- `Boolean CanStartTypicalProcessApproveFlow(SessionPara para)`
- `String EmendRelaTypeObjForTask(MseTaskRelaEmendPara para)`
- `EditGridTitleData GetTaskMseTitleData(GridRowTitlePara para)`
- `EditGridObject GetTaskMseGridData(EditGridDataPara para)`
- `String CheckMseObjectTask(CheckMseObjTask para)`
- `Boolean MseSupportCoOperationProcess(SessionPara para)`
- `String MseTaskAddLink(CheckMseTaskAndAdd para)`
- `GridObject GetQueryTypicalProcesslistData(TypicalProcessQueryPara para)`
- `List`1 GetMSEFlowChartNode(MSEPara para)`
- `List`1 GetMSEFlowChartNodeFIE(MSEPara para)`
- `EditGridTitleData GetMSENODESTYLETitle(GridRowTitlePara para)`
- `EditGridObject GetMSENODESTYLEData(EditGridDataPara para)`
- `GridObject GetCappProcessForPseListData(CappForPsePara para)`
- `MSEFlowChart GetProcessFlowChartStructureData(MSEPara para)`
- `Boolean PasteMSEJYX(MSEPara para)`
- `Int64 GetObjectByFilter(ObjectFilterPara para)`
- `String JudgeLoopForProcessFlowChart(MSEPara para)`
- `String DeleteLoopForProcessFlowChart(MSEPara para)`
- `String SaveProcessFlowChartNodeLocation(MSEPara para)`
- `GridObject QueryNotTypicalProcessView(OnePageGridDataPara para)`
- `DeleteMessage MSECheckDeleteObject(MSEPara para)`
- `List`1 GetMseNodeLocations(MSEPara para)`
- `Void MSEDeleteMseObj(MSEPara para)`
- `Void ChackModelColumn(MSEModelGeneratorPara para)`
- `String GetNodeTypeForEID(MSEPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `String HBSaveModelData(MsePageCreate para)`
- `String MSEApprovalGetTree(MSEApprovalGetTree para)`
- `String GetAttachDoc(MSEApprovalGetTree para)`
- `GridObject GetMseApprovalData(OnePageGridDataPara para)`
- `GridObject GetMseRelaApprovalData(OnePageGridDataPara para)`
- `EditGridObject GetMseOpinionApprovalGridData(EditGridDataPara para)`
- `String UserIsReviewer(MSEPara para)`
- `String SaveMseAttachComment(MSEApprovalGetTree para)`
- `String IsSponsor(MSEPara para)`
- `Void BatchCloseApproval(MSEPara para)`
- `String GetCaptionBySettingFormat(MSEPara para)`
- `CompareResult GetMSECompareResult(MSEComparePara para)`
- `TreeRootData GetMSELabelTreeRootNode(TreeViewPara para)`
- `GridObject GetMSELabelRelaObjGridData(OnePageGridDataPara para)`
- `GridTitleData GetMSELABELRelaObjTitleData(GridRowTitlePara para)`
- `String GetMSELABELObjectData(GetObjectDataPara para)`
- `String GetMSELABELPreProcess(MsePreProcePara para)`
- `Void MSELinkPartMove(MSEPara para)`
- `RetGetProcessByItemCode GetProcessesByItemCodes(GetProcessesByItemCodes para)`
- `RetGetProcessStruct GetProcessStruct(GetProcessStruct para)`
- `RetGetProcessRelation GetProcessRelation(GetProcessRelation para)`
- `List`1 GetProcessBomTreeNodes(TreeViewPara para)`
- `TreeRootData GetProcessBomTreeRootNode(TreeViewPara para)`
- `TreeChildData GetProcessBomTreeChildData(TreeViewPara para)`
- `TreeRootData GetMSEConfigResourceTreeAllNode(TreeViewPara para)`
- `EditGridObject GetMSEResourceAttCorrespondsList(MRAttCorrespondPara para)`
- `Dictionary`2 GetAllInfoType(MSEModelGeneratorPara para)`
- `Void SaveMSEResourceAttCorrespond(MRAttCorrespondPara para)`
- `Dictionary`2 GetLevel(MSEPara para)`
- `String CheckCreate(MSEPara para)`
- `Void DeleteSubObject(MSEPara para)`
- `Dictionary`2 GetProcessLevel(MSEPara para)`
- `String CreateProcessView(MSEPara para)`
- `String CreateMseConfig(MSEPara para)`
- `TreeRootData GetRootNode(TreeViewPara para)`
- `List`1 GetChildNode(TreeViewPara para)`
- `List`1 GetAllChildNode(TreeViewPara para)`
- `String EditProcess(MSEPara para)`
- `String EditMseConfig(MSEPara para)`
- `String PasteMseConfig(MSEPara para)`
- `String DealIndCtrlForConfigEdit(MSEPara para)`
- `String CreateAndEditConfigCheck(MSEPara para)`
- `String EmendVersion(MSEPara para)`
- `String CheckEmend(MSEPara para)`
- `String EmendProcess(MSEPara para)`
- `Void DeleteProcess(MSEPara para)`
- `TreeListRootData GetMSEBomData(TreeListViewPara para)`
- `TreeListChildData GetMSEBomChildData(TreeListViewPara para)`
- `Boolean CreateByPosition(MSEPara para)`
- `String SendCappTypical(MSEPara para)`
- `String SaveProcessTypical(MSEPara para)`
- `Boolean SaveProcessObjectAndRelation(MSEOutputPara para)`
- `Boolean DeleteOutputItem(MSEOutputPara para)`
- `List`1 GetDownloadFileInfo(MSEOutputPara para)`
- `Boolean PasteAttachDoc(MSEOutputPara para)`
- `GridTitleData GetLowerListTitle(GridRowTitlePara para)`
- `GridObject GetLowerListData(OnePageGridDataPara para)`
- `String ProcessObjectPaste(MSEPara para)`
- `GridTitleData GetRelationListTitle(GridRowTitlePara para)`
- `GridObject GetRelationListData(OnePageGridDataPara para)`
- `GridObject GetProcessImpactAnalysis(MSEPara para)`
- `ExcelExportTemplateDataModel BomCollect(MSEPara para)`
- `String GetProceeRoot(MSEPara para)`
- `Void AddResourceByParent(MSEPara para)`
- `String ProcessEditCheck(MSEPara para)`
- `String RecordProcessEditDate(MSEPara para)`
- `TreeListRootData GetMSEBomRootData(MSETreeListViewPara para)`
- `TreeListChildData GetMSEBomChildDataNew(MSETreeListViewPara para)`
- `String GetConfigUserPermissionInfo(MSEPara para)`
- `String CreateMSECRELAView(MSECRELA para)`
- `EditGridObject GetMSECRELAlistDate(EditGridDataPara para)`
- `String EditRelaTypeDropDown(MSECRELA para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `GridTitleData GetExtendInfoTitleDataForUse(GridRowTitlePara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `GridObject GetExtendInfoGridDataForUse(OnePageGridDataPara para)`
- `EditGridObject GetBaseInfoGridData(MSEModelGeneratorPara para)`
- `EditGridObject GetInheritInfoGridData(MSEModelGeneratorPara para)`
- `EditGridObject GetForeignKeyInfoGridData(MSEModelGeneratorPara para)`
- `EditGridTitleData GetClassAttTitleData(GridRowTitlePara para)`
- `EditGridObject GetClassAttInfoGridData(OnePageGridDataPara para)`
- `AddLinkMessage SaveMseClassAtt(MSEModelGeneratorPara para)`
- `String SaveModelData(ModelSavePara para)`
- `String GetINDVersionData(MSEPara para)`
- `Boolean CheckProcessCodeRepeat(ProcessPara para)`
- `GridObject GetMSEBookFormworkListDate(OnePageGridDataPara para)`
- `GridObject GetMSECardFormworkListDate(OnePageGridDataPara para)`
- `GridObject GetMSElevelconfigListDate(OnePageGridDataPara para)`
- `List`1 GetMSElevelconfigForm(MSEPara para)`
- `String AddMSElevelconfig(MSElevelPara para)`
- `Boolean SaveUsePerData(SaveUsePerData para)`
- `String CheckCanPaste(MSEPara para)`
- `String DeleteMseConfig(MSEPara para)`
- `List`1 GetPerRelaType(MSEPara para)`
- `String GetRelaControlType(MSEPara para)`
- `String NewRelaTypeObj(MSEPara para)`
- `String EmendRelaTypeObj(MSEPara para)`
- `String DeleteRelaTypeObj(MSEPara para)`
- `List`1 GetProcessPropertyTree(MSEPara para)`
- `List`1 GetReportPropertyTree(MSEPara para)`
- `Dictionary`2 GetCheckProcessLevel(MSEPara para)`
- `TreeChildData GetReportConfigProcessChildData(TreeViewPara para)`
- `String SaveMseCappReport(MSEReportModel para)`
- `Boolean UpdateStateid(MSEReportModel para)`
- `Boolean VerificationSetMainAndVice(MSEReportModel para)`
- `Dictionary`2 GetMSESetMainPageList(MSEReportModel para)`
- `Boolean CreateMSESetMainPage(MSEReportModel para)`
- `String SaveProcessBookTemplate(MSEBookModel para)`
- `String CreateAndEditMSEBookCheck(MSEBookModel para)`
- `String MseBookItemListQuerySaveObject(MSEBookModel para)`
- `GridObject GetMseBookItemListDate(OnePageGridDataPara para)`
- `Void MoveObjectDown(MSEBookModel para)`
- `Void MoveObjectUp(MSEBookModel para)`
- `String MseReportConfigAddLink(MSEPara para)`
- `GridObject DealMseReportConfigListData(OnePageGridDataPara para)`
- `Dictionary`2 GetReportTemplateList(MSEPara para)`
- `MseOtherMessageInfo GetCanCreateReportTemplateList(MSEPara para)`
- `MseOtherMessageInfo CheckExistRepAttByConfigIdAndReportID(MSEPara para)`
- `String SetOrCancelSplit(SetOrCancelSplitPara para)`
- `String CreateReportForMSE(MSEPara para)`
- `String GetCreatedReportForMSE(MSEPara para)`
- `String CheckReportHasCreatedForMSE(MSEPara para)`
- `TreeRootData GetTreeRootNode(TreeViewPara para)`
- `GridObject GetConfigListOnePageGridData(OnePageGridDataPara para)`
- `List`1 GetCappTypicalProcessTreeNode(TreeViewPara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `String BatchCreateProcess(MSEPara para)`
- `GridTitleData GetImportMSEOBJTitleData(GridRowTitlePara para)`
- `GridObject GetImportMSEOBJData(ImportWcfPara para)`
- `ImportCheckResult ImportMseobjCheckData(ImportMSEObjCheckPara para)`
- `AddLinkMessage ImportMseobj(MSEObjImportPara para)`
- `ExcelExportTemplateDataModel ExportExcelMSEOBJ(MSEObjExportTemplatePara para)`
- `String PreIsolatedOrHighSecurityCheck(MSEPara para)`
- `List`1 GetProcessSelectList(PreProcessPara para)`
- `String SetAllLowerReProcess(MSEPara para)`
- `String JudgeLoopForPreprocess(PreProcessPara para)`
- `EditGridObject GetCappProcessLowerListData(EditGridDataPara para)`
- `TreeListRootData GetCappProcessLowerTreeListData(TreeListViewPara para)`
- `TreeListChildData GetCappProcessLowerTreeListChildData(TreeListViewPara para)`
- `Boolean CappProcessLowerListSave(MSEPara para)`
- `Boolean CreateCodeRule(MSECODEPara para)`
- `Boolean DeleteCodeRule(MSECODEPara para)`
- `Void CreateConfigAutoSaveCodeRule(MSECODEPara para)`
- `String RefreshCode(MSECODEPara para)`
- `GridObject QueryMSEOBJData(OnePageGridDataPara para)`
- `AddLinkMessage CheckAddMseLink(MseObjPara para)`
- `String GetCurAllPreprocessToOne(MsePreProcePara para)`
- `Boolean IcMSECappConfigCheckUsingStateForMenu(MSEPara para)`
- `Void SaveProcessCAPPRecord(MSEResourcePara para)`
- `List`1 GetProcessResource(MSEPara para)`
- `Void MSEUpdateRelatedReport(MSEPara para)`
- `String GetModelEditColumns(MSEPara para)`
- `Void updateCodeState(MSEPara para)`
- `String MseParaAddNewData(MSEPara para)`
- `String MseCLAddNewData(MSEPara para)`

### [class] Hoteam.InforCenter.MSE.Service.MSEService
- `Dictionary`2 GetLevel(MSEPara para)`
- `String CheckCreate(MSEPara para)`
- `Void DeleteSubObject(MSEPara para)`
- `Dictionary`2 GetProcessLevel(MSEPara para)`
- `String CreateProcessView(MSEPara para)`
- `String CreateMseConfig(MSEPara para)`
- `String EditProcess(MSEPara para)`
- `String EditMseConfig(MSEPara para)`
- `String PasteMseConfig(MSEPara para)`
- `String DealIndCtrlForConfigEdit(MSEPara para)`
- `String EmendVersion(MSEPara para)`
- `String CheckEmend(MSEPara para)`
- `String EmendProcess(MSEPara para)`
- `Void DeleteProcess(MSEPara para)`
- `TreeRootData GetRootNode(TreeViewPara para)`
- `List`1 GetChildNode(TreeViewPara para)`
- `TreeListRootData GetMSEBomData(TreeListViewPara para)`
- `TreeListChildData GetMSEBomChildData(TreeListViewPara para)`
- `Boolean CreateByPosition(MSEPara para)`
- `String SendCappTypical(MSEPara para)`
- `String SaveProcessTypical(MSEPara para)`
- `Boolean SaveProcessObjectAndRelation(MSEOutputPara para)`
- `Boolean DeleteOutputItem(MSEOutputPara para)`
- `List`1 GetDownloadFileInfo(MSEOutputPara para)`
- `Boolean PasteAttachDoc(MSEOutputPara para)`
- `GridTitleData GetLowerListTitle(GridRowTitlePara para)`
- `GridObject GetLowerListData(OnePageGridDataPara para)`
- `String ProcessObjectPaste(MSEPara para)`
- `GridTitleData GetRelationListTitle(GridRowTitlePara para)`
- `GridObject GetRelationListData(OnePageGridDataPara para)`
- `GridObject GetProcessImpactAnalysis(MSEPara para)`
- `ExcelExportTemplateDataModel BomCollect(MSEPara para)`
- `String GetProceeRoot(MSEPara para)`
- `Void AddResourceByParent(MSEPara para)`
- `String ProcessEditCheck(MSEPara para)`
- `String RecordProcessEditDate(MSEPara para)`
- `TreeListRootData GetMSEBomRootData(MSETreeListViewPara para)`
- `TreeListChildData GetMSEBomChildDataNew(MSETreeListViewPara para)`
- `String GetConfigUserPermissionInfo(MSEPara para)`
- `String CreateMSECRELAView(MSECRELA para)`
- `EditGridObject GetMSECRELAlistDate(EditGridDataPara para)`
- `String EditRelaTypeDropDown(MSECRELA para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `GridTitleData GetExtendInfoTitleDataForUse(GridRowTitlePara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `GridObject GetExtendInfoGridDataForUse(OnePageGridDataPara para)`
- `EditGridObject GetBaseInfoGridData(MSEModelGeneratorPara para)`
- `EditGridObject GetInheritInfoGridData(MSEModelGeneratorPara para)`
- `EditGridObject GetForeignKeyInfoGridData(MSEModelGeneratorPara para)`
- `EditGridObject GetClassAttInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetClassAttTitleData(GridRowTitlePara para)`
- `AddLinkMessage SaveMseClassAtt(MSEModelGeneratorPara para)`
- `String SaveModelData(ModelSavePara para)`
- `String GetINDVersionData(MSEPara para)`
- `Boolean CheckProcessCodeRepeat(ProcessPara para)`
- `GridObject GetMSECardFormworkListDate(OnePageGridDataPara para)`
- `GridObject GetMSEBookFormworkListDate(OnePageGridDataPara para)`
- `GridObject GetMSElevelconfigListDate(OnePageGridDataPara para)`
- `List`1 GetMSElevelconfigForm(MSEPara para)`
- `String AddMSElevelconfig(MSElevelPara para)`
- `Boolean SaveUsePerData(SaveUsePerData para)`
- `String CheckCanPaste(MSEPara para)`
- `String CreateAndEditConfigCheck(MSEPara para)`
- `String DeleteMseConfig(MSEPara para)`
- `List`1 GetPerRelaType(MSEPara para)`
- `String GetRelaControlType(MSEPara para)`
- `String NewRelaTypeObj(MSEPara para)`
- `String EmendRelaTypeObj(MSEPara para)`
- `String DeleteRelaTypeObj(MSEPara para)`
- `List`1 GetProcessPropertyTree(MSEPara para)`
- `List`1 GetReportPropertyTree(MSEPara para)`
- `Dictionary`2 GetCheckProcessLevel(MSEPara para)`
- `TreeChildData GetReportConfigProcessChildData(TreeViewPara para)`
- `GridObject GetMseBookItemListDate(OnePageGridDataPara para)`
- `String SaveMseCappReport(MSEReportModel para)`
- `Boolean UpdateStateid(MSEReportModel para)`
- `Boolean VerificationSetMainAndVice(MSEReportModel para)`
- `Dictionary`2 GetMSESetMainPageList(MSEReportModel para)`
- `Boolean CreateMSESetMainPage(MSEReportModel para)`
- `String SaveProcessBookTemplate(MSEBookModel para)`
- `String MseBookItemListQuerySaveObject(MSEBookModel para)`
- `String CreateAndEditMSEBookCheck(MSEBookModel para)`
- `Void MoveObjectDown(MSEBookModel para)`
- `Void MoveObjectUp(MSEBookModel para)`
- `String MseReportConfigAddLink(MSEPara para)`
- `GridObject DealMseReportConfigListData(OnePageGridDataPara para)`
- `Dictionary`2 GetReportTemplateList(MSEPara para)`
- `MseOtherMessageInfo GetCanCreateReportTemplateList(MSEPara para)`
- `MseOtherMessageInfo CheckExistRepAttByConfigIdAndReportID(MSEPara para)`
- `String SetOrCancelSplit(SetOrCancelSplitPara para)`
- `String CreateReportForMSE(MSEPara para)`
- `String GetCreatedReportForMSE(MSEPara para)`
- `String CheckReportHasCreatedForMSE(MSEPara para)`
- `TreeRootData GetTreeRootNode(TreeViewPara para)`
- `GridObject GetConfigListOnePageGridData(OnePageGridDataPara para)`
- `List`1 GetCappTypicalProcessTreeNode(TreeViewPara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `String BatchCreateProcess(MSEPara para)`
- `String PreIsolatedOrHighSecurityCheck(MSEPara para)`
- `List`1 GetProcessSelectList(PreProcessPara para)`
- `String SetAllLowerReProcess(MSEPara para)`
- `String JudgeLoopForPreprocess(PreProcessPara para)`
- `List`1 GetAllChildNode(TreeViewPara para)`
- `EditGridObject GetCappProcessLowerListData(EditGridDataPara para)`
- `TreeListRootData GetCappProcessLowerTreeListData(TreeListViewPara para)`
- `TreeListChildData GetCappProcessLowerTreeListChildData(TreeListViewPara para)`
- `Boolean CappProcessLowerListSave(MSEPara para)`
- `Boolean CreateCodeRule(MSECODEPara para)`
- `Boolean DeleteCodeRule(MSECODEPara para)`
- `Void CreateConfigAutoSaveCodeRule(MSECODEPara para)`
- `String RefreshCode(MSECODEPara para)`
- `GridTitleData GetImportMSEOBJTitleData(GridRowTitlePara para)`
- `GridObject GetImportMSEOBJData(ImportWcfPara para)`
- `ImportCheckResult ImportMseobjCheckData(ImportMSEObjCheckPara para)`
- `AddLinkMessage ImportMseobj(MSEObjImportPara para)`
- `ExcelExportTemplateDataModel ExportExcelMSEOBJ(MSEObjExportTemplatePara para)`
- `GridObject QueryMSEOBJData(OnePageGridDataPara para)`
- `AddLinkMessage CheckAddMseLink(MseObjPara para)`
- `String GetCurAllPreprocessToOne(MsePreProcePara para)`
- `Boolean IcMSECappConfigCheckUsingStateForMenu(MSEPara para)`
- `Void SaveProcessCAPPRecord(MSEResourcePara para)`
- `List`1 GetProcessResource(MSEPara para)`
- `Void MSEUpdateRelatedReport(MSEPara para)`
- `String GetModelEditColumns(MSEPara para)`
- `Void updateCodeState(MSEPara para)`
- `Int64 GetObjectByFilter(ObjectFilterPara para)`
- `String MseParaAddNewData(MSEPara para)`
- `String MseCLAddNewData(MSEPara para)`
- `EditGridTitleData GetMseParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetMseParaGridData(EditGridDataPara para)`
- `GridObject GetMseCLOpinionGridData(OnePageGridDataPara para)`
- `String MseAddInspectionCheckData(MSEPara para)`
- `String MseAddInspectionNewData(MSEPara para)`
- `String MseJyxAddNewData(MSEPara para)`
- `String MSEUpdateInspectionItems(MSEPara para)`
- `EditGridObject GetMSEZLCHAttGridData(OnePageGridDataPara para)`
- `EditGridObject GetMSEZLCHAttInfoGridData(OnePageGridDataPara para)`
- `String MSEJYXsortByOrder(MSEPara para)`
- `EditGridTitleData GetZLCHBindResourceAttlistTitle(GridRowTitlePara para)`
- `EditGridObject GetZLCHBindResourceAttlistData(EditGridDataPara para)`
- `GridObject GetZLCHBindedAttlistData(OnePageGridDataPara para)`
- `TreeRootData GetPureProcessAttTree(TreeViewPara para)`
- `GridObject GetJYCLGridData(OnePageGridDataPara para)`
- `String SaveJYCLAtt(SaveObjectDataPara para)`
- `GridObject GetMseJyxAttribute(OnePageGridDataPara para)`
- `Boolean MSEJYXClearData(MSEPara para)`
- `TreeRootData TaskOutputGetRootNode(TreeViewPara para)`
- `String CheckIsolatedOrHighSecurityDataById(MSEPara para)`
- `List`1 GetMSEFlowChartNodeFIE(MSEPara para)`
- `List`1 GetMSEFlowChartNode(MSEPara para)`
- `EditGridTitleData GetMSENODESTYLETitle(GridRowTitlePara para)`
- `EditGridObject GetMSENODESTYLEData(EditGridDataPara para)`
- `Boolean CanStartTypicalProcessApproveFlow(SessionPara para)`
- `String GetSecurityLevel(MSEPara para)`
- `String EmendRelaTypeObjForTask(MseTaskRelaEmendPara para)`
- `EditGridTitleData GetTaskMseTitleData(GridRowTitlePara para)`
- `EditGridObject GetTaskMseGridData(EditGridDataPara para)`
- `GridObject GetQueryTypicalProcesslistData(TypicalProcessQueryPara para)`
- `String CheckMseObjectTask(CheckMseObjTask para)`
- `String MseTaskAddLink(CheckMseTaskAndAdd para)`
- `Boolean MseSupportCoOperationProcess(SessionPara para)`
- `GridObject GetCappProcessForPseListData(CappForPsePara para)`
- `MSEFlowChart GetProcessFlowChartStructureData(MSEPara para)`
- `Boolean PasteMSEJYX(MSEPara para)`
- `String JudgeLoopForProcessFlowChart(MSEPara para)`
- `String DeleteLoopForProcessFlowChart(MSEPara para)`
- `String SaveProcessFlowChartNodeLocation(MSEPara para)`
- `GridObject QueryNotTypicalProcessView(OnePageGridDataPara para)`
- `DeleteMessage MSECheckDeleteObject(MSEPara para)`
- `List`1 GetMseNodeLocations(MSEPara para)`
- `Void MSEDeleteMseObj(MSEPara para)`
- `Void ChackModelColumn(MSEModelGeneratorPara para)`
- `String GetNodeTypeForEID(MSEPara para)`
- `String MSEApprovalGetTree(MSEApprovalGetTree para)`
- `String GetAttachDoc(MSEApprovalGetTree para)`
- `GridObject GetMseApprovalData(OnePageGridDataPara para)`
- `EditGridObject GetMseOpinionApprovalGridData(EditGridDataPara para)`
- `GridObject GetMseRelaApprovalData(OnePageGridDataPara para)`
- `String UserIsReviewer(MSEPara para)`
- `String SaveMseAttachComment(MSEApprovalGetTree para)`
- `String IsSponsor(MSEPara para)`
- `Void BatchCloseApproval(MSEPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `String HBSaveModelData(MsePageCreate para)`
- `String GetCaptionBySettingFormat(MSEPara para)`
- `CompareResult GetMSECompareResult(MSEComparePara para)`
- `TreeRootData GetMSELabelTreeRootNode(TreeViewPara para)`
- `GridObject GetMSELabelRelaObjGridData(OnePageGridDataPara para)`
- `GridTitleData GetMSELABELRelaObjTitleData(GridRowTitlePara para)`
- `String GetMSELABELObjectData(GetObjectDataPara para)`
- `String GetMSELABELPreProcess(MsePreProcePara para)`
- `Void MSELinkPartMove(MSEPara para)`
- `RetGetProcessByItemCode GetProcessesByItemCodes(GetProcessesByItemCodes para)`
- `RetGetProcessStruct GetProcessStruct(GetProcessStruct para)`
- `RetGetProcessRelation GetProcessRelation(GetProcessRelation para)`
- `List`1 GetProcessBomTreeNodes(TreeViewPara para)`
- `TreeRootData GetProcessBomTreeRootNode(TreeViewPara para)`
- `TreeChildData GetProcessBomTreeChildData(TreeViewPara para)`
- `TreeRootData GetMSEConfigResourceTreeAllNode(TreeViewPara para)`
- `EditGridObject GetMSEResourceAttCorrespondsList(MRAttCorrespondPara para)`
- `Dictionary`2 GetAllInfoType(MSEModelGeneratorPara para)`
- `Void SaveMSEResourceAttCorrespond(MRAttCorrespondPara para)`

## Hoteam.InforCenter.MSEParaDesign.Service.dll

### [interface] Hoteam.InforCenter.MSEParaDesign.Service.IMSEParaDesignService
- `String CreateAndEditParaProCheck(MSEParaDesignParameter para)`
- `String CreateMseParaPro(MSEParaDesignParameter para)`
- `String EditMseParaPro(MSEParaDesignParameter para)`
- `EditGridTitleData OverrideDriverConfigurationListHeader(GridRowTitlePara para)`
- `EditGridObject OverrideDriverConfigurationCells(EditGridDataPara para)`
- `EditGridObject MSEDriverVariableEditListConfigurationCells(EditGridDataPara para)`
- `String SaveDriverVariableObjData(MSEParaDesignParameter para)`
- `List`1 GetDriverVariableCellValue(MSEParaDesignParameter para)`
- `TreeRootData GetPseAttTree(MSEParaDesignParameter para)`
- `String SaveMseParaLibFromPse(MSEParaDesignParameter para)`
- `String MseParaLibDeleteCheck(MSEParaDesignParameter para)`
- `String UpdateStopOrUseMenu(MSEParaDesignParameter para)`
- `String UpdateMSEStrDriData(MSEParaDesignParameter para)`
- `String DriverDataSourceClickSaveData(MSEParaDesignParameter para)`
- `GridObject ApplicationConditionsListQuery(OnePageGridDataPara para)`
- `GridTitleData ApplicationConditionsListQueryTitle(GridRowTitlePara para)`
- `Dictionary`2 GetLevel(SessionPara para)`
- `Dictionary`2 ObtainParametricProcessPlan(MSEParaDesignParameter para)`
- `Dictionary`2 GetDriverRules(MSEParaDesignParameter para)`
- `String CheckRemoveVariant(MSEParaDesignParameter para)`
- `EditGridTitleData GetParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetParaData(EditGridDataPara para)`
- `String SaveTypParaLib(MSEParaDesignParameter para)`
- `String CheckParaLibOtherName(MSEParaDesignParameter para)`
- `GridObject StepTwoPageListDataLoad(OnePageGridDataPara para)`
- `GridTitleData StepTwoPageListTitleLoad(GridRowTitlePara para)`
- `String GetStepTwoPageData(MSEParaDesignParameter para)`
- `String GetThirdStepData(MSEParaDesignParameter para)`
- `EditGridTitleData GetStepThreeTitleData(GridRowTitlePara para)`
- `EditGridObject GetStepThreeData(EditGridDataPara para)`
- `EditGridRowTitleData GetParameterEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetParameterEditGridData(ParameterEditGridDataPara para)`
- `Dictionary`2 GetRulesAndRelaSource(MSEParaDesignParameter para)`
- `String GetFourStepData(StepThreePageModel para)`
- `String GetTypicalPara(MSEParaDesignParameter para)`
- `TreeRootData GetRootMSEConfig(TreeViewPara para)`
- `List`1 GetMseConfigTree(TreeViewPara para)`
- `String CreateMseObjFromMSEParaDesignService(CompleteTheData para)`
- `EditGridTitleData GetParaLibTitleData(GridRowTitlePara para)`
- `EditGridTitleData MSEDriverVariableEditListGetParaLibTitleData(GridRowTitlePara para)`
- `Dictionary`2 GetMSEParaLibData(MSEParaDesignParameter para)`
- `String ClearDriverVariableData(MSEParaDesignParameter para)`
- `EditGridTitleData GetAddFailedParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetAddFailedParaData(EditGridDataPara para)`
- `List`1 GetAllParaCheck(ObjectAuthorization para)`

### [class] Hoteam.InforCenter.MSEParaDesign.Service.MSEParaDesignService
- `String CreateAndEditParaProCheck(MSEParaDesignParameter para)`
- `String CreateMseParaPro(MSEParaDesignParameter para)`
- `String EditMseParaPro(MSEParaDesignParameter para)`
- `EditGridTitleData OverrideDriverConfigurationListHeader(GridRowTitlePara para)`
- `EditGridObject OverrideDriverConfigurationCells(EditGridDataPara para)`
- `EditGridObject MSEDriverVariableEditListConfigurationCells(EditGridDataPara para)`
- `String SaveDriverVariableObjData(MSEParaDesignParameter para)`
- `List`1 GetDriverVariableCellValue(MSEParaDesignParameter para)`
- `String UpdateStopOrUseMenu(MSEParaDesignParameter para)`
- `String UpdateMSEStrDriData(MSEParaDesignParameter para)`
- `String DriverDataSourceClickSaveData(MSEParaDesignParameter para)`
- `GridObject ApplicationConditionsListQuery(OnePageGridDataPara para)`
- `GridTitleData ApplicationConditionsListQueryTitle(GridRowTitlePara para)`
- `Dictionary`2 GetLevel(SessionPara para)`
- `String CheckRemoveVariant(MSEParaDesignParameter para)`
- `EditGridTitleData GetParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetParaData(EditGridDataPara para)`
- `String SaveTypParaLib(MSEParaDesignParameter para)`
- `String CheckParaLibOtherName(MSEParaDesignParameter para)`
- `Dictionary`2 ObtainParametricProcessPlan(MSEParaDesignParameter para)`
- `Dictionary`2 GetDriverRules(MSEParaDesignParameter para)`
- `TreeRootData GetPseAttTree(MSEParaDesignParameter para)`
- `String SaveMseParaLibFromPse(MSEParaDesignParameter para)`
- `String MseParaLibDeleteCheck(MSEParaDesignParameter para)`
- `GridObject StepTwoPageListDataLoad(OnePageGridDataPara para)`
- `GridTitleData StepTwoPageListTitleLoad(GridRowTitlePara para)`
- `String GetStepTwoPageData(MSEParaDesignParameter para)`
- `String GetThirdStepData(MSEParaDesignParameter para)`
- `EditGridTitleData GetStepThreeTitleData(GridRowTitlePara para)`
- `EditGridObject GetStepThreeData(EditGridDataPara para)`
- `Dictionary`2 GetRulesAndRelaSource(MSEParaDesignParameter para)`
- `String GetFourStepData(StepThreePageModel para)`
- `EditGridRowTitleData GetParameterEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetParameterEditGridData(ParameterEditGridDataPara para)`
- `String GetTypicalPara(MSEParaDesignParameter para)`
- `TreeRootData GetRootMSEConfig(TreeViewPara para)`
- `List`1 GetMseConfigTree(TreeViewPara para)`
- `String CreateMseObjFromMSEParaDesignService(CompleteTheData para)`
- `EditGridTitleData GetParaLibTitleData(GridRowTitlePara para)`
- `EditGridTitleData MSEDriverVariableEditListGetParaLibTitleData(GridRowTitlePara para)`
- `Dictionary`2 GetMSEParaLibData(MSEParaDesignParameter para)`
- `String ClearDriverVariableData(MSEParaDesignParameter para)`
- `EditGridTitleData GetAddFailedParaTitleData(GridRowTitlePara para)`
- `EditGridObject GetAddFailedParaData(EditGridDataPara para)`
- `List`1 GetAllParaCheck(ObjectAuthorization para)`

## Hoteam.InforCenter.MSEConfig.Service.dll

### [interface] Hoteam.InforCenter.MSEConfig.Service.IMSEConfigService
- (no public methods)

### [class] Hoteam.InforCenter.MSEConfig.Service.MSEConfigService
- (no public methods)

## Hoteam.InforCenter.OperateLogExtend.Service.dll

### [interface] Hoteam.InforCenter.OperateLogExtend.Service.IOperateLogExtendService
- `GridObject GetOperateLogGrid(OnePageGridDataPara para)`
- `GridObject GetPseItemOperateLogGrid(OnePageGridDataPara para)`
- `GridObject GetNoCodeOperateLogGrid(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.OperateLogExtend.Service.OperateLogExtendService
- `GridObject GetOperateLogGrid(OnePageGridDataPara para)`
- `GridObject GetNoCodeOperateLogGrid(OnePageGridDataPara para)`
- `GridObject GetPseItemOperateLogGrid(OnePageGridDataPara para)`

## Hoteam.InforCenter.CAD.Service.dll

### [class] Hoteam.InforCenter.CAD.Service.CADService
- `ItemRoleCheckResultForCAD CheckItemRole(CADCheckPara para)`
- `String GetViewConfig(CADViewPara para)`
- `List`1 GetModelConfig(CADViewPara para)`
- `List`1 GetPseBomData(ItemInfoPara para)`
- `List`1 GetPSEBomItemDs(ItemInfoPara para)`
- `List`1 GetLightWeightFileMacd2D(ItemInfoPara para)`
- `List`1 GetLightWeightFileMacd3D(ItemInfoPara para)`
- `InfoFileModuleFile GetCADInfoModelFile()`
- `ItemCheckOutInfo CheckOutItem(ItemInfoPara para)`
- `DownLoadFileInfo GetDocByID(CADCheckPara para)`
- `Void UnCheckOut(ItemInfoPara para)`
- `BaseEntityInfo GetModelInfo(CADCheckPara para)`
- `BaseEntityInfo GetItemByCode(CADCheckPara para)`
- `String GetxljFamilyCodeByCode(CADCheckPara para)`
- `List`1 GetMyCheckOutItem(SessionPara para)`
- `String CheckInItemForCAD(CADCheckPara para)`
- `String GetAllDocTypeInfo(SessionPara para)`
- `String GetMasterIDByCode(CADCheckPara para)`
- `List`1 GetQueryViewContidition(CADViewPara para)`
- `List`1 GetQueryViewInfo(CADViewPara para)`
- `List`1 QueryObject(CADQueryPara para)`
- `List`1 QueryItemObject(CADQueryPara para)`
- `List`1 QueryAttribute(CADQueryPara para)`
- `TreeNodeObject GetClassifyStructure(SessionPara para)`
- `List`1 GetAttributeConditionByClassifyID(CADQueryPara para)`
- `List`1 QueryClassifyData(CADQueryPara para)`
- `List`1 GetAllAttribute(SessionPara para)`
- `String GetActionRulePermission(CADCheckPara para)`
- `String IsHaveCADCOnfig(SessionPara para)`
- `List`1 GetBomData(CADBomPara para)`
- `String GetCreatePermissionInType(SessionPara para)`
- `String CheckLoop(CADBomPara para)`
- `BaseInfo GetDefaultPosition(SessionPara para)`
- `String GetLinkPermission(ItemInfoPara para)`
- `String GetItemTypeAndIcon(SessionPara para)`
- `String IsEnableRule(CADQueryPara para)`
- `String GetHighStageState(CADQueryPara para)`
- `String IsAppEnabled(CADViewPara para)`
- `String GetDataSetTypeAndImage(SessionPara para)`
- `String GetLanguageText(CADQueryLanguagePara para)`
- `String GetXLJSwitch(SessionPara para)`
- `List`1 GetPathByItemId(ItemInfoPara para)`
- `List`1 GetFigureDocument(FigureDocumentQueryPara para)`
- `TreeChildData GetTreeChildPseItem(NewTreeViewPara para)`
- `String GetItemIconPath(CADCheckPara para)`
- `String BatchImportForCAD(CADCheckPara para)`
- `String GetItemsInfoByCodes(CADCheckPara para)`
- `String GetItemBomCompare(CADCheckPara para)`
- `String GetWorkSpacePath(CADCheckPara para)`
- `List`1 GetFileNameByItemID(ItemInfoPara para)`
- `String GetMultipleMajorBom(SessionPara para)`
- `String GetMaterialType(ItemInfoPara para)`
- `String CheckForFormula(ItemInfoPara para)`
- `String LoadWeightVariable(MaterialCalculateLoadPagePara para)`
- `BaseEntityInfo QueryBomLine(ItemInfoPara para)`
- `BaseEntityInfo QueryByTableAndName(CADQueryPara para)`
- `String MaterialCalculate(MaterialCalculatePara para)`
- `String GetItemForSelect(CADQueryPara para)`
- `List`1 GetRefItemList(CADCheckPara para)`
- `List`1 GetRefDocList(CADCheckPara para)`
- `List`1 GetAssociatedDocList(CADCheckPara para)`
- `String GetRefDocListByItemCodes(CADBatchGetRefOrAssoDocListPara para)`
- `String GetAssociatedDocListByItemCodes(CADBatchGetRefOrAssoDocListPara para)`
- `String GetDocInfoByDocIds(CADBatchGetDocListPara para)`
- `String GetReferenceItemInfoByItemIds(CADBatchGetReferenceItemListPara para)`
- `String GetRefItemListByItemCodes(CADBatchGetRefItemListPara para)`
- `String GetMainModelFileInfoByItemCodes(CADBatchImportCheckPara para)`
- `ItemRoleCheckResultForCAD GetItemRelationDocRole(CADCheckPara para)`
- `String GetCreatePermissionByEntityTypes(CADCreatePermissionPara para)`
- `String GetNewestModelFileInfo(CadFileVerModelPara para)`
- `List`1 GetDatasetsByItemCode(ItemInfoPara para)`
- `Void CreateLogInPDM(CADCheckPara para)`
- `Void RecordLogForCad(CADCheckPara para)`

### [class] Hoteam.InforCenter.CAD.Service.CADLanguageInfo
- (no public methods)

### [interface] Hoteam.InforCenter.CAD.Service.ICADService
- `ItemRoleCheckResultForCAD CheckItemRole(CADCheckPara para)`
- `String GetViewConfig(CADViewPara para)`
- `List`1 GetModelConfig(CADViewPara para)`
- `List`1 GetPseBomData(ItemInfoPara para)`
- `List`1 GetPSEBomItemDs(ItemInfoPara para)`
- `InfoFileModuleFile GetCADInfoModelFile()`
- `ItemCheckOutInfo CheckOutItem(ItemInfoPara para)`
- `BaseEntityInfo GetModelInfo(CADCheckPara para)`
- `List`1 GetMyCheckOutItem(SessionPara para)`
- `BaseEntityInfo GetItemByCode(CADCheckPara para)`
- `Void UnCheckOut(ItemInfoPara para)`
- `DownLoadFileInfo GetDocByID(CADCheckPara para)`
- `String CheckInItemForCAD(CADCheckPara para)`
- `String GetAllDocTypeInfo(SessionPara para)`
- `String GetMasterIDByCode(CADCheckPara para)`
- `List`1 GetQueryViewContidition(CADViewPara para)`
- `List`1 GetQueryViewInfo(CADViewPara para)`
- `List`1 QueryObject(CADQueryPara para)`
- `List`1 QueryAttribute(CADQueryPara para)`
- `TreeNodeObject GetClassifyStructure(SessionPara para)`
- `List`1 GetAttributeConditionByClassifyID(CADQueryPara para)`
- `List`1 QueryClassifyData(CADQueryPara para)`
- `List`1 GetAllAttribute(SessionPara para)`
- `String GetActionRulePermission(CADCheckPara para)`
- `String IsHaveCADCOnfig(SessionPara para)`
- `List`1 GetBomData(CADBomPara para)`
- `String GetCreatePermissionInType(SessionPara para)`
- `String CheckLoop(CADBomPara para)`
- `BaseInfo GetDefaultPosition(SessionPara para)`
- `String GetLinkPermission(ItemInfoPara para)`
- `String GetItemTypeAndIcon(SessionPara para)`
- `String IsEnableRule(CADQueryPara para)`
- `String GetHighStageState(CADQueryPara para)`
- `String IsAppEnabled(CADViewPara para)`
- `String GetDataSetTypeAndImage(SessionPara para)`
- `List`1 QueryItemObject(CADQueryPara para)`
- `String GetLanguageText(CADQueryLanguagePara para)`
- `String GetXLJSwitch(SessionPara para)`
- `String GetxljFamilyCodeByCode(CADCheckPara para)`
- `List`1 GetPathByItemId(ItemInfoPara para)`
- `List`1 GetLightWeightFileMacd2D(ItemInfoPara para)`
- `List`1 GetLightWeightFileMacd3D(ItemInfoPara para)`
- `List`1 GetFigureDocument(FigureDocumentQueryPara para)`
- `TreeChildData GetTreeChildPseItem(NewTreeViewPara para)`
- `String GetItemIconPath(CADCheckPara para)`
- `String BatchImportForCAD(CADCheckPara para)`
- `String GetItemBomCompare(CADCheckPara para)`
- `String GetItemsInfoByCodes(CADCheckPara para)`
- `String GetWorkSpacePath(CADCheckPara para)`
- `List`1 GetFileNameByItemID(ItemInfoPara para)`
- `String GetMultipleMajorBom(SessionPara para)`
- `String GetMaterialType(ItemInfoPara para)`
- `String CheckForFormula(ItemInfoPara para)`
- `String LoadWeightVariable(MaterialCalculateLoadPagePara para)`
- `BaseEntityInfo QueryBomLine(ItemInfoPara para)`
- `BaseEntityInfo QueryByTableAndName(CADQueryPara para)`
- `String MaterialCalculate(MaterialCalculatePara para)`
- `String GetItemForSelect(CADQueryPara para)`
- `List`1 GetRefItemList(CADCheckPara para)`
- `List`1 GetRefDocList(CADCheckPara para)`
- `List`1 GetAssociatedDocList(CADCheckPara para)`
- `String GetRefDocListByItemCodes(CADBatchGetRefOrAssoDocListPara para)`
- `String GetAssociatedDocListByItemCodes(CADBatchGetRefOrAssoDocListPara para)`
- `String GetDocInfoByDocIds(CADBatchGetDocListPara para)`
- `String GetReferenceItemInfoByItemIds(CADBatchGetReferenceItemListPara para)`
- `String GetRefItemListByItemCodes(CADBatchGetRefItemListPara para)`
- `String GetMainModelFileInfoByItemCodes(CADBatchImportCheckPara para)`
- `ItemRoleCheckResultForCAD GetItemRelationDocRole(CADCheckPara para)`
- `String GetCreatePermissionByEntityTypes(CADCreatePermissionPara para)`
- `String GetNewestModelFileInfo(CadFileVerModelPara para)`
- `List`1 GetDatasetsByItemCode(ItemInfoPara para)`
- `Void CreateLogInPDM(CADCheckPara para)`
- `Void RecordLogForCad(CADCheckPara para)`

## Hoteam.InforCenter.CADCIS.Service.dll

### [class] Hoteam.InforCenter.CADCIS.Service.CisService
- `Boolean CheckPseItemExist(CisPara para)`
- `GridObject GetCISContentListOnePageData(OnePageGridDataPara para)`
- `GridTitleData GetCISListTitle(GridRowTitlePara para)`
- `GridObject GetEleItemListOnePageData(OnePageGridDataPara para)`
- `Boolean RaiseUpCISById(CisPara para)`
- `Boolean AbandonCISById(CisPara para)`
- `String DeleteCISById(CisPara para)`
- `String GetPseItemNameByCode(CisPara para)`
- `Boolean CheckPseItemIsRelatedCIS(CisPara para)`
- `Boolean CheckPseItemIsExist(CisPara para)`
- `CisResult CheckCisCanSave(CisPara para)`
- `Boolean CheckSpecHasExist(CisPara para)`
- `CisResult SaveCIS(CisPara para)`
- `GridTitleData GetImportCisTitleData(GridRowTitlePara para)`
- `GridTitleData GetImportCisExistTitleData(GridRowTitlePara para)`
- `GridObject GetImportCisCompareData(OnePageGridDataPara para)`
- `GridObject GetImportCisData(ImportWcfPara para)`
- `String ImportCisCheckData(ImportCheckPara para)`
- `AddLinkMessage ImportCis(CisImportPara para)`
- `String GetItemViewType(CisPara para)`
- `String GetItemViewId(CisPara para)`
- `AddLinkMessage RemoveBOM(EleBomlinePara para)`
- `AddLinkMessage GenerateBOM(EleBomlinePara para)`
- `String SaveEleItemRelation(ElePara para)`
- `List`1 GetAllCISData(CADCheckPara para)`
- `String GetPseItemELastInsertEID(ElePara para)`
- `List`1 GetEleItemRelationRet(ElePara para)`
- `TreeRootData GetOlbTreeRoot(TreeViewPara para)`
- `List`1 GetOlbFileAllNode(SessionPara para)`
- `List`1 GetSchematicData(CisPara para)`
- `List`1 GetSchematicPartData(SchematicPara para)`
- `String SaveLibCisSchematic(CADCheckPara para)`
- `String SaveLibCisSchematicWithVersion(CADCheckPara para)`
- `String CheckOlbSchematic(CADCheckPara para)`
- `Void UploadLibFile(CADCheckPara para)`
- `String GetAllLibInfos(CADCheckPara para)`
- `Void SaveMaterialData(CADCheckPara para)`
- `String GetAllCisType(CADCheckPara para)`
- `String GetOlbfileCreatePermission(SessionPara para)`
- `List`1 DownLoadOlbFileById(CisPara para)`
- `Boolean CheckOlbFileExists(CisPara para)`
- `Dictionary`2 GetCisByItemCodes(CisComparePara para)`
- `Dictionary`2 GetCisBySpecCodes(CisComparePara para)`

### [interface] Hoteam.InforCenter.CADCIS.Service.ICisService
- `GridObject GetCISContentListOnePageData(OnePageGridDataPara para)`
- `GridTitleData GetCISListTitle(GridRowTitlePara para)`
- `Boolean CheckPseItemExist(CisPara para)`
- `Boolean RaiseUpCISById(CisPara para)`
- `String DeleteCISById(CisPara para)`
- `Boolean AbandonCISById(CisPara para)`
- `String GetPseItemNameByCode(CisPara para)`
- `Boolean CheckSpecHasExist(CisPara para)`
- `Boolean CheckPseItemIsRelatedCIS(CisPara para)`
- `Boolean CheckPseItemIsExist(CisPara para)`
- `CisResult CheckCisCanSave(CisPara para)`
- `CisResult SaveCIS(CisPara para)`
- `GridTitleData GetImportCisTitleData(GridRowTitlePara para)`
- `GridObject GetImportCisData(ImportWcfPara para)`
- `String ImportCisCheckData(ImportCheckPara para)`
- `AddLinkMessage ImportCis(CisImportPara para)`
- `GridObject GetEleItemListOnePageData(OnePageGridDataPara para)`
- `String SaveEleItemRelation(ElePara para)`
- `String GetItemViewType(CisPara para)`
- `String GetItemViewId(CisPara para)`
- `AddLinkMessage RemoveBOM(EleBomlinePara para)`
- `AddLinkMessage GenerateBOM(EleBomlinePara para)`
- `List`1 GetEleItemRelationRet(ElePara para)`
- `String GetPseItemELastInsertEID(ElePara para)`
- `TreeRootData GetOlbTreeRoot(TreeViewPara para)`
- `List`1 GetOlbFileAllNode(SessionPara para)`
- `List`1 GetSchematicData(CisPara para)`
- `List`1 GetSchematicPartData(SchematicPara para)`
- `String SaveLibCisSchematic(CADCheckPara para)`
- `String GetAllLibInfos(CADCheckPara para)`
- `Void SaveMaterialData(CADCheckPara para)`
- `List`1 GetAllCISData(CADCheckPara para)`
- `Void UploadLibFile(CADCheckPara para)`
- `String GetAllCisType(CADCheckPara para)`
- `String GetOlbfileCreatePermission(SessionPara para)`
- `List`1 DownLoadOlbFileById(CisPara para)`
- `String CheckOlbSchematic(CADCheckPara para)`
- `Boolean CheckOlbFileExists(CisPara para)`
- `GridTitleData GetImportCisExistTitleData(GridRowTitlePara para)`
- `Dictionary`2 GetCisByItemCodes(CisComparePara para)`
- `Dictionary`2 GetCisBySpecCodes(CisComparePara para)`
- `GridObject GetImportCisCompareData(OnePageGridDataPara para)`

## Hoteam.InforCenter.ChangeApply.Service.dll

### [class] Hoteam.InforCenter.ChangeApply.Service.ApplyService
- `String SaveApplyObject(ApplyInfoPara para)`
- `GridObject GetReceivedApplyList(ApplyInfoPara para)`
- `GridRowsObject GetReceivedApplyCount(SessionPara para)`

### [interface] Hoteam.InforCenter.ChangeApply.Service.IApplyService
- `String SaveApplyObject(ApplyInfoPara para)`
- `GridObject GetReceivedApplyList(ApplyInfoPara para)`
- `GridRowsObject GetReceivedApplyCount(SessionPara para)`

## Hoteam.InforCenter.ChangePlugin.Service.dll

### [class] Hoteam.InforCenter.ChangePlugin.Service.ChangePluginService
- `List`1 GetDealWithOpinion(ChangePluginPara para)`
- `String SaveDealWithOpinion(ChangePluginPara para)`

### [interface] Hoteam.InforCenter.ChangePlugin.Service.IChangePluginService
- `List`1 GetDealWithOpinion(ChangePluginPara para)`
- `String SaveDealWithOpinion(ChangePluginPara para)`

## Hoteam.InforCenter.ChangeNotice.Service.dll

### [interface] Hoteam.InforCenter.ChangeNotice.Service.INoticeService
- `String SaveNoticeObject(NoticeInfoPara para)`
- `GridObject GetReceivedNoticeList(NoticeInfoPara para)`
- `GridRowsObject GetReceivedNoticeCount(SessionPara para)`

### [class] Hoteam.InforCenter.ChangeNotice.Service.NoticeService
- `String SaveNoticeObject(NoticeInfoPara para)`
- `GridObject GetReceivedNoticeList(NoticeInfoPara para)`
- `GridRowsObject GetReceivedNoticeCount(SessionPara para)`

## Hoteam.InforCenter.ChangeProblem.Service.dll

### [interface] Hoteam.InforCenter.ChangeProblem.Service.IProblemService
- `String SaveProblem(ProblemPara para)`
- `String GetDocImgiconType(ProblemPara para)`
- `GridObject GetReceivedProblemList(ProblemPara para)`
- `GridRowsObject GetReceivedProblemCount(SessionPara para)`

### [class] Hoteam.InforCenter.ChangeProblem.Service.ProblemService
- `String SaveProblem(ProblemPara para)`
- `String GetDocImgiconType(ProblemPara para)`
- `GridObject GetReceivedProblemList(ProblemPara para)`
- `GridRowsObject GetReceivedProblemCount(SessionPara para)`

## Hoteam.InforCenter.ChangeRelation.Service.dll

### [class] Hoteam.InforCenter.ChangeRelation.Service.ChangeRelationService
- `Dictionary`2 GetRelationByObjectID(ChangeRelationPara para)`
- `GridObject GetChangeTrackListData(OnePageGridDataPara para)`
- `String GetChangeTrackPicData(ChangeRelationPara para)`
- `String CheckExistInChange(ChangeRelationPara para)`
- `Dictionary`2 GetItemAndPreItem(ChangeRelationPara para)`
- `List`1 GetProblemItemObjectByChangeObjectID(ChangeRelationPara para)`
- `Void SaveRelation(ChangeRelationPara para)`
- `Void CheckTask(ChangeRelationPara para)`
- `Boolean CheckHasProAndEffectItem(ChangeRelationPara para)`
- `Void AddRelateChange(ChangeRelationPara para)`

### [interface] Hoteam.InforCenter.ChangeRelation.Service.IChangeRelationService
- `Dictionary`2 GetRelationByObjectID(ChangeRelationPara para)`
- `GridObject GetChangeTrackListData(OnePageGridDataPara para)`
- `String GetChangeTrackPicData(ChangeRelationPara para)`
- `String CheckExistInChange(ChangeRelationPara para)`
- `Dictionary`2 GetItemAndPreItem(ChangeRelationPara para)`
- `List`1 GetProblemItemObjectByChangeObjectID(ChangeRelationPara para)`
- `Void SaveRelation(ChangeRelationPara para)`
- `Void CheckTask(ChangeRelationPara para)`
- `Boolean CheckHasProAndEffectItem(ChangeRelationPara para)`
- `Void AddRelateChange(ChangeRelationPara para)`

## Hoteam.InforCenter.ClassifyAttrbute.Service.dll

### [class] Hoteam.InforCenter.ClassifyAttrbute.Service.AttributeService
- `Void RemoveAttributeByCEID(AttributeLinkPara para)`
- `Void MoveAttributeUp(AttributeLinkPara para)`
- `Void MoveAttributeDown(AttributeLinkPara para)`
- `String GetAttributeCode(SessionPara para)`
- `Void DeleteChildAttribute(AttributeLinkPara para)`
- `GridTitleData GetImportExcelTitlData(AttributeLinkPara para)`
- `Boolean CheckImportTemplateFormat(ImportCheckPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `String ClassifyCreateSave(ClassifyAttrbutePara para)`
- `Boolean CheckLOVData(ClassifyAttrbutePara para)`
- `String CheckAttributeQuote(AttributeLinkPara para)`
- `String SaveOwnLOV(OwnAttributeAddPara para)`
- `String DeleteOwnLovByClassifyID(OwnAttributeAddPara para)`
- `ReturnMessage AddAttribute(AddAttribute para)`
- `ReturnMessage ClassifyViewAddAttribute(AddAttribute para)`
- `Dictionary`2 GetOwnLOVList(OwnAttributeAddPara para)`
- `String UpdateClassifyViewOwnLOV(ClassifyAttrPara para)`
- `ReturnMessage CheckRepeatOwnLov(ClassifyAttrOfOwnLov para)`
- `String SaveOrUpdateOwnLOVData(ClassifyAttrOfOwnLov para)`
- `String DeleteOwnLov(ClassifyAttrOfOwnLov para)`
- `Int32 ClassifyMInt(ClassifyAttrbutePara para)`
- `Dictionary`2 ClassifyAttributeCgt(ClassifyAttrbutePara para)`
- `Dictionary`2 GetDBEnumerationItem(GetLovPara para)`
- `GridObject GetOnePageGridData(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.ClassifyAttrbute.Service.IAttributeService
- `Void RemoveAttributeByCEID(AttributeLinkPara para)`
- `Void MoveAttributeUp(AttributeLinkPara para)`
- `Void MoveAttributeDown(AttributeLinkPara para)`
- `String GetAttributeCode(SessionPara para)`
- `Void DeleteChildAttribute(AttributeLinkPara para)`
- `GridTitleData GetImportExcelTitlData(AttributeLinkPara para)`
- `Boolean CheckImportTemplateFormat(ImportCheckPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `String ClassifyCreateSave(ClassifyAttrbutePara para)`
- `Boolean CheckLOVData(ClassifyAttrbutePara para)`
- `String CheckAttributeQuote(AttributeLinkPara para)`
- `String SaveOwnLOV(OwnAttributeAddPara para)`
- `String DeleteOwnLovByClassifyID(OwnAttributeAddPara para)`
- `ReturnMessage AddAttribute(AddAttribute para)`
- `ReturnMessage ClassifyViewAddAttribute(AddAttribute para)`
- `Dictionary`2 GetOwnLOVList(OwnAttributeAddPara para)`
- `String UpdateClassifyViewOwnLOV(ClassifyAttrPara para)`
- `ReturnMessage CheckRepeatOwnLov(ClassifyAttrOfOwnLov para)`
- `String SaveOrUpdateOwnLOVData(ClassifyAttrOfOwnLov para)`
- `String DeleteOwnLov(ClassifyAttrOfOwnLov para)`
- `Int32 ClassifyMInt(ClassifyAttrbutePara para)`
- `Dictionary`2 ClassifyAttributeCgt(ClassifyAttrbutePara para)`
- `Dictionary`2 GetDBEnumerationItem(GetLovPara para)`
- `GridObject GetOnePageGridData(OnePageGridDataPara para)`

## Hoteam.InforCenter.ClassifyEdit.Service.dll

### [class] Hoteam.InforCenter.ClassifyEdit.Service.ClassifyEditService
- `AddLinkMessage CheckChildType(ClassifyEditPara para)`
- `String GetGroupCode(ClassifyEditPara para)`
- `Void SaveSerialNum(ClassifyEditPara para)`
- `Boolean CheckStoredClass(ClassifyEditPara para)`
- `Boolean CheckCodeUnique(ClassifyEditPara para)`
- `String SaveClassifyInfo(ClassifyPastePara para)`
- `Dictionary`2 InitChildListCode(ClassifyPastePara para)`
- `List`1 GetAllStoredClass(SessionPara para)`
- `List`1 QueryClassify(ClassifyEditPara para)`
- `String SaveClassifyView(ClassifyEditPara para)`
- `Boolean CheckRelatedCodePath(ClassifyEditPara para)`
- `Dictionary`2 GetItemTypesByType(ClassifyEditPara para)`
- `String GetClassByPathName(ClassifyEditPara para)`
- `Dictionary`2 GetAttributeDefaultData(ClassifyEditPara para)`
- `GridTitleData GetImportClassifyStructureTitleData(GridRowTitlePara para)`
- `GridObject GetImportClassifyStructureData(ImportClassifyStructurePara para)`
- `ImportCheckResult ImportClassifyStructureCheckData(ImportClassifyStructurePara para)`
- `Boolean GeneratedClassifyData(ClassifyEditPara para)`
- `String CodeKindGenerateCheck(CodeKindGeneratePara para)`
- `AddLinkMessage ImportClassifyStructure(ImportClassifyStructurePara para)`
- `ExcelExportTemplateDataModel ExportExcelClassifyStructure(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.ClassifyEdit.Service.IClassifyEditService
- `String GetGroupCode(ClassifyEditPara para)`
- `Void SaveSerialNum(ClassifyEditPara para)`
- `Boolean CheckStoredClass(ClassifyEditPara para)`
- `Boolean CheckCodeUnique(ClassifyEditPara para)`
- `AddLinkMessage CheckChildType(ClassifyEditPara para)`
- `String SaveClassifyInfo(ClassifyPastePara para)`
- `Dictionary`2 InitChildListCode(ClassifyPastePara para)`
- `List`1 GetAllStoredClass(SessionPara para)`
- `List`1 QueryClassify(ClassifyEditPara para)`
- `String SaveClassifyView(ClassifyEditPara para)`
- `Boolean CheckRelatedCodePath(ClassifyEditPara para)`
- `Dictionary`2 GetItemTypesByType(ClassifyEditPara para)`
- `String GetClassByPathName(ClassifyEditPara para)`
- `Dictionary`2 GetAttributeDefaultData(ClassifyEditPara para)`
- `GridTitleData GetImportClassifyStructureTitleData(GridRowTitlePara para)`
- `GridObject GetImportClassifyStructureData(ImportClassifyStructurePara para)`
- `ImportCheckResult ImportClassifyStructureCheckData(ImportClassifyStructurePara para)`
- `Boolean GeneratedClassifyData(ClassifyEditPara para)`
- `String CodeKindGenerateCheck(CodeKindGeneratePara para)`
- `AddLinkMessage ImportClassifyStructure(ImportClassifyStructurePara para)`
- `ExcelExportTemplateDataModel ExportExcelClassifyStructure(OnePageGridDataPara para)`

## Hoteam.InforCenter.ClassifyUse.Service.dll

### [class] Hoteam.InforCenter.ClassifyUse.Service.ClassifyUseService
- `GridTitleData GetClassifyObjectTitle(GridRowTitlePara para)`
- `GridTitleData GetClassifyObjectImportTitle(GridRowTitlePara para)`
- `ExcelExportData ImportClassifyObjectTemplate(ClassifyPara para)`
- `GridObject GetClassifyObjectImportData(ImportWcfPara para)`
- `String ImportClassifyObjectCheckData(ClassifyObjectImportPara para)`
- `AddLinkMessage ImportClassifyObject(ClassifyObjectImportPara para)`
- `ExcelExportData ExportClassifyObject(ClassifyPara para)`
- `GridObject GetClassifyObjectData(OnePageGridDataPara para)`
- `Boolean SaveClassifyObjectProperty(ClassifyPara para)`
- `Boolean SaveClassifyObjectAttr(ClassifyPara para)`
- `List`1 GetClassifyByObjectID(ClassifyPara para)`
- `GridObject GetClassifyDataTimeStatData(CustomGridDataPara para)`
- `GridObject GetClassifyDataTimeClassStatData(CustomGridDataPara para)`
- `GridObject GetClassifyUseStatData(CustomGridDataPara para)`
- `List`1 GetStoredClassByFilter(ClassifyPara para)`
- `GridObject QueryClassifyData(CustomGridDataPara para)`
- `List`1 InitObjectAttributeData(ClassifyPara para)`
- `Boolean SaveClassifyObject(ClassifyPara para)`
- `Void RemoveClassifyObject(ClassifyPara para)`
- `List`1 GetClassCurAttribute(ClassifyObjectPara para)`
- `Dictionary`2 GetAttributeDataAndClassify(ClassifyObjectPara para)`
- `String GetAttributeClassifyType(ClassifyObjectPara para)`
- `Void SaveClassifyCommonQuery(CommonQueryPara para)`
- `EditGridRowTitleData GetBatchEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchEditGridData(EditGridDataPara para)`
- `Boolean SaveBatchEditData(ClassifyPara para)`
- `GridObject SortData(CustomGridDataPara para)`
- `List`1 GetQueryViewColumnInfo(GridRowTitlePara para)`
- `List`1 GetClassCurAttributes(ClassifyObjectPara para)`
- `List`1 GetClassCurPseAttributes(ClassifyObjectPara para)`
- `GridTitleData GetClassifyObjectTitleForObjectQuery(GridRowTitlePara para)`
- `GridObject QueryClassifyDataForObjectQuery(CustomGridDataPara para)`
- `List`1 GetClassCurCanBrowseAttributes(ClassifyObjectPara para)`
- `GridObject GetClassCurAttributesView(ClassifyObjectPara para)`
- `List`1 GetObjectByFilterInfo(ObjectFilterPara para)`

### [interface] Hoteam.InforCenter.ClassifyUse.Service.IClassifyUseService
- `GridTitleData GetClassifyObjectTitle(GridRowTitlePara para)`
- `GridTitleData GetClassifyObjectImportTitle(GridRowTitlePara para)`
- `ExcelExportData ImportClassifyObjectTemplate(ClassifyPara para)`
- `GridObject GetClassifyObjectImportData(ImportWcfPara para)`
- `String ImportClassifyObjectCheckData(ClassifyObjectImportPara para)`
- `AddLinkMessage ImportClassifyObject(ClassifyObjectImportPara para)`
- `ExcelExportData ExportClassifyObject(ClassifyPara para)`
- `GridObject GetClassifyObjectData(OnePageGridDataPara para)`
- `Boolean SaveClassifyObjectProperty(ClassifyPara para)`
- `List`1 GetClassifyByObjectID(ClassifyPara para)`
- `GridObject GetClassifyDataTimeStatData(CustomGridDataPara para)`
- `GridObject GetClassifyDataTimeClassStatData(CustomGridDataPara para)`
- `GridObject GetClassifyUseStatData(CustomGridDataPara para)`
- `List`1 GetStoredClassByFilter(ClassifyPara para)`
- `GridObject QueryClassifyData(CustomGridDataPara para)`
- `List`1 InitObjectAttributeData(ClassifyPara para)`
- `Boolean SaveClassifyObject(ClassifyPara para)`
- `Void RemoveClassifyObject(ClassifyPara para)`
- `List`1 GetClassCurAttribute(ClassifyObjectPara para)`
- `Dictionary`2 GetAttributeDataAndClassify(ClassifyObjectPara para)`
- `String GetAttributeClassifyType(ClassifyObjectPara para)`
- `Void SaveClassifyCommonQuery(CommonQueryPara para)`
- `EditGridRowTitleData GetBatchEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchEditGridData(EditGridDataPara para)`
- `Boolean SaveBatchEditData(ClassifyPara para)`
- `GridObject SortData(CustomGridDataPara para)`
- `List`1 GetQueryViewColumnInfo(GridRowTitlePara para)`
- `List`1 GetClassCurAttributes(ClassifyObjectPara para)`
- `List`1 GetClassCurPseAttributes(ClassifyObjectPara para)`
- `GridTitleData GetClassifyObjectTitleForObjectQuery(GridRowTitlePara para)`
- `GridObject QueryClassifyDataForObjectQuery(CustomGridDataPara para)`
- `GridObject GetClassCurAttributesView(ClassifyObjectPara para)`
- `List`1 GetObjectByFilterInfo(ObjectFilterPara para)`
- `Boolean SaveClassifyObjectAttr(ClassifyPara para)`

## Hoteam.InforCenter.PDMInternalMail.Service.dll

### [interface] Hoteam.InforCenter.PDMInternalMail.Service.IPDMInternalMail
- `GridObject GetWorkflowInformData(OnePageGridDataPara para)`
- `TreeChildData GetInternalMailTreeChildData(TreeViewPara para)`
- `String GetInternalMailCountStr(TreeViewPara para)`
- `GridObject GetInternalMailListData(OnePageGridDataPara para)`
- `Boolean RemoveSystemClassificationMailToDustbin(PDMInternalMailPara para)`

### [class] Hoteam.InforCenter.PDMInternalMail.Service.PDMInternalMail
- `GridObject GetWorkflowInformData(OnePageGridDataPara para)`
- `TreeChildData GetInternalMailTreeChildData(TreeViewPara para)`
- `String GetInternalMailCountStr(TreeViewPara para)`
- `GridObject GetInternalMailListData(OnePageGridDataPara para)`
- `Boolean RemoveSystemClassificationMailToDustbin(PDMInternalMailPara para)`

## Hoteam.InforCenter.Statistics.Service.dll

### [class] Hoteam.InforCenter.Statistics.Service.StatisticsService
- `List`1 GetObjectTreeNode(GetTreeDataPara para)`
- `List`1 GetQueryMachineTreeChildNode(TreeViewPara para)`
- `List`1 GetQueryMachineTreeRootNode(TreeViewPara para)`
- `GetShowViewModel GetShowViewData(ShowViewPara para)`
- `StatisticsDataModel GetPLMStatisticsData(PLMStatisticsPara para)`
- `Dictionary`2 GetDefalutViewCols(SessionPara para)`
- `EditGridColDataObject GetEditGridColDataByObjectName(GetObjectTypePara para)`
- `String SaveShowViewData(ShowViewPara para)`
- `String SavePLMStatisticsData(PLMStatisticsPara para)`
- `GridTitleData GetShowStatisticsGridTitle(GridRowTitlePara para)`
- `GridObject GetShowStatisticsGridPicData(OnePageGridDataPara para)`
- `GridObject GetShowStatisticsGridOnePageData(OnePageGridDataPara para)`
- `TreeRootData GetShowStatisticsTreeRootNode(TreeViewPara para)`
- `List`1 GetShowStatisticsTreeChildNode(TreeViewPara para)`
- `Boolean CheckHasChildNode(PLMStatisticsPara para)`
- `Boolean CheckPastePLMStatisticsData(PLMStatisticsPara para)`
- `Dictionary`2 GetModelColumns(PLMStatisticsPara para)`

## Hoteam.InforCenter.WorkFlowExtend.Service.dll

### [interface] Hoteam.InforCenter.WorkFlowExtend.Service.IWorkFlowService
- `Boolean ChangeWrokflowStateSave(ChangeWorkflowStatePara para)`
- `List`1 GetWorkFlowStateDropDown(ChangeWorkflowStatePara para)`
- `EditGridObject GetWorkflowInform(WorkflowViewPara para)`
- `PlmWorkflowResultModel GetWorkFlowChildListData(GetWorkFlowChildListPara para)`
- `GetWorkFlowPara GetWorkFlowChildListObjectId(GetWorkFlowChildListPara para)`
- `PlmWorkflowResultModel GetWorkFlowChildListOneData(GetWorkFlowChildOneListPara para)`
- `Boolean SaveEditWorkflow(EditWorkflowPara para)`
- `PlmWorkflowResultModel GetGridObjectForIds(GetGridObjectForIDsPara para)`
- `List`1 GetGridRowObjectListForIds(GetGridObjectForIDsPara para)`
- `WorkFlowActorData GetFlowActorEditData(WorkFlowActorPara para)`
- `PlmWorkflowResultModel PlmStartWorkflow(PlmStartWorkflowPara para)`
- `PlmWorkflowResultModel GetChildDataToDestNode(FolwCheckInfoPara para)`
- `PlmWorkflowResultModel StartWorkCheckAttach(FolwCheckInfoPara para)`
- `TemplateLsitModel GetTempAndClassifyListModel(GetWorkFlowAndClassifyPara para)`
- `TemplateLsitModel GetTempListForClassify(GetWorkFlowAndClassifyPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowId(WorkFlowAuditPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowIdLook(WorkFlowAuditPara para)`
- `String GetWorkflowTemplateExtendProperty(GetWorkflowTemplateInforPara para)`
- `EditGridRowTitleObject GerEditGridForRelateModel(SessionPara para)`
- `EditGridObject GetEditGridDataForRelateModel(PLMTemplatePara para)`
- `Boolean CheckCanEditMyWorkflow(WorkFlowAuditPara para)`
- `Boolean DeleteMyWorkflow(WorkFlowAuditPara para)`
- `Boolean PLMStartWorkflowCheck(PLMWorkflowPara para)`
- `GridObject GetWorkflowTaskMainFlat(SessionPara para)`
- `PLMStartWorkflowResult PLMFinishWorkflowCheck(PLMWorkflowPara para)`
- `Boolean UpdateWorkflowStateCheck(PLMWorkflowPara para)`
- `Boolean CheckCanDeleteMyWorkflow(WorkFlowAuditPara para)`
- `EditGridObject GetWorkflowPlaceOnFile(PLMWorkflowPara para)`
- `Boolean MarkAttach(ProblemMarkerPara para)`
- `List`1 GetWorkFlowTemplate(SessionPara para)`
- `String GetNewWorkFlowCode(SessionPara para)`
- `String CheckWorkFlowCodeExist(PLMWorkflowPara para)`
- `String SaveWorkFlowCode(PLMWorkflowPara para)`
- `Void CheckFormObjectCanStartworkflow(PLMWorkflowPara para)`
- `Boolean RemoveChildList(EditWorkflowPara para)`
- `Boolean CheckCanRemoveChildList(WorkFlowAuditPara para)`
- `List`1 GetAllObjectEID(EditWorkflowPara para)`
- `String GetIsAllowChange(WorkFlowActorPara para)`
- `GridObject GetWorkflowDataByFilter(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.WorkFlowExtend.Service.WorkFlowService
- `Boolean ChangeWrokflowStateSave(ChangeWorkflowStatePara para)`
- `List`1 GetWorkFlowStateDropDown(ChangeWorkflowStatePara para)`
- `EditGridObject GetWorkflowInform(WorkflowViewPara para)`
- `PlmWorkflowResultModel GetWorkFlowChildListData(GetWorkFlowChildListPara para)`
- `GetWorkFlowPara GetWorkFlowChildListObjectId(GetWorkFlowChildListPara para)`
- `PlmWorkflowResultModel GetWorkFlowChildListOneData(GetWorkFlowChildOneListPara para)`
- `PlmWorkflowResultModel GetGridObjectForIds(GetGridObjectForIDsPara para)`
- `List`1 GetGridRowObjectListForIds(GetGridObjectForIDsPara para)`
- `PlmWorkflowResultModel StartWorkCheckAttach(FolwCheckInfoPara para)`
- `PlmWorkflowResultModel GetChildDataToDestNode(FolwCheckInfoPara para)`
- `TemplateLsitModel GetTempAndClassifyListModel(GetWorkFlowAndClassifyPara para)`
- `TemplateLsitModel GetTempListForClassify(GetWorkFlowAndClassifyPara para)`
- `WorkFlowActorData GetFlowActorEditData(WorkFlowActorPara para)`
- `PlmWorkflowResultModel PlmStartWorkflow(PlmStartWorkflowPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowId(WorkFlowAuditPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowIdLook(WorkFlowAuditPara para)`
- `String GetWorkflowTemplateExtendProperty(GetWorkflowTemplateInforPara para)`
- `EditGridRowTitleObject GerEditGridForRelateModel(SessionPara para)`
- `EditGridObject GetEditGridDataForRelateModel(PLMTemplatePara para)`
- `Boolean CheckCanEditMyWorkflow(WorkFlowAuditPara para)`
- `Boolean CheckCanDeleteMyWorkflow(WorkFlowAuditPara para)`
- `Boolean SaveEditWorkflow(EditWorkflowPara para)`
- `Boolean DeleteMyWorkflow(WorkFlowAuditPara para)`
- `Boolean PLMStartWorkflowCheck(PLMWorkflowPara para)`
- `PLMStartWorkflowResult PLMFinishWorkflowCheck(PLMWorkflowPara para)`
- `GridObject GetWorkflowTaskMainFlat(SessionPara para)`
- `EditGridObject GetWorkflowPlaceOnFile(PLMWorkflowPara para)`
- `Boolean UpdateWorkflowStateCheck(PLMWorkflowPara para)`
- `Boolean MarkAttach(ProblemMarkerPara para)`
- `List`1 GetWorkFlowTemplate(SessionPara para)`
- `String GetNewWorkFlowCode(SessionPara para)`
- `String CheckWorkFlowCodeExist(PLMWorkflowPara para)`
- `String SaveWorkFlowCode(PLMWorkflowPara para)`
- `Void CheckFormObjectCanStartworkflow(PLMWorkflowPara para)`
- `Boolean RemoveChildList(EditWorkflowPara para)`
- `Boolean CheckCanRemoveChildList(WorkFlowAuditPara para)`
- `List`1 GetAllObjectEID(EditWorkflowPara para)`
- `String GetIsAllowChange(WorkFlowActorPara para)`
- `GridObject GetWorkflowDataByFilter(OnePageGridDataPara para)`

## Hoteam.InforCenter.PositionManager.Service.dll

### [interface] Hoteam.InforCenter.PositionManager.Service.IPositionManagerService
- `EditGridTitleData GetRecordObjectTitle(GridRowTitlePara para)`
- `EditGridObject GetRecordObjectData(EditGridDataPara para)`
- `Void MoveAttributeUp(PositionRelationPara para)`
- `Void MoveAttributeDown(PositionRelationPara para)`
- `List`1 GetRouteViewTreeData(PositionRelationPara para)`
- `GridObject RouteQueryStatisticsListData(OnePageGridDataPara para)`
- `GridObject BomQueryData(OnePageGridDataPara para)`
- `GridObject GetItemRoute(OnePageGridDataPara para)`
- `GridObject GetRouteBatchEditData(OnePageGridDataPara para)`
- `String GetGMPositionUnitEids(SessionPara para)`
- `String PositionUnitDeleteCheck(PositionRelationPara para)`

### [class] Hoteam.InforCenter.PositionManager.Service.PositionManagerService
- `EditGridTitleData GetRecordObjectTitle(GridRowTitlePara para)`
- `EditGridObject GetRecordObjectData(EditGridDataPara para)`
- `Void MoveAttributeUp(PositionRelationPara para)`
- `Void MoveAttributeDown(PositionRelationPara para)`
- `List`1 GetRouteViewTreeData(PositionRelationPara para)`
- `GridObject RouteQueryStatisticsListData(OnePageGridDataPara para)`
- `GridObject BomQueryData(OnePageGridDataPara para)`
- `GridObject GetItemRoute(OnePageGridDataPara para)`
- `GridObject GetRouteBatchEditData(OnePageGridDataPara para)`
- `String GetGMPositionUnitEids(SessionPara para)`
- `String PositionUnitDeleteCheck(PositionRelationPara para)`

## Hoteam.InforCenter.ProcessPlanEidt.Service.dll

### [interface] Hoteam.InforCenter.ProcessPlanEidt.Service.IProcessPlanEditService
- `String GetProcessPlanObjectInfo(ProcessPlanEditPara para)`
- `Dictionary`2 GetAboutTemplateList(ProcessPlanEditPara para)`
- `Dictionary`2 GetCardTemplateByProcessTemplateID(ProcessPlanEditPara para)`
- `List`1 GetTempaltesByConfigViewID(ProcessPlanEditPara para)`
- `String GetTemplateList(ProcessPlanEditPara para)`
- `String GetCardGroupList(ProcessPlanEditPara para)`
- `String GetCardInfoDataList(ProcessPlanEditPara para)`
- `Void SaveProcessModelData(ProcessPlanEditPara para)`
- `String DelObjBySql(ProcessPlanEditDelObjPara para)`
- `String ProcessPlanEditSave(ProcessPlanEditSaveObjs para)`
- `TreeNodeObject UpdateNode(TreePara para)`
- `TreeNodeObject NewTreeNode(TreePara para)`
- `String GetAllPeids(GetAllPeidsPara para)`
- `String GetTemplateInfos(GetAllPeidsPara para)`
- `String GetBindKeyByNodeUUID(GetBindKeyPara para)`
- `String GetCatalogTemplateIDByPlanID(ProcessPlanEditPara para)`
- `String CreateProcessPlanObj(ProcessPlanEditPara para)`
- `String DeleteProcessPlanObj(ProcessPlanEditPara para)`
- `String SetExclusive(ProcessPlanEditPara para)`
- `String ExclusiveForEdit(ProcessPlanEditPara para)`
- `String CancelExclusive(ProcessPlanEditPara para)`
- `GridObject DealWithProcessPlanListMse(OnePageGridDataPara para)`
- `String UpdateProcessPlanObj(ProcessPlanEditPara para)`
- `Dictionary`2 GetProcessPlanOpenType(ProcessPlanEditPara para)`
- `String EmendProcessPlanObj(ProcessPlanEditPara para)`
- `String UpdateProcessPlanEditTime(ProcessPlanEditPara para)`
- `String AddOperateLog(AddOperateLogPara para)`
- `Boolean IsExclusiveByOther(ProcessPlanEditPara para)`
- `List`1 GetPreProcessIDWithSameLevel(ProcessPlanEditPara para)`
- `Dictionary`2 GetChildProcessEuids(ProcessPlanEditPara para)`

### [class] Hoteam.InforCenter.ProcessPlanEidt.Service.ProcessPlanEditService
- `String GetProcessPlanObjectInfo(ProcessPlanEditPara para)`
- `Dictionary`2 GetAboutTemplateList(ProcessPlanEditPara para)`
- `Dictionary`2 GetCardTemplateByProcessTemplateID(ProcessPlanEditPara para)`
- `List`1 GetTempaltesByConfigViewID(ProcessPlanEditPara para)`
- `String GetTemplateList(ProcessPlanEditPara para)`
- `String GetCardGroupList(ProcessPlanEditPara para)`
- `String GetCardInfoDataList(ProcessPlanEditPara para)`
- `Void SaveProcessModelData(ProcessPlanEditPara para)`
- `String DelObjBySql(ProcessPlanEditDelObjPara para)`
- `String ProcessPlanEditSave(ProcessPlanEditSaveObjs para)`
- `TreeNodeObject UpdateNode(TreePara para)`
- `TreeNodeObject NewTreeNode(TreePara para)`
- `String GetAllPeids(GetAllPeidsPara para)`
- `String GetTemplateInfos(GetAllPeidsPara para)`
- `String GetBindKeyByNodeUUID(GetBindKeyPara para)`
- `String GetCatalogTemplateIDByPlanID(ProcessPlanEditPara para)`
- `String CreateProcessPlanObj(ProcessPlanEditPara para)`
- `String DeleteProcessPlanObj(ProcessPlanEditPara para)`
- `String SetExclusive(ProcessPlanEditPara para)`
- `String ExclusiveForEdit(ProcessPlanEditPara para)`
- `String CancelExclusive(ProcessPlanEditPara para)`
- `GridObject DealWithProcessPlanListMse(OnePageGridDataPara para)`
- `String UpdateProcessPlanObj(ProcessPlanEditPara para)`
- `Dictionary`2 GetProcessPlanOpenType(ProcessPlanEditPara para)`
- `String EmendProcessPlanObj(ProcessPlanEditPara para)`
- `String UpdateProcessPlanEditTime(ProcessPlanEditPara para)`
- `String AddOperateLog(AddOperateLogPara para)`
- `Boolean IsExclusiveByOther(ProcessPlanEditPara para)`
- `List`1 GetPreProcessIDWithSameLevel(ProcessPlanEditPara para)`
- `Dictionary`2 GetChildProcessEuids(ProcessPlanEditPara para)`

## Hoteam.InforCenter.ProcessPlanTemplate.Service.dll

### [interface] Hoteam.InforCenter.ProcessPlanTemplate.Service.IProcessPlanTemplateService
- `TreeRootData GetProcessTemplateGroupTree(TreeListViewPara para)`
- `List`1 GetTemplateSubTree(TreeListViewPara para)`
- `Void MoveUp(ReportEditSavePara para)`
- `Void MoveDown(ReportEditSavePara para)`
- `List`1 GetTemplateInfoAndData(ReportEditSavePara para)`
- `String GetBindColKeyDisplayValue(ReportEditSavePara para)`
- `Void BindCellToStructureData(ReportEditSavePara para)`
- `String GetCellDWGRelation(ReportEditSavePara para)`
- `Void SaveCellInfo(ReportEditSavePara para)`
- `Void ClearParentBindInfo(ReportEditSavePara para)`
- `String ProcessPlanTemplateSaveAs(ReportEditSavePara para)`
- `Dictionary`2 CappReportTemplateSaveAs(ReportEditSavePara para)`
- `List`1 GetProcessPropertyTree(ReportEditSavePara para)`
- `GridObject GetCellList(OnePageGridDataPara para)`
- `Void BatchSaveCellInfo(ReportEditSavePara para)`
- `Void BatchSaveTableCellInfo(ReportEditSavePara para)`
- `Boolean PublishCappReportTemplate(ReportEditSavePara para)`
- `Dictionary`2 GetValidateReportTemplate(ReportEditSavePara para)`
- `Boolean CheckReferance(ReportEditSavePara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `Dictionary`2 GetTemplateAllData(ReportEditSavePara para)`
- `Dictionary`2 GetCardTemplateData(ReportEditSavePara para)`
- `Dictionary`2 SaveImportData(ReportEditSavePara para)`
- `Dictionary`2 GetViceTableList(ReportEditSavePara para)`
- `Dictionary`2 GetVicePageList(ReportEditSavePara para)`
- `Boolean CreateMainViceLink(MainViceLinkPara para)`
- `Dictionary`2 SaveImportCardData(ReportEditSavePara para)`
- `Void SaveColumnCellInfo(ReportEditSavePara para)`
- `String CheckMainViceLink(ReportEditSavePara para)`
- `Boolean EnableProcessTemplate(ReportEditSavePara para)`
- `Boolean StopProcessTemplate(ReportEditSavePara para)`
- `Dictionary`2 GetAllPrinterList(ReportEditSavePara para)`
- `Dictionary`2 GetAllPaperName(ReportEditSavePara para)`
- `Boolean DeleteCellDWGRelation(ReportEditSavePara para)`
- `Dictionary`2 CheckTemplate(ReportEditSavePara para)`
- `Dictionary`2 CheckCardTemplate(ReportEditSavePara para)`
- `List`1 GetGroupAndTemplate(ReportEditSavePara para)`
- `List`1 GetSameGroupReportTemplate(ReportEditSavePara para)`
- `String GetOneCardGroupListByReportID(ReportEditSavePara para)`
- `Boolean SaveColumnsInfo(ReportEditSavePara para)`
- `String GetCardInfoDataBySource(ReportEditSavePara para)`
- `String GetCardInfoDataByObjectIDAndTemplateID(ReportEditSavePara para)`
- `TreeRootData GetTemplatePropertyTree(ReportEditSavePara para)`
- `List`1 GetSubPropertyTree(ReportEditSavePara para)`
- `Boolean CreateCatalogTable(ReportEditSavePara para)`
- `String GetMainAttachInfosByProcessPlanTemplateID(ReportEditSavePara para)`
- `Dictionary`2 GetEnumByEnumName(ReportEditSavePara para)`
- `String DeleteCellDWGRelationByDwgid(ReportEditSavePara para)`
- `String GetAttValueFromProcessView(ReportEditSavePara para)`
- `Dictionary`2 GetAllReportIDs(ReportEditSavePara para)`

### [class] Hoteam.InforCenter.ProcessPlanTemplate.Service.ProcessPlanTemplateService
- `TreeRootData GetProcessTemplateGroupTree(TreeListViewPara para)`
- `List`1 GetTemplateSubTree(TreeListViewPara para)`
- `List`1 GetProcessPropertyTree(ReportEditSavePara para)`
- `GridObject GetCellList(OnePageGridDataPara para)`
- `Void BatchSaveCellInfo(ReportEditSavePara para)`
- `Void SaveCellInfo(ReportEditSavePara para)`
- `Void SaveColumnCellInfo(ReportEditSavePara para)`
- `Boolean SaveColumnsInfo(ReportEditSavePara para)`
- `Void BatchSaveTableCellInfo(ReportEditSavePara para)`
- `Void MoveUp(ReportEditSavePara para)`
- `Void MoveDown(ReportEditSavePara para)`
- `List`1 GetTemplateInfoAndData(ReportEditSavePara para)`
- `String GetBindColKeyDisplayValue(ReportEditSavePara para)`
- `Void BindCellToStructureData(ReportEditSavePara para)`
- `Void ClearParentBindInfo(ReportEditSavePara para)`
- `String ProcessPlanTemplateSaveAs(ReportEditSavePara para)`
- `Dictionary`2 CappReportTemplateSaveAs(ReportEditSavePara para)`
- `Boolean PublishCappReportTemplate(ReportEditSavePara para)`
- `Dictionary`2 GetValidateReportTemplate(ReportEditSavePara para)`
- `Boolean CheckReferance(ReportEditSavePara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `Dictionary`2 GetTemplateAllData(ReportEditSavePara para)`
- `Dictionary`2 GetCardTemplateData(ReportEditSavePara para)`
- `Dictionary`2 SaveImportData(ReportEditSavePara para)`
- `Dictionary`2 GetViceTableList(ReportEditSavePara para)`
- `Dictionary`2 GetVicePageList(ReportEditSavePara para)`
- `Boolean CreateMainViceLink(MainViceLinkPara para)`
- `Dictionary`2 SaveImportCardData(ReportEditSavePara para)`
- `String CheckMainViceLink(ReportEditSavePara para)`
- `Boolean EnableProcessTemplate(ReportEditSavePara para)`
- `Boolean StopProcessTemplate(ReportEditSavePara para)`
- `String GetCellDWGRelation(ReportEditSavePara para)`
- `Boolean DeleteCellDWGRelation(ReportEditSavePara para)`
- `Dictionary`2 GetAllPrinterList(ReportEditSavePara para)`
- `Dictionary`2 GetAllPaperName(ReportEditSavePara para)`
- `Dictionary`2 CheckTemplate(ReportEditSavePara para)`
- `Dictionary`2 CheckCardTemplate(ReportEditSavePara para)`
- `List`1 GetGroupAndTemplate(ReportEditSavePara para)`
- `List`1 GetSameGroupReportTemplate(ReportEditSavePara para)`
- `String GetOneCardGroupListByReportID(ReportEditSavePara para)`
- `String GetCardInfoDataBySource(ReportEditSavePara para)`
- `String GetCardInfoDataByObjectIDAndTemplateID(ReportEditSavePara para)`
- `TreeRootData GetTemplatePropertyTree(ReportEditSavePara para)`
- `List`1 GetSubPropertyTree(ReportEditSavePara para)`
- `Boolean CreateCatalogTable(ReportEditSavePara para)`
- `String GetMainAttachInfosByProcessPlanTemplateID(ReportEditSavePara para)`
- `Dictionary`2 GetEnumByEnumName(ReportEditSavePara para)`
- `String DeleteCellDWGRelationByDwgid(ReportEditSavePara para)`
- `String GetAttValueFromProcessView(ReportEditSavePara para)`
- `Dictionary`2 GetAllReportIDs(ReportEditSavePara para)`

## Hoteam.InforCenter.ProcessRoute.Service.dll

### [interface] Hoteam.InforCenter.ProcessRoute.Service.IProcessRouteService
- `BOMTitleData GetEditBomTitle(SessionPara para)`
- `String GetEditBomOnePageData(EditBomOnePageDataPara para)`
- `List`1 GetEditBomAllStructData(NewGetBomStructPara para)`
- `List`1 NoMaintainedGetEditBomAllStructData(NewGetBomStructPara para)`
- `String NoMaintainedGetEditBomOnePageData(EditBomOnePageDataPara para)`
- `List`1 NoMaintainedGetQueryData(NoMaintainedGetQuery para)`
- `BOMTitleData NoMaintainedGetEditBomTitle(SessionPara para)`
- `String SaveProuteData(SaveProuteDataPara para)`
- `GridTitleData GetProcessRouteUnitTitleData(GridRowTitlePara para)`
- `GridObject GetProcessRouteUnitGridData(OnePageGridDataPara para)`
- `Dictionary`2 GetExtendParaSettingValue(ProcessRoutePara para)`
- `List`1 ProcessRouteEmend(ProcessRoutePara para)`
- `String QueryPositionCode(ProcessRoutePara para)`
- `List`1 GetRouteViewTreeData(TreeViewPara para)`
- `List`1 GetChangeProcessRouteExtend(ProcessRoutePara para)`
- `Dictionary`2 GetDisplayValueFroExtend(ProcessRoutePara para)`
- `List`1 GetProcessRouteObj(ProcessRoutePara para)`
- `Dictionary`2 GetLatestRoute(ProcessRoutePara para)`
- `String DeleteProuteObj(SaveProuteDataPara para)`
- `String CheckItemIsIsolate(ProcessRoutePara para)`
- `String SaveProcessRoute(SaveProcessRoutePara para)`
- `String CheckMainUnit(ProcessRoutePara para)`
- `Dictionary`2 VerifyThatTheCopiedAndPastedDataIsLegitimate(CopyIncoming para)`
- `Boolean SaveTheCopiedAndPastedDataAndVerifyIt(CopyIncoming para)`
- `GridObject GetProcessRouteListData(OnePageGridDataPara para)`
- `String BatchEidtForItemsListGetItemsID(GetItemIDsPara para)`
- `String DeleteProuteObjByLID(DeletePRByLID para)`
- `ReturnPRouteInformation GetProcessRoute(ApiGetProcessRoutePara para)`

### [class] Hoteam.InforCenter.ProcessRoute.Service.ProcessRouteService
- `BOMTitleData GetEditBomTitle(SessionPara para)`
- `String GetEditBomOnePageData(EditBomOnePageDataPara para)`
- `List`1 GetEditBomAllStructData(NewGetBomStructPara para)`
- `List`1 NoMaintainedGetEditBomAllStructData(NewGetBomStructPara para)`
- `String NoMaintainedGetEditBomOnePageData(EditBomOnePageDataPara para)`
- `List`1 NoMaintainedGetQueryData(NoMaintainedGetQuery para)`
- `BOMTitleData NoMaintainedGetEditBomTitle(SessionPara para)`
- `String SaveProuteData(SaveProuteDataPara para)`
- `GridTitleData GetProcessRouteUnitTitleData(GridRowTitlePara para)`
- `GridObject GetProcessRouteUnitGridData(OnePageGridDataPara para)`
- `Dictionary`2 GetExtendParaSettingValue(ProcessRoutePara para)`
- `List`1 GetChangeProcessRouteExtend(ProcessRoutePara para)`
- `List`1 GetRouteViewTreeData(TreeViewPara para)`
- `List`1 ProcessRouteEmend(ProcessRoutePara para)`
- `String QueryPositionCode(ProcessRoutePara para)`
- `Dictionary`2 GetDisplayValueFroExtend(ProcessRoutePara para)`
- `List`1 GetProcessRouteObj(ProcessRoutePara para)`
- `Dictionary`2 GetLatestRoute(ProcessRoutePara para)`
- `String DeleteProuteObj(SaveProuteDataPara para)`
- `String CheckItemIsIsolate(ProcessRoutePara para)`
- `String SaveProcessRoute(SaveProcessRoutePara para)`
- `String CheckMainUnit(ProcessRoutePara para)`
- `Dictionary`2 VerifyThatTheCopiedAndPastedDataIsLegitimate(CopyIncoming para)`
- `Boolean SaveTheCopiedAndPastedDataAndVerifyIt(CopyIncoming para)`
- `GridObject GetProcessRouteListData(OnePageGridDataPara para)`
- `String BatchEidtForItemsListGetItemsID(GetItemIDsPara para)`
- `String DeleteProuteObjByLID(DeletePRByLID para)`
- `ReturnPRouteInformation GetProcessRoute(ApiGetProcessRoutePara para)`

## Hoteam.InforCenter.ProjectWorkflow.Service.dll

### [class] Hoteam.InforCenter.ProjectWorkflow.Service.ProjectWorkflowService
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `List`1 GetProjectLifeCircleState(SessionPara para)`
- `List`1 GetProjectPlanLifeCircleState(SessionPara para)`
- `Dictionary`2 GetProjectPlanStateByProjectID(StartWorkflowPagePara para)`
- `String GetProjectRoleTextFlowActor(ProjectRolePara para)`
- `Void CannotEditProjectWorkflow(WorkflowPara para)`
- `Void RollbackTask(WorkflowPara para)`
- `Void ChangeHaveFinished(WorkflowPara para)`
- `EditGridObject GetProjectPageWorkflowGridData(SessionPara para)`
- `EditGridObject GetProjectLineWorkflowGridData(SessionPara para)`
- `Boolean CheckTemplateBeforeStart(StartWorkflowPagePara para)`
- `Boolean GetProjectTaskIsFinsih(StartWorkflowPagePara para)`
- `String IsCheckTaskData(ProjectPlanPublishPara para)`

## Hoteam.InforCenter.Issue.Service.dll

### [interface] Hoteam.InforCenter.Issue.Service.IIssueService
- `Void UpdateRiskInfo(IssuePara para)`
- `List`1 GetIssueWareHourseAllData(TreeViewPara para)`
- `List`1 GetUnExistAttentionedObjectID(IssuePara para)`
- `Boolean GetExistAttentionedObjectID(IssuePara para)`
- `Boolean CheckIssueAttentioned(IssuePara para)`
- `Boolean SetIssueFavorite(IssuePara para)`
- `Boolean CancelAttentionObject(IssuePara para)`
- `Boolean CheckIssueCodeExist(IssuePara para)`
- `Boolean CheckIssueResponserExist(IssuePara para)`
- `String BatchCreateIssue(IssuePara para)`
- `String BatchGetObjListString(IssuePara para)`
- `GridObject GetMyIssueGridData(SessionPara para)`
- `GridObject GetProjectIssueTypeByProjectId(IssuePara para)`
- `GridObject GetProjectIssueProgressByProjectId(IssuePara para)`
- `GridObject GetProjectIssueStateByProjectId(IssuePara para)`
- `GridRowTitleObject GetProjectIssueGridRowTitle(SessionPara para)`
- `GridObject GetProjectIssueGridData(IssuePara para)`
- `EditGridTitleData GetBatchCreateIssueTitleData(GridRowTitlePara para)`
- `String GetIssueTreeCountData(TreeViewPara para)`
- `GridObject GetProjectIssueQueryGridData(OnePageGridDataPara para)`
- `String GetProjectDataByTaskID(IssuePara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `List`1 GetRiskLifeCircleState(SessionPara para)`
- `Boolean CheckIssueTemplateInvalid(IssuePara para)`
- `Boolean SetIssueTemplateInvalid(IssuePara para)`
- `Boolean BatchSaveIssuePrincipal(IssuePara para)`
- `Boolean CanDo(IssuePara para)`
- `String GetPMbyIssueid(IssuePara para)`
- `String Assign(IssuePara para)`
- `AddLinkMessage AlterIssue(IssuePara para)`
- `String GetIssueInfo(IssuePara para)`
- `List`1 GetPromoteDropdownData(IssuePara para)`
- `String GetAlertDelayDays(IssuePara para)`
- `String IssuePromotePriority(IssuePara para)`
- `String IssuePromotePrincipal(IssuePara para)`
- `String AutoPromote(SessionPara para)`
- `String ImportIssueData(ImportIssuePara para)`
- `Boolean SetAttentionLink(IssuePara para)`
- `GridObject GetIssueTaskOnePageGridData(OnePageGridDataPara para)`
- `Boolean SetIssueResponser(IssuePara para)`
- `Boolean CheckIssueStateBeforeStartFlow(IssuePara para)`
- `GridTitleData GetIssueGridTitle(GridRowTitlePara para)`
- `GridObject GetIssueGridData(OnePageGridDataPara para)`
- `Boolean UpdateIssueSchdule(IssuePara para)`
- `Boolean CheckIssueState(IssuePara para)`
- `String CheckIssueProjectOrTaskExist(IssuePara para)`
- `Boolean CheckIssueStageState(IssuePara para)`
- `GridTitleData GetIssueTaskTitle(GridRowTitlePara para)`
- `GridObject GetIssueStatisticGridData(OnePageGridDataPara para)`
- `GridObject GetIssueQueryGridData(OnePageGridDataPara para)`
- `Boolean IssueCheckTemplateBeforeStart(StartWorkflowPagePara para)`
- `String GetIssueIDByWorkFlowInfo(IssuePara para)`
- `Void ChangeIssueStateToIssue(IssuePara para)`
- `GridObject GetIssueMyPortalBoardData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.Issue.Service.IssueService
- `List`1 GetIssueWareHourseAllData(TreeViewPara para)`
- `Void UpdateRiskInfo(IssuePara para)`
- `List`1 GetUnExistAttentionedObjectID(IssuePara para)`
- `Boolean GetExistAttentionedObjectID(IssuePara para)`
- `Boolean CheckIssueAttentioned(IssuePara para)`
- `Boolean SetIssueFavorite(IssuePara para)`
- `Boolean CancelAttentionObject(IssuePara para)`
- `Boolean CheckIssueCodeExist(IssuePara para)`
- `Boolean CheckIssueResponserExist(IssuePara para)`
- `String BatchCreateIssue(IssuePara para)`
- `String BatchGetObjListString(IssuePara para)`
- `Boolean SetIssueTemplateInvalid(IssuePara para)`
- `GridObject GetMyIssueGridData(SessionPara para)`
- `GridObject GetProjectIssueTypeByProjectId(IssuePara para)`
- `GridObject GetProjectIssueProgressByProjectId(IssuePara para)`
- `GridObject GetProjectIssueStateByProjectId(IssuePara para)`
- `GridRowTitleObject GetProjectIssueGridRowTitle(SessionPara para)`
- `GridObject GetProjectIssueGridData(IssuePara para)`
- `EditGridTitleData GetBatchCreateIssueTitleData(GridRowTitlePara para)`
- `String GetIssueTreeCountData(TreeViewPara para)`
- `GridObject GetProjectIssueQueryGridData(OnePageGridDataPara para)`
- `String GetProjectDataByTaskID(IssuePara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `List`1 GetRiskLifeCircleState(SessionPara para)`
- `Boolean CheckIssueTemplateInvalid(IssuePara para)`
- `Boolean BatchSaveIssuePrincipal(IssuePara para)`
- `Boolean CanDo(IssuePara para)`
- `String GetPMbyIssueid(IssuePara para)`
- `String Assign(IssuePara para)`
- `Boolean SetAttentionLink(IssuePara para)`
- `AddLinkMessage AlterIssue(IssuePara para)`
- `String GetIssueInfo(IssuePara para)`
- `List`1 GetPromoteDropdownData(IssuePara para)`
- `String GetAlertDelayDays(IssuePara para)`
- `String IssuePromotePriority(IssuePara para)`
- `String IssuePromotePrincipal(IssuePara para)`
- `String AutoPromote(SessionPara para)`
- `String ImportIssueData(ImportIssuePara para)`
- `GridObject GetIssueTaskOnePageGridData(OnePageGridDataPara para)`
- `Boolean SetIssueResponser(IssuePara para)`
- `Boolean CheckIssueStateBeforeStartFlow(IssuePara para)`
- `GridTitleData GetIssueGridTitle(GridRowTitlePara para)`
- `GridObject GetIssueGridData(OnePageGridDataPara para)`
- `Boolean UpdateIssueSchdule(IssuePara para)`
- `Boolean CheckIssueState(IssuePara para)`
- `String CheckIssueProjectOrTaskExist(IssuePara para)`
- `Boolean CheckIssueStageState(IssuePara para)`
- `GridTitleData GetIssueTaskTitle(GridRowTitlePara para)`
- `GridObject GetIssueStatisticGridData(OnePageGridDataPara para)`
- `GridObject GetIssueQueryGridData(OnePageGridDataPara para)`
- `Boolean IssueCheckTemplateBeforeStart(StartWorkflowPagePara para)`
- `String GetIssueIDByWorkFlowInfo(IssuePara para)`
- `Void ChangeIssueStateToIssue(IssuePara para)`
- `GridObject GetIssueMyPortalBoardData(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.Issue.Service.IIssueService2
- `String CheckAndGetListFromFile(ImportIssuePara para)`
- `String ImportDataByCache(ImportIssuePara para)`
- `String SaveIssueProjectLink(IssuePara para)`
- `Boolean CheckIssueProjectExist(IssuePara para)`
- `Boolean DeleteIssueProjectLink(IssuePara para)`
- `String CheckProjectEndDateToIssueEndDate(IssuePara para)`
- `Boolean CheckIssueState(IssuePara para)`
- `String AutoDelayRemind(SessionPara para)`
- `String GetActIssueFinishDate(IssuePara para)`
- `String GetGZRByType(IssuePara para)`

### [class] Hoteam.InforCenter.Issue.Service.IssueService2
- `String AutoDelayRemind(SessionPara para)`
- `String CheckAndGetListFromFile(ImportIssuePara para)`
- `Boolean CheckIssueProjectExist(IssuePara para)`
- `Boolean CheckIssueState(IssuePara para)`
- `String CheckProjectEndDateToIssueEndDate(IssuePara para)`
- `Boolean DeleteIssueProjectLink(IssuePara para)`
- `String GetActIssueFinishDate(IssuePara para)`
- `String GetGZRByType(IssuePara para)`
- `String ImportDataByCache(ImportIssuePara para)`
- `String SaveIssueProjectLink(IssuePara para)`

## InforCenter.ProjectMobile.ProjectTask.Service.dll

### [interface] InforCenter.ProjectMobile.ProjectTask.Service.IProjectTaskService
- `List`1 GetTaskInfoByID(MobilePropertyPara para)`
- `RetWorkReportList GetTaskResWorktimeList(MobilePropertyPara para)`
- `RetOptionState EditTask(TaskObejctInspectorPara para)`
- `List`1 GetEpsList(MobilePropertyPara para)`
- `Dictionary`2 GetProjectBaseDataList(MobilePropertyPara para)`
- `RetWorkReportList GetProjectListByQuery(WorkReportListPara para)`
- `Dictionary`2 GetMobileSearchObjType(SessionPara para)`
- `List`1 MobileAddExistSearchListTitle(SessionPara para)`
- `List`1 MobileAddExistSearch(MobileAddExistSearchPara para)`
- `Dictionary`2 GetMobileTaskRelationType(SessionPara para)`
- `String MobileCommitTaskInputs(CommitTaskInputsPara para)`

### [class] InforCenter.ProjectMobile.ProjectTask.Service.ProjectTaskService
- `List`1 GetTaskInfoByID(MobilePropertyPara para)`
- `RetWorkReportList GetTaskResWorktimeList(MobilePropertyPara para)`
- `RetOptionState EditTask(TaskObejctInspectorPara para)`
- `List`1 GetEpsList(MobilePropertyPara para)`
- `Dictionary`2 GetProjectBaseDataList(MobilePropertyPara para)`
- `RetWorkReportList GetProjectListByQuery(WorkReportListPara para)`
- `Dictionary`2 GetMobileSearchObjType(SessionPara para)`
- `List`1 MobileAddExistSearchListTitle(SessionPara para)`
- `List`1 MobileAddExistSearch(MobileAddExistSearchPara para)`
- `Dictionary`2 GetMobileTaskRelationType(SessionPara para)`
- `String MobileCommitTaskInputs(CommitTaskInputsPara para)`

## InforCenter.ProjectMobile.WorkReport.Service.dll

### [interface] InforCenter.ProjectMobile.WorkReport.Service.IWorkReportService
- `RetWorkReportList GetDailyWorkReportList(WorkReportListPara para)`
- `Dictionary`2 GetDailyWorkLogType(WorkReportLogPara para)`
- `List`1 GetDailyWorkReportRemark(WorkReportLogPara para)`
- `List`1 GetProjectList(WorkReportLogPara para)`
- `RetOptionState SaveDailyWorkLog(WorkReportLogPara para)`
- `Dictionary`2 GetDefaultAuditor(WorkReportLogPara para)`
- `RetOptionState DeleteWorkLogRemark(WorkReportLogPara para)`
- `RetWorkReportList GetAuditWorkLogList(WorkReportListPara para)`
- `Dictionary`2 GetWorkLogInfoByID(WorkReportListPara para)`
- `RetOptionState AddWorkLogRemark(WorkReportLogPara para)`
- `RetOptionState AuditWorklog(WorkReportLogPara para)`

### [class] InforCenter.ProjectMobile.WorkReport.Service.WorkReportService
- `RetOptionState DeleteWorkLogRemark(WorkReportLogPara para)`
- `Dictionary`2 GetDailyWorkLogType(WorkReportLogPara para)`
- `RetWorkReportList GetDailyWorkReportList(WorkReportListPara para)`
- `List`1 GetDailyWorkReportRemark(WorkReportLogPara para)`
- `Dictionary`2 GetDefaultAuditor(WorkReportLogPara para)`
- `List`1 GetProjectList(WorkReportLogPara para)`
- `RetOptionState SaveDailyWorkLog(WorkReportLogPara para)`
- `RetWorkReportList GetAuditWorkLogList(WorkReportListPara para)`
- `Dictionary`2 GetWorkLogInfoByID(WorkReportListPara para)`
- `RetOptionState AddWorkLogRemark(WorkReportLogPara para)`
- `RetOptionState AuditWorklog(WorkReportLogPara para)`

## Hoteam.InforCenter.MyProject.Service.dll

### [interface] Hoteam.InforCenter.MyProject.Service.IMyProjectService
- `String SaveProjectData(ProjectSavePara para)`
- `String PasteProjectData(ProjectSavePara para)`
- `Boolean CheckDefaultCalendarExist(SessionPara para)`
- `String AddObjectToProjectFolder(ProjectSavePara para)`
- `Boolean CheckProjectNameOrCodeExist(ProjectSavePara para)`
- `String CheckAboutProjectExist(ProjectSavePara para)`
- `String PasteProjectChildObject(ProjectSavePara para)`
- `List`1 GetProjectStateData(SessionPara para)`
- `List`1 GetProjectProgess(SessionPara para)`
- `String GetDeliveryPositionByTaskID(ProjectSavePara para)`
- `Boolean GenratorProjectTaskDeliveryFolderByWbs(ProjectSavePara para)`
- `GridObject GetRecentProjectList(OnePageGridDataPara para)`
- `GridObject GetDelayProjectList(OnePageGridDataPara para)`
- `GridObject GetProjectMileStoneGridData(OnePageGridDataPara para)`
- `Boolean CheckLinkExist(ProjectSavePara para)`
- `GridObject GetProjectDeviationGridData(ProjectSavePara para)`
- `GridTitleData GetProjectListTitleData(GridRowTitlePara para)`
- `GridTitleData GetProjectMileStoneTitleData(GridRowTitlePara para)`
- `GridTitleData GetDelayProjectListTitleData(GridRowTitlePara para)`
- `GridObject GetProjecProgressGridData(ProjectSavePara para)`
- `Boolean RemoveAboutProject(ProjectSavePara para)`
- `Boolean AddAboutProject(ProjectSavePara para)`
- `Boolean CheckEpsEditPermission(ProjectSavePara para)`
- `GridObject GetAboutProjectGridData(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridData(OnePageGridDataPara para)`
- `GridTitleData GetProjectMemberProjectTitleData(GridRowTitlePara para)`
- `GridObject GetProjectMemberProjectGridData(OnePageGridDataPara para)`
- `Boolean CancelAttentionProject(ProjectSavePara para)`
- `Boolean CancelAttentionProjectByEID(ProjectSavePara para)`
- `String GetResourceIdByCurrentUser(SessionPara para)`
- `String CheckDeliveryInPorjectList(ProjectSavePara para)`
- `TreeChildData GetWorkSpaceChildQueryData(TreeViewPara para)`
- `Boolean CheckRemoveObjectByWorkSpace(ProjectSavePara para)`
- `Boolean CheckProjectPlanStartOrEndDate(ProjectSavePara para)`
- `Boolean CheckProjectAdminExist(ProjectSavePara para)`
- `Boolean CheckIssueState(ProjectSavePara para)`
- `GridObject GetOnePageProjectGridDataForPortal(OnePageGridDataPara para)`
- `GridObject NewGetOnePageProjectGridDataForPortal(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByLifecycle(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByLevel(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByPhase(OnePageGridDataPara para)`
- `GridTitleData GetProjectPhaseTitleData(GridRowTitlePara para)`
- `GridObject GetProjectPhaseGridData(OnePageGridDataPara para)`
- `Boolean CanEditProjectDate(ProjectSavePara para)`
- `Dictionary`2 GetMyJoinProjectList(SessionPara para)`
- `Dictionary`2 GetMyJoinProjectEIDList(SessionPara para)`
- `String GetProjectManagerByEuid(ProjectSavePara para)`
- `GridObject GetReportByPEID(OnePageGridDataPara para)`
- `Boolean CanStartProjectFlow(ProjectSavePara para)`
- `String GetSuspendIDFromFlowID(ProjectSavePara para)`
- `Boolean IFPROJECTTEMPLATE(SessionPara para)`
- `GridObject GetGridDataByObjectId(TemplatePara para)`
- `Boolean IfWorkReport(SessionPara para)`
- `String PasteProjectData1000(ProjectSavePara para)`
- `Void GenratorProjectTaskDeliveryFolderForTimer(ProjectSavePara para)`
- `GridObject GetOnePageProjectToProjectGridData(OnePageGridDataPara para)`
- `Boolean IslAttentionProject(ProjectSavePara para)`
- `Boolean DeleteProjectData(SessionPara para)`
- `Dictionary`2 GetProjectTypeDataDic(SessionPara para)`
- `Dictionary`2 GetProjectManagerDataDic(SessionPara para)`
- `Dictionary`2 GetDepartmentDataDic(SessionPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByNmae(OnePageGridDataPara para)`
- `Dictionary`2 GetMyJoinProjectListByEps(ProjectSavePara para)`
- `GridObject GetProjectTaskProcessChartData(ProjectSavePara para)`
- `GridObject GetMileStoneTaskGridData(ProjectSavePara para)`
- `GridObject GetWeekTaskGridData(ProjectSavePara para)`
- `GridObject ProjectTeamMemberHoursChars(ProjectSavePara para)`
- `GridObject GetMemberExctingGridData(ProjectSavePara para)`
- `GridObject GetProjectTypePieListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetProjectDepartPieListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetProjectEpsPieListOnePageGridData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.MyProject.Service.MyProjectService
- `String AddObjectToProjectFolder(ProjectSavePara para)`
- `String CheckAboutProjectExist(ProjectSavePara para)`
- `Boolean CheckProjectNameOrCodeExist(ProjectSavePara para)`
- `String SaveProjectData(ProjectSavePara para)`
- `Boolean DeleteProjectData(SessionPara para)`
- `String PasteProjectChildObject(ProjectSavePara para)`
- `List`1 GetProjectStateData(SessionPara para)`
- `List`1 GetProjectProgess(SessionPara para)`
- `String PasteProjectData(ProjectSavePara para)`
- `String GetDeliveryPositionByTaskID(ProjectSavePara para)`
- `Boolean GenratorProjectTaskDeliveryFolderByWbs(ProjectSavePara para)`
- `Void GenratorProjectTaskDeliveryFolderForTimer(ProjectSavePara para)`
- `GridObject GetRecentProjectList(OnePageGridDataPara para)`
- `Boolean CheckLinkExist(ProjectSavePara para)`
- `GridObject GetProjectDeviationGridData(ProjectSavePara para)`
- `GridObject GetProjecProgressGridData(ProjectSavePara para)`
- `Boolean RemoveAboutProject(ProjectSavePara para)`
- `Boolean AddAboutProject(ProjectSavePara para)`
- `Boolean CheckEpsEditPermission(ProjectSavePara para)`
- `GridObject GetAboutProjectGridData(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridData(OnePageGridDataPara para)`
- `GridTitleData GetProjectMemberProjectTitleData(GridRowTitlePara para)`
- `GridObject GetProjectMemberProjectGridData(OnePageGridDataPara para)`
- `Boolean CancelAttentionProject(ProjectSavePara para)`
- `Boolean CancelAttentionProjectByEID(ProjectSavePara para)`
- `String GetResourceIdByCurrentUser(SessionPara para)`
- `String CheckDeliveryInPorjectList(ProjectSavePara para)`
- `TreeChildData GetWorkSpaceChildQueryData(TreeViewPara para)`
- `Boolean CheckDefaultCalendarExist(SessionPara para)`
- `GridTitleData GetProjectListTitleData(GridRowTitlePara para)`
- `GridTitleData GetProjectMileStoneTitleData(GridRowTitlePara para)`
- `GridTitleData GetDelayProjectListTitleData(GridRowTitlePara para)`
- `Boolean CheckRemoveObjectByWorkSpace(ProjectSavePara para)`
- `Boolean CheckProjectPlanStartOrEndDate(ProjectSavePara para)`
- `Boolean CheckProjectAdminExist(ProjectSavePara para)`
- `Boolean CheckIssueState(ProjectSavePara para)`
- `GridObject GetOnePageProjectGridDataForPortal(OnePageGridDataPara para)`
- `GridObject NewGetOnePageProjectGridDataForPortal(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByLifecycle(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByLevel(OnePageGridDataPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByPhase(OnePageGridDataPara para)`
- `GridTitleData GetProjectPhaseTitleData(GridRowTitlePara para)`
- `GridObject GetProjectPhaseGridData(OnePageGridDataPara para)`
- `Boolean CanEditProjectDate(ProjectSavePara para)`
- `Dictionary`2 GetMyJoinProjectList(SessionPara para)`
- `Dictionary`2 GetMyJoinProjectEIDList(SessionPara para)`
- `String GetProjectManagerByEuid(ProjectSavePara para)`
- `GridObject GetReportByPEID(OnePageGridDataPara para)`
- `Boolean CanStartProjectFlow(ProjectSavePara para)`
- `String GetSuspendIDFromFlowID(ProjectSavePara para)`
- `Boolean IFPROJECTTEMPLATE(SessionPara para)`
- `GridObject GetGridDataByObjectId(TemplatePara para)`
- `Boolean IfWorkReport(SessionPara para)`
- `String PasteProjectData1000(ProjectSavePara para)`
- `GridObject GetOnePageProjectToProjectGridData(OnePageGridDataPara para)`
- `Boolean IslAttentionProject(ProjectSavePara para)`
- `Dictionary`2 GetProjectTypeDataDic(SessionPara para)`
- `Dictionary`2 GetProjectManagerDataDic(SessionPara para)`
- `Dictionary`2 GetDepartmentDataDic(SessionPara para)`
- `GridObject GetOnePageProjectGridDataForPortalByNmae(OnePageGridDataPara para)`
- `GridObject GetDelayProjectList(OnePageGridDataPara para)`
- `GridObject GetProjectMileStoneGridData(OnePageGridDataPara para)`
- `Dictionary`2 GetMyJoinProjectListByEps(ProjectSavePara para)`
- `GridObject GetProjectTaskProcessChartData(ProjectSavePara para)`
- `GridObject GetMileStoneTaskGridData(ProjectSavePara para)`
- `GridObject GetWeekTaskGridData(ProjectSavePara para)`
- `GridObject ProjectTeamMemberHoursChars(ProjectSavePara para)`
- `GridObject GetMemberExctingGridData(ProjectSavePara para)`
- `GridObject GetProjectTypePieListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetProjectDepartPieListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetProjectEpsPieListOnePageGridData(OnePageGridDataPara para)`

## Hoteam.InforCenter.ProjectBaseLine.Service.dll

### [interface] Hoteam.InforCenter.ProjectBaseLine.Service.IProjectBaseLineService
- `Boolean ChangeLineStatusToBase(ChangeLineStatusPara para)`
- `String SaveObjectService(SaveBaseLinePara para)`
- `GanttData GetGantCompRowData(BaseLineCompPara para)`
- `List`1 GetFromLineList(BaseLineCompPara para)`
- `List`1 GetCompLineList(BaseLineCompPara para)`
- `GridObject GetCompareRowData(CompLineGridDataPara para)`
- `GridTitleData GetCompareTitleData(GridRowTitlePara para)`
- `Void CheckLinkPermission(CheckLinkPermission para)`
- `List`1 GetLineCompareLevelList(BaseLineCompPara para)`
- `GanttData GetfollowupProjectPlanGantDataForCompare(BaseLineCompPara para)`

### [class] Hoteam.InforCenter.ProjectBaseLine.Service.ProjectBaseLineService
- `Boolean ChangeLineStatusToBase(ChangeLineStatusPara para)`
- `GridObject GetCompareRowData(CompLineGridDataPara para)`
- `GridTitleData GetCompareTitleData(GridRowTitlePara para)`
- `List`1 GetCompLineList(BaseLineCompPara para)`
- `List`1 GetFromLineList(BaseLineCompPara para)`
- `GanttData GetGantCompRowData(BaseLineCompPara para)`
- `String SaveObjectService(SaveBaseLinePara para)`
- `Void CheckLinkPermission(CheckLinkPermission para)`
- `List`1 GetLineCompareLevelList(BaseLineCompPara para)`
- `GanttData GetfollowupProjectPlanGantDataForCompare(BaseLineCompPara para)`

## Hoteam.InforCenter.ProjectCenter.Service.dll

### [class] Hoteam.InforCenter.ProjectCenter.Service.GanttXmlDemo
- (no public methods)

### [interface] Hoteam.InforCenter.ProjectCenter.Service.IProjectCenterService
- `String GetGantTitleData(SessionPara para)`
- `GanttData GetGantRowData(GanttPara para)`
- `TreeChildData GetWorkSpaceManagementChildData(TreeViewPara para)`
- `Boolean PasteProject(GanttPara para)`
- `Boolean CheckEpsEditPermission(GanttPara para)`
- `Boolean UpdateProjectEpsPosition(GanttPara para)`
- `Boolean CheckProjectAttention(GanttPara para)`
- `String GetGroupFilterSql(GanttPara para)`
- `TreeRootData GetProjectFolderTreeRootNode(TreeViewPara para)`
- `GridObject ProjectCenterGetExportListData(GanttPara para)`
- `GridTitleData ProjectCenterGetExportGetTitle(GridRowTitlePara para)`
- `String ProjectCenterExportTitleData(GridRowTitlePara para)`
- `GanttData GetProjectCenterGantRowData(GanttPara para)`
- `GanttData GetFollowupProjectCenterGantRowData(GanttPara para)`
- `List`1 GetProjectSapceTreeQueryData(TreeViewQueryPara para)`

### [class] Hoteam.InforCenter.ProjectCenter.Service.ProjectCenterService
- `Boolean CheckEpsEditPermission(GanttPara para)`
- `GanttData GetGantRowData(GanttPara para)`
- `String GetGantTitleData(SessionPara para)`
- `TreeChildData GetWorkSpaceManagementChildData(TreeViewPara para)`
- `Boolean PasteProject(GanttPara para)`
- `Boolean UpdateProjectEpsPosition(GanttPara para)`
- `Boolean CheckProjectAttention(GanttPara para)`
- `String GetGroupFilterSql(GanttPara para)`
- `TreeRootData GetProjectFolderTreeRootNode(TreeViewPara para)`
- `GanttData GetProjectCenterGantRowData(GanttPara para)`
- `GanttData GetFollowupProjectCenterGantRowData(GanttPara para)`
- `GridObject ProjectCenterGetExportListData(GanttPara para)`
- `GridTitleData ProjectCenterGetExportGetTitle(GridRowTitlePara para)`
- `List`1 GetProjectSapceTreeQueryData(TreeViewQueryPara para)`
- `String ProjectCenterExportTitleData(GridRowTitlePara para)`

## Hoteam.InforCenter.ProjectChange.Service.dll

### [interface] Hoteam.InforCenter.ProjectChange.Service.IProjectChangeService
- `EditGridObject GetProjectChangeApplySystemSetting(ProjectPlanSystemSettingPara para)`
- `Boolean IsNeedAndNotExistChangeApply(ProjectEmendPara para)`
- `String EmendVersionProject(ProjectEmendPara para)`
- `String EmendProjectSave(EmendProjectSavePara para)`
- `Void IsNeedChangeApply(ProjectEmendPara para)`
- `Void ExistPreVersionProject(ProjectChangePara para)`
- `String GetProjectChangeDataByWorkflow(ProjectChangePara para)`
- `String GetInitChangeInfo(ProjectChangePara para)`
- `GridRowTitleData GetProjectChangeDifferentTitle(ProjectChangePara para)`
- `GridObject GetProjectChangeDifferentData(ProjectChangePara para)`
- `Boolean EmendPlanSave(EmendPlanSavePara para)`
- `RetProjectChangeCompare GetProjectPlanForCompareByWorkflow(ProjectChangePara para)`
- `GridObject GetPlanCompareData(OnePageGridDataPara para)`
- `GridObject GetProjectChangeApplyGrid(OnePageGridDataPara para)`
- `String GetProjectChangeTraceNode(ProjectChangePara para)`
- `GridObject GetProjectPlanChangeTraceData(OnePageGridDataPara para)`
- `GridTitleData GetProjectPlanChangeTraceTitle(GridRowTitlePara para)`
- `GridObject GetProjectInfoChangeHistoryGrid(OnePageGridDataPara para)`
- `String GetFormTypeByProjectID(ProjectChangePara para)`
- `String GetInitChangeFormInfo(ProjectChangePara para)`
- `GridTitleData GetProjectInfoChangeHistoryTitle(GridRowTitlePara para)`
- `GridObject GetProjectInfoChangeHistoryData(OnePageGridDataPara para)`
- `GridObject GetPlanHistoryCompareData(OnePageGridDataPara para)`
- `Boolean IsProjectManagerChange(ProjectChangePara para)`
- `Boolean AllowChangeProjectInfo(ProjectChangePara para)`
- `Boolean AllowChangeProjectPlan(ProjectChangePara para)`
- `Boolean IsLastProject(ProjectChangePara para)`
- `GridObject GetPlanHistoryCompareStatics(ProjectChangePara para)`
- `GridObject GetPlanCompareStatics(ProjectChangePara para)`

### [class] Hoteam.InforCenter.ProjectChange.Service.ProjectChangeService
- `EditGridObject GetProjectChangeApplySystemSetting(ProjectPlanSystemSettingPara para)`
- `Boolean IsNeedAndNotExistChangeApply(ProjectEmendPara para)`
- `String EmendVersionProject(ProjectEmendPara para)`
- `String EmendProjectSave(EmendProjectSavePara para)`
- `Void IsNeedChangeApply(ProjectEmendPara para)`
- `Void ExistPreVersionProject(ProjectChangePara para)`
- `String GetProjectChangeDataByWorkflow(ProjectChangePara para)`
- `String GetInitChangeInfo(ProjectChangePara para)`
- `GridRowTitleData GetProjectChangeDifferentTitle(ProjectChangePara para)`
- `GridObject GetProjectChangeDifferentData(ProjectChangePara para)`
- `Boolean IsProjectManagerChange(ProjectChangePara para)`
- `Boolean EmendPlanSave(EmendPlanSavePara para)`
- `RetProjectChangeCompare GetProjectPlanForCompareByWorkflow(ProjectChangePara para)`
- `GridObject GetPlanCompareData(OnePageGridDataPara para)`
- `GridObject GetProjectChangeApplyGrid(OnePageGridDataPara para)`
- `String GetProjectChangeTraceNode(ProjectChangePara para)`
- `GridObject GetProjectPlanChangeTraceData(OnePageGridDataPara para)`
- `GridTitleData GetProjectPlanChangeTraceTitle(GridRowTitlePara para)`
- `GridObject GetProjectInfoChangeHistoryGrid(OnePageGridDataPara para)`
- `String GetFormTypeByProjectID(ProjectChangePara para)`
- `String GetInitChangeFormInfo(ProjectChangePara para)`
- `GridTitleData GetProjectInfoChangeHistoryTitle(GridRowTitlePara para)`
- `GridObject GetProjectInfoChangeHistoryData(OnePageGridDataPara para)`
- `GridObject GetPlanHistoryCompareData(OnePageGridDataPara para)`
- `Boolean AllowChangeProjectInfo(ProjectChangePara para)`
- `Boolean AllowChangeProjectPlan(ProjectChangePara para)`
- `Boolean IsLastProject(ProjectChangePara para)`
- `GridObject GetPlanHistoryCompareStatics(ProjectChangePara para)`
- `GridObject GetPlanCompareStatics(ProjectChangePara para)`

## Hoteam.InforCenter.ProjectCost.Service.dll

### [class] Hoteam.InforCenter.ProjectCost.Service.CostActService
- `Void CommitActCost(ProjectCostPara para)`
- `String IsOverspending(CostActPara para)`
- `Boolean CheckTabAuthority(CostActPara para)`
- `String GetAudituserByCostID(CostActPara para)`
- `String PassActCost(ProjectCostPara para)`
- `String CostActBack(ProjectCostPara para)`
- `String GetBackReason(ProjectCostPara para)`
- `GridObject CostGetListData(CostActPara para)`
- `GridObject CostGetCostauditListData(OnePageGridDataPara para)`
- `GridObject CostGetTaskListData(CostActPara para)`
- `GridTitleData CostGetTitleData(GridRowTitlePara para)`
- `GridObject GetCostUserListData(OnePageGridDataPara para)`
- `List`1 GetPhaseData(CostActPara para)`
- `String CheckImportExcel(CostActPara para)`
- `String GetSpaceCode(CostActPara para)`
- `String GetCostInfoStarEndTimeByPublicCostEUID(CostActPara para)`
- `EditGridTitleData GetImportCostAccEditTitle(GridRowTitlePara para)`
- `String GeneratorCostActLineCode(SessionPara para)`
- `GridObject GetCostTaskGridData(OnePageGridDataPara para)`
- `GridTitleData GetCostTaskGridTitle(GridRowTitlePara para)`
- `GridObject GetActCostRootListData(CostActPara para)`
- `String[] CostValueFormat(CostActPara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostBaseLineService
- `List`1 GetCostBaseLineStructData(CostMakePara para)`
- `String GetCostBaseLinePageData(CostMakePara para)`
- `CostTitleData GetCostBaseLineTitle(CostMakePara para)`
- `String[] GetCostChangeAdjustMoney(CostMakePara para)`
- `String[] GetCostBaseLineCompareAdjustMoney(CostMakePara para)`
- `List`1 GetCostChangeStructData(CostMakePara para)`
- `String GetCostChangePageData(CostMakePara para)`
- `Boolean SaveCostBaseLineByCostExec(CostBaseLinePara para)`
- `CostTitleData GetCostChangeTitle(CostMakePara para)`
- `String GetBaseLineName(CostMakePara para)`
- `String GetBaseLineOrder(CostMakePara para)`
- `List`1 GetCostBaseLineCompareStructData(CostMakePara para)`
- `String GetCostBaseLineComparePageData(CostMakePara para)`
- `CostTitleData GetCostBaseLineCompareTitle(CostMakePara para)`
- `String GeneratorCostBaseLineCode(CostMakePara para)`
- `String CostExportTitleData(CostBaseLinePara para)`
- `GridObject CostGetExportListData(OnePageGridDataPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `GridObject CostBaseLineListGrid(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostChangeService
- `EditGridObject GetProjectChangeApplySystemSetting(CostSystemSettingPara para)`
- `String GetFormTypeByProjectID(ProjectChangePara para)`
- `String GetInitChangeInfo(ProjectChangePara para)`
- `String GetInitChangeFormInfo(ProjectChangePara para)`
- `String GetProjectChangeDataByWorkflow(ProjectChangePara para)`
- `RetProjectChangeCompare GetProjectPlanForCompareByWorkflow(ProjectChangePara para)`
- `String SaveCostChangeApplyReason(SaveObjectDataPara para)`
- `Boolean IsNeedChangeApply(ProjectEmendPara para)`
- `GridObject GetCostHistoryGrid(OnePageGridDataPara para)`
- `String GetItemHistoryPicData(UpdateObjectPara para)`
- `GridTitleData GetCostChangeApplyGridTitle(GridRowTitlePara para)`
- `GridObject GetCostChangeApplyGrid(OnePageGridDataPara para)`
- `String GetCostChangeTraceNode(CostChangePara para)`
- `GridObject GetCostChangeTraceData(OnePageGridDataPara para)`
- `GridTitleData GetCostChangeTraceTitle(GridRowTitlePara para)`
- `String GeneratorCostChangeApplyCode(CostChangePara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostDicService
- `CostTitleData GetCostDicTitle(CostMakePara para)`
- `List`1 GetCostDicStructData(CostMakePara para)`
- `String GetCostDicPageData(CostMakePara para)`
- `List`1 GetCostDicQueryData(CostMakePara para)`
- `List`1 GetCostDicSelectTreeRootData(CostDicPara para)`
- `String CostDicAddEdit(CostDicPara para)`
- `String DeleteCheck(CostDicPara para)`
- `String CostDicDelete(CostDicPara para)`
- `String CheckImportExcel(CostDicPara para)`
- `String CostExportTitleData(SessionPara para)`
- `GridObject CostGetExportListData(SessionPara para)`
- `String GeneratorCostDicLineCode(CostDicPara para)`
- `String UpdateStateID(CostDicPara para)`
- `TreeListRootData GetCostDicRootData(TreeListViewPara para)`
- `Boolean CheckIsCanUseStop(CostDicPara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostExecService
- `List`1 GetCostExecStructData(CostMakePara para)`
- `String GetCostExecPageData(CostMakePara para)`
- `CostTitleData GetCostExecTitle(CostMakePara para)`
- `List`1 GetBaseLineByCostInfoEUID(CostExecPara para)`
- `List`1 GetCostBaseLineRules(CostExecPara para)`
- `String CostExportTitleData(CostExecPara para)`
- `GridObject CostGetExportListData(OnePageGridDataPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `Void CostExecAlertTimer(SessionPara para)`
- `String GetCostBaseLineByCostInfoEUID(CostBaseLinePara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostMakeService
- `List`1 GetCostMakeStructData(CostMakePara para)`
- `List`1 GetCostTreeNode(TreeViewPara para)`
- `String GetCostMakePageData(CostMakePara para)`
- `CostTitleData GetCostMakeTitle(CostMakePara para)`
- `Boolean SaveCostMakeData(CostMakePara para)`
- `EditGridObject GetEditGridData(SessionPara para)`
- `EditGridObject GetCostPhaseSpaceDataGridList(OnePageGridDataPara para)`
- `String GetCostAmount(SaveObjectDataPara para)`
- `String GetCheckoutState(SaveObjectDataPara para)`
- `String GetCostSpaceAmount(SaveObjectDataPara para)`
- `String SaveCost(SaveObjectDataPara para)`
- `String DeleteCost(SaveObjectDataPara para)`
- `String PublishCost(SaveObjectDataPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `String StartChangeCost(SaveObjectDataPara para)`
- `String CancelChangeCost(SaveObjectDataPara para)`
- `String CloseCost(SaveObjectDataPara para)`
- `List`1 GetCostLifeCircleState(SessionPara para)`
- `Boolean SetCheckOutState(CostMakePara para)`
- `Boolean IsCanEdit(CostMakePara para)`
- `Boolean CheckIsEditPermission(CostMakePara para)`
- `Boolean GetCostCountByProjectEUID(GetObjectDataPara para)`
- `String GetCostInfoByProjectEUID(GetObjectDataPara para)`
- `String AddSubject(CostMakePara para)`
- `GridObject GetTaskSecondPageGridData(OnePageGridDataPara para)`
- `Boolean RemoveCostSubject(CostMakePara para)`
- `String CheckSubject(CostMakePara para)`
- `Boolean CheckIsSave(CostMakePara para)`
- `String GetAllSubject(CostMakePara para)`
- `Boolean AddSpace(CostMakePara para)`
- `Boolean CheckAddSpace(CostMakePara para)`
- `Boolean CheckAddSpaceIsAmount(CostMakePara para)`
- `Boolean CheckCostIsPublish(CostMakePara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostStatisticService
- `GridObject GetCostItemCompBarChartData(CostStatisticPara para)`
- `GridObject NewGetCostItemCompBarChartData(CostStatisticPara para)`
- `GridObject GetProjectCountAmountChartData(CostStatisticPara para)`
- `GridObject GetPortalActWaitSubmitData(CostStatisticPara para)`
- `GridObject GetCostPieData(CostStatisticPara para)`
- `Int32 GetCostPieDataNum(CostStatisticPara para)`
- `List`1 GetCostProgressPageData(CostStatisticPara para)`

### [class] Hoteam.InforCenter.ProjectCost.Service.CostTemplateService
- `String GetCostTemplateInfoByProjectTemplateID(GetObjectDataPara para)`
- `String SaveCostTemplate(SaveObjectDataPara para)`
- `List`1 GetCostTemplateStructData(CostMakePara para)`
- `String GetCostTemplatePageData(CostMakePara para)`
- `CostTitleData GetCostTemplateTitle(CostMakePara para)`
- `String CostTemplateDeleteCheck(CostDicPara para)`
- `TreeListRootData GetCostTemplateRootData(TreeListViewPara para)`
- `String AddSubject(CostMakePara para)`
- `Boolean RemoveCostSubject(CostMakePara para)`
- `Boolean CheckSubject(CostMakePara para)`
- `List`1 GetProjectTemplateAllNode(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostActService
- `Void CommitActCost(ProjectCostPara para)`
- `String IsOverspending(CostActPara para)`
- `Boolean CheckTabAuthority(CostActPara para)`
- `String GetAudituserByCostID(CostActPara para)`
- `String PassActCost(ProjectCostPara para)`
- `String CostActBack(ProjectCostPara para)`
- `String GetBackReason(ProjectCostPara para)`
- `GridObject CostGetListData(CostActPara para)`
- `GridObject CostGetCostauditListData(OnePageGridDataPara para)`
- `GridObject CostGetTaskListData(CostActPara para)`
- `GridTitleData CostGetTitleData(GridRowTitlePara para)`
- `GridObject GetCostUserListData(OnePageGridDataPara para)`
- `List`1 GetPhaseData(CostActPara para)`
- `String CheckImportExcel(CostActPara para)`
- `String GetSpaceCode(CostActPara para)`
- `String GetCostInfoStarEndTimeByPublicCostEUID(CostActPara para)`
- `String GeneratorCostActLineCode(SessionPara para)`
- `GridObject GetCostTaskGridData(OnePageGridDataPara para)`
- `GridTitleData GetCostTaskGridTitle(GridRowTitlePara para)`
- `EditGridTitleData GetImportCostAccEditTitle(GridRowTitlePara para)`
- `GridObject GetActCostRootListData(CostActPara para)`
- `String[] CostValueFormat(CostActPara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostBaseLineService
- `CostTitleData GetCostBaseLineTitle(CostMakePara para)`
- `String GetCostBaseLinePageData(CostMakePara para)`
- `List`1 GetCostBaseLineStructData(CostMakePara para)`
- `String[] GetCostChangeAdjustMoney(CostMakePara para)`
- `String[] GetCostBaseLineCompareAdjustMoney(CostMakePara para)`
- `CostTitleData GetCostChangeTitle(CostMakePara para)`
- `String GetCostChangePageData(CostMakePara para)`
- `List`1 GetCostChangeStructData(CostMakePara para)`
- `Boolean SaveCostBaseLineByCostExec(CostBaseLinePara para)`
- `String GetBaseLineName(CostMakePara para)`
- `String GetBaseLineOrder(CostMakePara para)`
- `CostTitleData GetCostBaseLineCompareTitle(CostMakePara para)`
- `String GetCostBaseLineComparePageData(CostMakePara para)`
- `List`1 GetCostBaseLineCompareStructData(CostMakePara para)`
- `String GeneratorCostBaseLineCode(CostMakePara para)`
- `String CostExportTitleData(CostBaseLinePara para)`
- `GridObject CostGetExportListData(OnePageGridDataPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `GridObject CostBaseLineListGrid(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostChangeService
- `EditGridObject GetProjectChangeApplySystemSetting(CostSystemSettingPara para)`
- `String GetFormTypeByProjectID(ProjectChangePara para)`
- `String GetInitChangeInfo(ProjectChangePara para)`
- `String GetInitChangeFormInfo(ProjectChangePara para)`
- `String GetProjectChangeDataByWorkflow(ProjectChangePara para)`
- `RetProjectChangeCompare GetProjectPlanForCompareByWorkflow(ProjectChangePara para)`
- `String SaveCostChangeApplyReason(SaveObjectDataPara para)`
- `Boolean IsNeedChangeApply(ProjectEmendPara para)`
- `GridObject GetCostHistoryGrid(OnePageGridDataPara para)`
- `String GetItemHistoryPicData(UpdateObjectPara para)`
- `GridTitleData GetCostChangeApplyGridTitle(GridRowTitlePara para)`
- `GridObject GetCostChangeApplyGrid(OnePageGridDataPara para)`
- `String GetCostChangeTraceNode(CostChangePara para)`
- `GridObject GetCostChangeTraceData(OnePageGridDataPara para)`
- `GridTitleData GetCostChangeTraceTitle(GridRowTitlePara para)`
- `String GeneratorCostChangeApplyCode(CostChangePara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostDicService
- `List`1 GetCostDicSelectTreeRootData(CostDicPara para)`
- `CostTitleData GetCostDicTitle(CostMakePara para)`
- `String GetCostDicPageData(CostMakePara para)`
- `List`1 GetCostDicStructData(CostMakePara para)`
- `String CostDicAddEdit(CostDicPara para)`
- `String DeleteCheck(CostDicPara para)`
- `String CostDicDelete(CostDicPara para)`
- `String CheckImportExcel(CostDicPara para)`
- `String CostExportTitleData(SessionPara para)`
- `GridObject CostGetExportListData(SessionPara para)`
- `List`1 GetCostDicQueryData(CostMakePara para)`
- `String GeneratorCostDicLineCode(CostDicPara para)`
- `String UpdateStateID(CostDicPara para)`
- `TreeListRootData GetCostDicRootData(TreeListViewPara para)`
- `Boolean CheckIsCanUseStop(CostDicPara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostExecService
- `CostTitleData GetCostExecTitle(CostMakePara para)`
- `String GetCostExecPageData(CostMakePara para)`
- `List`1 GetCostExecStructData(CostMakePara para)`
- `List`1 GetBaseLineByCostInfoEUID(CostExecPara para)`
- `List`1 GetCostBaseLineRules(CostExecPara para)`
- `String CostExportTitleData(CostExecPara para)`
- `GridObject CostGetExportListData(OnePageGridDataPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `Void CostExecAlertTimer(SessionPara para)`
- `String GetCostBaseLineByCostInfoEUID(CostBaseLinePara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostMakeService
- `List`1 GetCostTreeNode(TreeViewPara para)`
- `CostTitleData GetCostMakeTitle(CostMakePara para)`
- `String GetCostMakePageData(CostMakePara para)`
- `List`1 GetCostMakeStructData(CostMakePara para)`
- `Boolean SaveCostMakeData(CostMakePara para)`
- `EditGridObject GetEditGridData(SessionPara para)`
- `EditGridObject GetCostPhaseSpaceDataGridList(OnePageGridDataPara para)`
- `String GetCostAmount(SaveObjectDataPara para)`
- `String GetCheckoutState(SaveObjectDataPara para)`
- `String GetCostSpaceAmount(SaveObjectDataPara para)`
- `String SaveCost(SaveObjectDataPara para)`
- `String DeleteCost(SaveObjectDataPara para)`
- `String PublishCost(SaveObjectDataPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `String StartChangeCost(SaveObjectDataPara para)`
- `String CancelChangeCost(SaveObjectDataPara para)`
- `String CloseCost(SaveObjectDataPara para)`
- `List`1 GetCostLifeCircleState(SessionPara para)`
- `Boolean SetCheckOutState(CostMakePara para)`
- `Boolean IsCanEdit(CostMakePara para)`
- `Boolean CheckIsEditPermission(CostMakePara para)`
- `Boolean GetCostCountByProjectEUID(GetObjectDataPara para)`
- `String GetCostInfoByProjectEUID(GetObjectDataPara para)`
- `String AddSubject(CostMakePara para)`
- `GridObject GetTaskSecondPageGridData(OnePageGridDataPara para)`
- `Boolean RemoveCostSubject(CostMakePara para)`
- `String CheckSubject(CostMakePara para)`
- `Boolean CheckIsSave(CostMakePara para)`
- `String GetAllSubject(CostMakePara para)`
- `Boolean AddSpace(CostMakePara para)`
- `Boolean CheckAddSpace(CostMakePara para)`
- `Boolean CheckAddSpaceIsAmount(CostMakePara para)`
- `Boolean CheckCostIsPublish(CostMakePara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostStatisticService
- `GridObject GetCostItemCompBarChartData(CostStatisticPara para)`
- `GridObject NewGetCostItemCompBarChartData(CostStatisticPara para)`
- `GridObject GetProjectCountAmountChartData(CostStatisticPara para)`
- `GridObject GetPortalActWaitSubmitData(CostStatisticPara para)`
- `GridObject GetCostPieData(CostStatisticPara para)`
- `Int32 GetCostPieDataNum(CostStatisticPara para)`
- `List`1 GetCostProgressPageData(CostStatisticPara para)`

### [interface] Hoteam.InforCenter.ProjectCost.Service.ICostTemplateService
- `String GetCostTemplateInfoByProjectTemplateID(GetObjectDataPara para)`
- `CostTitleData GetCostTemplateTitle(CostMakePara para)`
- `String GetCostTemplatePageData(CostMakePara para)`
- `List`1 GetCostTemplateStructData(CostMakePara para)`
- `String CostTemplateDeleteCheck(CostDicPara para)`
- `TreeListRootData GetCostTemplateRootData(TreeListViewPara para)`
- `String AddSubject(CostMakePara para)`
- `Boolean RemoveCostSubject(CostMakePara para)`
- `Boolean CheckSubject(CostMakePara para)`
- `List`1 GetProjectTemplateAllNode(OnePageGridDataPara para)`

## Hoteam.InforCenter.ProjectEps.Service.dll

### [interface] Hoteam.InforCenter.ProjectEps.Service.IProjectEpsService
- `TreeListRootData GetEpsRootData(TreeListViewPara para)`
- `TreeListChildData GetEpsChildData(TreeListViewPara para)`
- `String SaveQuickEPS(QuickEpsPara para)`
- `String SaveObjectService(SaveEpsPara para)`
- `TreeRootData GetPermissionEpsTreeNode(SessionPara para)`
- `TreeRootData GetPermissionPortalEpsTreeNode(SessionPara para)`
- `GridObject GetProjectSpaceGridData(OnePageGridDataPara para)`
- `List`1 GetPermissionEpsALLTreeNode(TreeViewPara para)`
- `List`1 GetEPSTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetProtalEPSTreeQueryData(TreeViewQueryPara para)`

### [class] Hoteam.InforCenter.ProjectEps.Service.ProjectEpsService
- `TreeListRootData GetEpsRootData(TreeListViewPara para)`
- `TreeListChildData GetEpsChildData(TreeListViewPara para)`
- `String SaveQuickEPS(QuickEpsPara para)`
- `String SaveObjectService(SaveEpsPara para)`
- `TreeRootData GetPermissionEpsTreeNode(SessionPara para)`
- `TreeRootData GetPermissionPortalEpsTreeNode(SessionPara para)`
- `GridObject GetProjectSpaceGridData(OnePageGridDataPara para)`
- `List`1 GetPermissionEpsALLTreeNode(TreeViewPara para)`
- `List`1 GetEPSTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetProtalEPSTreeQueryData(TreeViewQueryPara para)`

## Hoteam.InforCenter.ProjectPermission.Service.dll

### [class] Hoteam.InforCenter.ProjectPermission.Service.ProjectPermissionService
- `List`1 GetObjectOwnProjectLifeCircleConditionObjectList(SessionPara para)`
- `List`1 GetRoleSelectList(SessionPara para)`
- `List`1 GetProjectPermissionEnable(ProjectActionRulePara para)`
- `Boolean SetProjectPermissionEnable(ProjectActionRulePara para)`
- `String GetLastProjectByProjectEUID(OwnProjectPara para)`
- `GridObject GetProjectTeamPermissionListQUeryData(OnePageGridDataPara para)`

## Hoteam.InforCenter.ProjectPlan.Service.dll

### [interface] Hoteam.InforCenter.ProjectPlan.Service.IProjectPlanService
- `String LoadWbsXml(ProjectPara para)`
- `String GetImportTaskXmlFromTemplate(ProjectPara para)`
- `String ImportMSETaskXml(MSETask para)`
- `ProjectPara SavePlan(ProjectPara para)`
- `ProjectPara AuthorityResolve(ProjectPara para)`
- `String LoadTaskTemplateWbsXml(ProjectPara para)`
- `ProjectPara SaveTaskTemplateWbs(ProjectPara para)`
- `GridObject GetPlanPublishLevelListOnePageGridData(PlanPublishLevel para)`
- `List`1 GetPlanPublishLevelDDL(ProjectPara para)`
- `ProjectPara PublishPlanRecordParam(ProjectPara para)`
- `String LoadCalendarXml(ProjectPara para)`
- `ProjectPara SaveCalendar(ProjectPara para)`
- `List`1 LoadCalendarType(ProjectPara para)`
- `GanttData GetProjectPlanGantData(ProjectPara para)`
- `String GetfollowupProjectPlanGantData(ProjectPara para)`
- `String GetFollowupTemplatePlanGantData(ProjectPara para)`
- `ProjectPara SetDefaultCalendar(ProjectPara para)`
- `ProjectPara CopyCalendar(ProjectPara para)`
- `String ImportProject(ImportProjectPara para)`
- `String ExportMpp(ProjectPara para)`
- `String ExportMppNew(ProjectPara para)`
- `ProjectPara SignIn(ProjectPara para)`
- `ProjectPara SignOut(ProjectPara para)`
- `String GetTaskTemplateDelivery(ProjectPara para)`
- `ProjectPara GetCanPublish(ProjectPara para)`
- `Boolean PublishLevelIsMilestone(ProjectPara para)`
- `String CanImport(ProjectPara para)`
- `String CanSignOut(ProjectPara para)`
- `String UpdateCheckOutTime(ProjectPara para)`
- `ProjectPara GetPlanIsChang(ProjectPara para)`
- `String GetProjectIdByTaskId(ProjectPara para)`
- `String ImportProjectTemplanPlan(ImportProjectPara para)`
- `String GetImportPlanData(ImportProjectPara para)`
- `String ImportProjectByCache(ProjectPara para)`
- `String UpdatePlan(ProjectPara para)`
- `Boolean IsCheckTaskDateBeforeSave(ProjectPara para)`
- `Boolean UpdateTaskStateToExecutingTimer(ProjectPara para)`
- `String GetProjectIDByPlanID(ProjectPara para)`
- `Boolean GetCanChangeProjectPlan(ProjectPara para)`
- `String GetDefaultCalendarType(ProjectPara para)`
- `Boolean SetBreakTaskStatus(ProjectPara para)`
- `ProjectPara CancelTaskResolve(ProjectPara para)`
- `String HaveTaskOfNotIntPeriod(ProjectPara para)`
- `String ExportBaseLineMpp(ProjectPara para)`
- `String GetImportTemplatePlanData(ImportProjectPara para)`
- `String ImportProjectTemplateByCache(ProjectPara para)`
- `GridTitleData GetImportTaskListTitle(GridRowTitlePara para)`
- `String GetDocNameById(ProjectPara para)`
- `ExcelExportTemplateDataModel ExportProjectGantt(ProjectPara para)`
- `String GetMenuItemByName(ProjectPara para)`
- `String GetWbsMenuText(ProjectPara para)`
- `ProjectPara SavePlanForExe(ProjectPara para)`
- `List`1 GetProjectList(ProjectPara para)`
- `List`1 GetTaskList(ProjectPara para)`
- `String IsCheckTaskDateBeforeSaveForExe(ProjectPara para)`
- `List`1 GetAllTaskDeliveryList(ProjectPara para)`
- `GanttData GetTemplatePlanGantData(ProjectPara para)`
- `String GetPlanIdByProjectId(ProjectPara para)`
- `String UpdateWbsState(ProjectPara para)`
- `Boolean CreateCalendar(ProjectPara para)`
- `Boolean EmpowerToResolve(ProjectPara para)`
- `Boolean GetResolveTask(ProjectPara para)`
- `Boolean MultiTaskResolvePulishWorkFlowState(ProjectWorkflowPara para)`
- `String GetPmtaskForResolvingPublish(ProjectWorkflowPara para)`
- `GridObject GetImportTaskListData(OnePageGridDataPara para)`
- `String ClearCache(ImportProjectPara para)`
- `Boolean WbsSaveUserInfoVersion(ImportProjectPara para)`
- `GanttData GetSelectProjectPlanResolveGantData(ProjectPara para)`
- `GanttData GetthreelayersProjectPlanResolveGantData(ProjectPara para)`
- `String GetfollowupProjectPlanResolveGantData(ProjectPara para)`
- `String PlanResolveGetProject(ProjectPara para)`
- `GanttData GetMyResolveTaskGantData(ProjectPara para)`
- `GanttData GetLevelProjectPlanResolveGantData(ProjectPara para)`
- `Boolean CanStartMultiTaskResolve(ProjectWorkflowPara para)`
- `String GetfollowupPlanResolveGantDataCheck(ProjectPara para)`
- `Boolean GetExitDeliveryByFId(ProjectPara para)`
- `List`1 ChackDataBforeImport(ImportProjectPara para)`
- `Boolean IsLoadXml(SessionPara para)`
- `String IsLeaf(ProjectPara para)`
- `Boolean IsNetWindows(SessionPara para)`
- `Int32 GetProjectShowTaskLevelSetting(SessionPara para)`
- `String CheckTaskData(ProjectPara para)`
- `String CheckAllProjectTaskData(ProjectPara para)`
- `String GetPlan(ProjectPara para)`
- `Boolean DecompositionPublicAuto(ProjectPara para)`

### [class] Hoteam.InforCenter.ProjectPlan.Service.ProjectPlanService
- `String LoadWbsXml(ProjectPara para)`
- `String GetImportTaskXmlFromTemplate(ProjectPara para)`
- `Boolean DecompositionPublicAuto(ProjectPara para)`
- `ProjectPara SavePlan(ProjectPara para)`
- `ProjectPara AuthorityResolve(ProjectPara para)`
- `String LoadTaskTemplateWbsXml(ProjectPara para)`
- `ProjectPara SaveTaskTemplateWbs(ProjectPara para)`
- `GridObject GetPlanPublishLevelListOnePageGridData(PlanPublishLevel para)`
- `ProjectPara PublishPlanRecordParam(ProjectPara para)`
- `List`1 GetPlanPublishLevelDDL(ProjectPara para)`
- `ProjectPara GetCanPublish(ProjectPara para)`
- `Boolean PublishLevelIsMilestone(ProjectPara para)`
- `String LoadCalendarXml(ProjectPara para)`
- `ProjectPara SaveCalendar(ProjectPara para)`
- `List`1 LoadCalendarType(ProjectPara para)`
- `GanttData GetProjectPlanGantData(ProjectPara para)`
- `String GetfollowupProjectPlanGantData(ProjectPara para)`
- `ProjectPara SetDefaultCalendar(ProjectPara para)`
- `ProjectPara CopyCalendar(ProjectPara para)`
- `String ImportProject(ImportProjectPara para)`
- `String ImportProjectByCache(ProjectPara para)`
- `String ExportMpp(ProjectPara para)`
- `String ExportMppNew(ProjectPara para)`
- `ProjectPara SignIn(ProjectPara para)`
- `ProjectPara SignOut(ProjectPara para)`
- `String GetTaskTemplateDelivery(ProjectPara para)`
- `String CanImport(ProjectPara para)`
- `String CanSignOut(ProjectPara para)`
- `String UpdateCheckOutTime(ProjectPara para)`
- `ProjectPara GetPlanIsChang(ProjectPara para)`
- `String GetProjectIdByTaskId(ProjectPara para)`
- `String ImportProjectTemplanPlan(ImportProjectPara para)`
- `String GetImportPlanData(ImportProjectPara para)`
- `String ImportMSETaskXml(MSETask para)`
- `String UpdatePlan(ProjectPara para)`
- `Boolean IsCheckTaskDateBeforeSave(ProjectPara para)`
- `Boolean UpdateTaskStateToExecutingTimer(ProjectPara para)`
- `String GetProjectIDByPlanID(ProjectPara para)`
- `Boolean GetCanChangeProjectPlan(ProjectPara para)`
- `String GetDefaultCalendarType(ProjectPara para)`
- `Boolean SetBreakTaskStatus(ProjectPara para)`
- `ProjectPara CancelTaskResolve(ProjectPara para)`
- `String HaveTaskOfNotIntPeriod(ProjectPara para)`
- `String ExportBaseLineMpp(ProjectPara para)`
- `String GetImportTemplatePlanData(ImportProjectPara para)`
- `String ImportProjectTemplateByCache(ProjectPara para)`
- `GridTitleData GetImportTaskListTitle(GridRowTitlePara para)`
- `String GetDocNameById(ProjectPara para)`
- `ExcelExportTemplateDataModel ExportProjectGantt(ProjectPara para)`
- `String GetMenuItemByName(ProjectPara para)`
- `String GetWbsMenuText(ProjectPara para)`
- `ProjectPara SavePlanForExe(ProjectPara para)`
- `List`1 GetProjectList(ProjectPara para)`
- `List`1 GetTaskList(ProjectPara para)`
- `String IsCheckTaskDateBeforeSaveForExe(ProjectPara para)`
- `ProjectPara SignOutForExe(ProjectPara para)`
- `List`1 GetAllTaskDeliveryList(ProjectPara para)`
- `GanttData GetTemplatePlanGantData(ProjectPara para)`
- `String GetPlanIdByProjectId(ProjectPara para)`
- `String UpdateWbsState(ProjectPara para)`
- `Boolean CreateCalendar(ProjectPara para)`
- `Boolean EmpowerToResolve(ProjectPara para)`
- `Boolean GetResolveTask(ProjectPara para)`
- `Boolean MultiTaskResolvePulishWorkFlowState(ProjectWorkflowPara para)`
- `String GetPmtaskForResolvingPublish(ProjectWorkflowPara para)`
- `Boolean CanStartMultiTaskResolve(ProjectWorkflowPara para)`
- `GridObject GetImportTaskListData(OnePageGridDataPara para)`
- `String ClearCache(ImportProjectPara para)`
- `Boolean WbsSaveUserInfoVersion(ImportProjectPara para)`
- `GanttData GetSelectProjectPlanResolveGantData(ProjectPara para)`
- `GanttData GetthreelayersProjectPlanResolveGantData(ProjectPara para)`
- `String GetfollowupProjectPlanResolveGantData(ProjectPara para)`
- `String GetfollowupPlanResolveGantDataCheck(ProjectPara para)`
- `String PlanResolveGetProject(ProjectPara para)`
- `GanttData GetMyResolveTaskGantData(ProjectPara para)`
- `GanttData GetLevelProjectPlanResolveGantData(ProjectPara para)`
- `Boolean GetExitDeliveryByFId(ProjectPara para)`
- `List`1 ChackDataBforeImport(ImportProjectPara para)`
- `String GetFollowupTemplatePlanGantData(ProjectPara para)`
- `Boolean IsLoadXml(SessionPara para)`
- `Boolean IsNetWindows(SessionPara para)`
- `String IsLeaf(ProjectPara para)`
- `Int32 GetProjectShowTaskLevelSetting(SessionPara para)`
- `String CheckTaskData(ProjectPara para)`
- `String CheckAllProjectTaskData(ProjectPara para)`
- `String GetPlan(ProjectPara para)`

## Hoteam.InforCenter.ProjectPortal.Service.dll

### [interface] Hoteam.InforCenter.ProjectPortal.Service.IProjectPortalService
- `GridObject GetPlanProgressCompChartData(SessionPara para)`
- `GridObject GetProjectStatusGridObject(SessionPara para)`
- `GridObject GetProjectStatusPieData(SessionPara para)`
- `GridObject GetProjectStatusData(SessionPara para)`
- `GridObject GetProjectStatusPieDataByProjectId(PortalPara para)`
- `GridObject GetProjectAllHoursChart(PortalPara para)`
- `GridObject ProjectTeamMemberHoursChars(PortalPara para)`
- `GridObject GetWeekTaskGridData(PortalPara para)`
- `List`1 GetProjectListByUserID(SessionPara para)`
- `GridObject GetProjectTaskProcessChartData(PortalPara para)`
- `GridObject GetProjectTeamHoursChart(PortalPara para)`
- `GridObject GetTeamPerformGridData(PortalPara para)`
- `GridObject GetMileStoneTaskGridData(PortalPara para)`
- `GridObject GetMemberExctingGridData(PortalPara para)`
- `GridObject GetProjectKeyTaskChart(PortalPara para)`
- `GridObject GetProjectKeyTaskList(PortalPara para)`
- `GridObject GetLeaderProjectStatusPie(PortalPara para)`
- `GridObject NewGetLeaderProjectStatusPie(PortalPara para)`
- `GridObject GetLeaderProjectLifecyclePie(PortalPara para)`
- `GridObject GetLeaderProjectLevelPie(PortalPara para)`
- `GridObject GetLeaderProjectPhasePie(PortalPara para)`
- `GridObject GetProjectMileStoneStatusPie(PortalPara para)`
- `GridObject NewGetProjectTypeProgress(PortalPara para)`
- `GridObject GetProjectTypeProgress(PortalPara para)`
- `GridObject GetProjectManager(PortalPara para)`
- `GridObject GetDepartment(PortalPara para)`
- `GridObject GetAttentionProject(PortalPara para)`
- `GridObject GetMyProjectGridData(SessionPara para)`
- `GridObject GetMyJoinProjectGrid(SessionPara para)`
- `String GetProjectProgressInfo(PortalPara para)`
- `GridObject GetDelayTaskByProjectID(PortalPara para)`
- `GridObject GetProjectHoursChart(PortalPara para)`
- `GridObject GetProjectResourceHoursChart(PortalPara para)`
- `GridObject GetProjectListHoursChart(PortalPara para)`
- `GridObject GetProjectProgressChartDataByProjectId(PortalPara para)`
- `GridObject GetTopProjectWorkLine(PortalPara para)`
- `GridObject GetDelayProject(PortalPara para)`
- `GridObject NewGetDelayProject(PortalPara para)`
- `GridTitleData GetProjectMileStoneTitle(PortalPara para)`
- `GridObject GetProjectMileStoneData(PortalPara para)`
- `GridObject GetImportantProject(PortalPara para)`
- `GridObject NewGetMainFlatCountInfo(SessionPara para)`
- `GridObject NewGetPdmAndTaskCountInfo(SessionPara para)`
- `GridObject GetMainFlatCountInfo(SessionPara para)`
- `String GetProjectDataByName(PortalPara para)`
- `String PortalProjectDays(PortalPara para)`
- `String GetObjectData(PortalPara para)`
- `GridObject GetLeaderProjectTypePie(PortalPara para)`
- `GridObject GetLeaderProjectDepartmentPie(PortalPara para)`
- `GridObject GetLeaderProjectEPSPie(PortalPara para)`

### [class] Hoteam.InforCenter.ProjectPortal.Service.ProjectPortalService
- `GridObject GetAttentionProject(PortalPara para)`
- `GridObject NewGetLeaderProjectStatusPie(PortalPara para)`
- `GridObject GetLeaderProjectStatusPie(PortalPara para)`
- `GridObject GetProjectStatusData(SessionPara para)`
- `GridObject GetLeaderProjectLifecyclePie(PortalPara para)`
- `GridObject GetLeaderProjectLevelPie(PortalPara para)`
- `GridObject GetLeaderProjectPhasePie(PortalPara para)`
- `GridObject GetMileStoneTaskGridData(PortalPara para)`
- `GridObject GetMemberExctingGridData(PortalPara para)`
- `GridObject GetMyJoinProjectGrid(SessionPara para)`
- `GridObject GetMyProjectGridData(SessionPara para)`
- `GridObject GetPlanProgressCompChartData(SessionPara para)`
- `GridObject GetProjectKeyTaskChart(PortalPara para)`
- `GridObject GetProjectKeyTaskList(PortalPara para)`
- `List`1 GetProjectListByUserID(SessionPara para)`
- `GridObject GetProjectMileStoneStatusPie(PortalPara para)`
- `String GetProjectProgressInfo(PortalPara para)`
- `GridObject GetProjectStatusGridObject(SessionPara para)`
- `GridObject GetProjectStatusPieData(SessionPara para)`
- `GridObject GetProjectStatusPieDataByProjectId(PortalPara para)`
- `GridObject GetProjectTaskProcessChartData(PortalPara para)`
- `GridObject GetProjectTeamHoursChart(PortalPara para)`
- `GridObject GetProjectTypeProgress(PortalPara para)`
- `GridObject NewGetProjectTypeProgress(PortalPara para)`
- `GridObject GetProjectManager(PortalPara para)`
- `GridObject GetDepartment(PortalPara para)`
- `GridObject GetTeamPerformGridData(PortalPara para)`
- `GridObject GetWeekTaskGridData(PortalPara para)`
- `GridObject GetDelayTaskByProjectID(PortalPara para)`
- `GridObject GetProjectHoursChart(PortalPara para)`
- `GridObject GetProjectResourceHoursChart(PortalPara para)`
- `GridObject GetProjectListHoursChart(PortalPara para)`
- `GridObject GetProjectProgressChartDataByProjectId(PortalPara para)`
- `GridObject GetProjectAllHoursChart(PortalPara para)`
- `GridObject ProjectTeamMemberHoursChars(PortalPara para)`
- `GridObject GetTopProjectWorkLine(PortalPara para)`
- `GridObject GetDelayProject(PortalPara para)`
- `GridObject NewGetDelayProject(PortalPara para)`
- `GridTitleData GetProjectMileStoneTitle(PortalPara para)`
- `GridObject GetProjectMileStoneData(PortalPara para)`
- `GridObject GetImportantProject(PortalPara para)`
- `GridObject NewGetMainFlatCountInfo(SessionPara para)`
- `GridObject NewGetPdmAndTaskCountInfo(SessionPara para)`
- `GridObject GetMainFlatCountInfo(SessionPara para)`
- `String GetProjectDataByName(PortalPara para)`
- `String PortalProjectDays(PortalPara para)`
- `String GetObjectData(PortalPara para)`
- `GridObject GetLeaderProjectTypePie(PortalPara para)`
- `GridObject GetLeaderProjectDepartmentPie(PortalPara para)`
- `GridObject GetLeaderProjectEPSPie(PortalPara para)`

## Hoteam.InforCenter.ProjectRole.Service.dll

### [interface] Hoteam.InforCenter.ProjectRole.Service.IProjectRoleSevice
- `Void CheckOperateRoleInfo(ProjectRolePara para)`
- `Dictionary`2 GetProjectRoleItems(SessionPara para)`
- `List`1 GetProjectRoleList(SessionPara para)`

### [class] Hoteam.InforCenter.ProjectRole.Service.ProjectRoleSevice
- `Void CheckOperateRoleInfo(ProjectRolePara para)`
- `Dictionary`2 GetProjectRoleItems(SessionPara para)`
- `List`1 GetProjectRoleList(SessionPara para)`

## Hoteam.InforCenter.ProjectTask.Service.dll

### [class] Hoteam.InforCenter.ProjectTask.Service.ProjectTaskService
- `TreeRootData GetMyTaskTreeRootData(TreeViewPara para)`
- `TreeChildData GetMyTaskTreeChildData(TreeViewPara para)`
- `EditTreeGridRowTitleData GetTaskStructureTitle(TaskStructurePara para)`
- `List`1 GetTaskStructureData(TaskStructurePara para)`
- `GridTitleData GetRecentTaskListTitle(GridRowTitlePara para)`
- `GridObject GetRecentTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetReceiveTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetCreateTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetTaskQueryListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetManagerTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetCheckerTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetFinishedTaskListOnePageGridData(OnePageGridDataPara para)`
- `Void SetTaskRead(TaskObejctInspectorPara para)`
- `GridObject GetProjectTaskReferenceListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetObjectReferenceTaskList(OnePageGridDataPara para)`
- `GridObject GetObjectReferenceProjectList(OnePageGridDataPara para)`
- `GridObject GetSubProjectTaskListOnePageGridData(OnePageGridDataPara para)`
- `Void ReciveProjectTask(TaskObejctInspectorPara para)`
- `Boolean CheckReceivePara(TaskObejctInspectorPara para)`
- `Boolean CheckBeforceTask(TaskObejctInspectorPara para)`
- `Int32 CouldEditTaskSchedule(TaskObejctInspectorPara para)`
- `List`1 GetTaskCalendar(TaskObejctInspectorPara para)`
- `Boolean TaskCommit(TaskCommitPara para)`
- `String EditTask(TaskObejctInspectorPara para)`
- `String TransferCommonTask(TaskObejctInspectorPara para)`
- `List`1 GetProjectResourceList(TaskObejctInspectorPara para)`
- `EditGridRowTitleData GetPostTaskTitleData(GridRowTitlePara para)`
- `EditGridObject GetPostTaskData(TaskEditGridDataPara para)`
- `Boolean CheckTaskType(TaskObejctInspectorPara para)`
- `Boolean CheckTaskState(TaskObejctInspectorPara para)`
- `Void UpdateProgressTimer(SessionPara para)`
- `Void UpdateProgressForOftenTimer(SessionPara para)`
- `Void UpdateProgressForWBSSaveTimer(SessionPara para)`
- `String GetMyTaskTreeCountData(TreeViewPara para)`
- `Boolean CheckCommitTask(TaskObejctInspectorPara para)`
- `String CheckDeliveryInPorjectList(TaskObejctInspectorPara para)`
- `Void UpdateToPublish(TaskObejctInspectorPara para)`
- `GridObject GetPortalGridData(OnePageGridDataPara para)`
- `GridObject GetTaskStatusCount(TaskStructurePara para)`
- `GridObject GetTaskStateCountEachMonth(TaskStructurePara para)`
- `Boolean IsCheckKeyPath(SessionPara para)`
- `Boolean IsCheckMileStones(SessionPara para)`
- `Boolean CancelCheckTask(TaskObejctInspectorPara para)`
- `List`1 GetChildProjectTask(TaskObejctInspectorPara para)`
- `String GetPublishedOrLatestProjectIDByTaskID(TaskObejctInspectorPara para)`
- `String GetProjectIDByTaskID(TaskObejctInspectorPara para)`
- `List`1 GetMyTaskTreeAllData(TreeViewPara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `List`1 GetTaskQueryTreeAllData(TreeViewPara para)`
- `GridObject GetBreakedTaskListOnePageGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetTaskAddWorktimeEditListTitle(GridRowTitlePara para)`
- `EditGridObject GetTaskAddWorktimeEditList(EditGridDataPara para)`
- `GridTitleData GetTaskWorktimeListTitle(GridRowTitlePara para)`
- `GridObject GetTaskWorktimeList(OnePageGridDataPara para)`
- `String GetLastVersionTaskObj(TaskObejctInspectorPara para)`
- `AddLinkMessage AlterTask(TaskAlterPara para)`
- `Void ProjectAlertTimer(SessionPara para)`
- `GridTitleData GetResourceLoadGridTitle(GridRowTitlePara para)`
- `GridObject GetResourceLoadGridData(OnePageGridDataPara para)`
- `String GetResourceLoadTaskSum(ResLoadTaskSum para)`
- `ExcelExportTemplateDataModel ExportResourceLoadTasklist(ResLoadTaskSum para)`
- `Boolean CheckTaskDocExist(TaskObejctInspectorPara para)`
- `GridTitleData GetResourceLoadGridTitleForExe(ResourceLoadGridTitleForExe para)`
- `GridObject GetResourceLoadGridDataForExe(OnePageGridDataParaForExe para)`
- `WCFReturnPara GetResourceLoadTaskSumForExe(ResLoadTaskSum para)`
- `WCFReturnPara GetObjectDataForExe(GetObjectDataPara para)`
- `List`1 ProjectTaskVersionNotLastFinalStateCheck(TaskObejctInspectorPara para)`
- `GridObject GetMyTaskStatistics(SessionPara para)`
- `GridObject NewGetRecieveTaskBoardData(OnePageGridDataPara para)`
- `GridObject GetRecieveTaskBoardData(OnePageGridDataPara para)`
- `String GetQueryViewColumnInfo(OnePageGridDataPara para)`
- `EditGridObject GetTaskEmendSystemSetting(TaskEmendSystemSettingPara para)`
- `String GetInputEmendPosion(TaskAlterPara para)`
- `String CheckTaskIsLeaf(TaskObejctInspectorPara para)`
- `EditTreeGridRowTitleData GetProjectTaskStructureTitle(TaskQueryStructurePara para)`
- `List`1 GetProjectTaskStructureData(TaskQueryStructurePara para)`
- `List`1 GetTaskQueryChildren(TaskQueryStructurePara para)`
- `Boolean IsProcessByTask(TaskObejctInspectorPara para)`
- `GridObject GetPortalTaskListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetTaskResListOnePageGridData(OnePageGridDataPara para)`
- `Void BackupProjectTaskDataTime(SessionPara para)`

## Hoteam.InforCenter.ProjectTeam.Service.dll

### [interface] Hoteam.InforCenter.ProjectTeam.Service.IProjectTeamService
- `String SaveProjectResource(SaveProjectResPara para)`
- `Boolean CheckRemoveResource(EditProjectResPara para)`
- `String DeleteLinkObject(DeleteLinkCusPara para)`
- `Boolean CheckEditResource(EditProjectResPara para)`
- `String GetProjectResouceXml(SaveProjectResPara para)`
- `String GetProjectRole(SaveProjectResPara para)`
- `List`1 GetProjectTeamRoleAllData(TreeViewPara para)`
- `GridObject GetAllProjectRoleData(OnePageGridDataPara para)`
- `List`1 GetProjectTeamByProjectEID(EditProjectResPara para)`
- `List`1 GetBaseObjectListByFilter(ObjectFilterPara para)`
- `List`1 GetProjectTeamRoleSelectList(ProjectTeamRolePara para)`
- `Boolean SaveProjectRole(ProjectTeamRolePara para)`
- `Boolean DeleteRoleLinkObject(DeleteLinkCusPara para)`
- `Void MoveObjectUp(ProjectTeamMovePara para)`
- `Void MoveObjectDown(ProjectTeamMovePara para)`
- `List`1 GetProjectRoleByEID(ProjectTeamRolePara para)`
- `Boolean EditProjectResource(SaveProjectResPara para)`
- `Int32 GetListCount(DeleteLinkCusPara para)`
- `Boolean CheckRemoveProjectRole(EditProjectResPara para)`
- `Void CheckResHaveMoreRole(DeleteLinkCusPara para)`

### [class] Hoteam.InforCenter.ProjectTeam.Service.ProjectTeamService
- `Boolean CheckRemoveResource(EditProjectResPara para)`
- `Boolean CheckRemoveProjectRole(EditProjectResPara para)`
- `Boolean CheckEditResource(EditProjectResPara para)`
- `String SaveProjectResource(SaveProjectResPara para)`
- `String DeleteLinkObject(DeleteLinkCusPara para)`
- `String GetProjectResouceXml(SaveProjectResPara para)`
- `String GetProjectRole(SaveProjectResPara para)`
- `List`1 GetProjectTeamByProjectEID(EditProjectResPara para)`
- `List`1 GetProjectTeamRoleAllData(TreeViewPara para)`
- `GridObject GetAllProjectRoleData(OnePageGridDataPara para)`
- `List`1 GetBaseObjectListByFilter(ObjectFilterPara para)`
- `List`1 GetProjectTeamRoleSelectList(ProjectTeamRolePara para)`
- `Boolean SaveProjectRole(ProjectTeamRolePara para)`
- `Boolean DeleteRoleLinkObject(DeleteLinkCusPara para)`
- `Void MoveObjectUp(ProjectTeamMovePara para)`
- `Void MoveObjectDown(ProjectTeamMovePara para)`
- `List`1 GetProjectRoleByEID(ProjectTeamRolePara para)`
- `Boolean EditProjectResource(SaveProjectResPara para)`
- `Int32 GetListCount(DeleteLinkCusPara para)`
- `Void CheckResHaveMoreRole(DeleteLinkCusPara para)`

## Hoteam.InforCenter.Resource.Service.dll

### [interface] Hoteam.InforCenter.Resource.Service.IResourceService
- `String SetResourceState(ResourceStateDataPara para)`
- `String SaveResourceHR(ResourceHRDataPara para)`
- `Dictionary`2 GetProjectResourceItems(GetResourceItemsPara para)`
- `List`1 GetResourceHrSelectList(SessionPara para)`
- `List`1 GetResourceNoHrSelectList(SessionPara para)`
- `String GetResouceIDByUserID(ResourceHRDataPara para)`
- `String GetResourceLoadData(ResourceLoadPara para)`
- `List`1 GetResourceList(ResourceLoadPara para)`
- `List`1 GetResourceType(SessionPara para)`
- `List`1 GetProjectList(SessionPara para)`
- `List`1 GetResourceByFilter(ResourceLoadPara para)`
- `List`1 GetAllResourceList(SessionPara para)`
- `Boolean CheckCanDelete(ResourceLoadPara para)`
- `String GetGroupRoleList(ResourceLoadPara para)`
- `String GetResourceClassify(ResourceLoadPara para)`
- `ResourceLoadPara GetResourceLoadDataForExe(ResourceLoadPara para)`
- `List`1 GetSubDataModelList(SubDataModelPara para)`
- `GridObject GetAllProjectResourceData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.Resource.Service.ResourceService
- `String SetResourceState(ResourceStateDataPara para)`
- `String SaveResourceHR(ResourceHRDataPara para)`
- `Dictionary`2 GetProjectResourceItems(GetResourceItemsPara para)`
- `List`1 GetResourceHrSelectList(SessionPara para)`
- `List`1 GetResourceNoHrSelectList(SessionPara para)`
- `String GetResourceLoadData(ResourceLoadPara para)`
- `String GetResouceIDByUserID(ResourceHRDataPara para)`
- `List`1 GetResourceList(ResourceLoadPara para)`
- `List`1 GetResourceType(SessionPara para)`
- `List`1 GetProjectList(SessionPara para)`
- `List`1 GetResourceByFilter(ResourceLoadPara para)`
- `List`1 GetAllResourceList(SessionPara para)`
- `Boolean CheckCanDelete(ResourceLoadPara para)`
- `String GetGroupRoleList(ResourceLoadPara para)`
- `String GetResourceClassify(ResourceLoadPara para)`
- `ResourceLoadPara GetResourceLoadDataForExe(ResourceLoadPara para)`
- `List`1 GetSubDataModelList(SubDataModelPara para)`
- `GridObject GetAllProjectResourceData(OnePageGridDataPara para)`

## Hoteam.InforCenter.Risk.Service.dll

### [interface] Hoteam.InforCenter.Risk.Service.IRiskService
- `String GetRiskTreeCountData(TreeViewPara para)`
- `List`1 GetRiskWareHourseAllData(TreeViewPara para)`
- `Boolean CheckRiskAttentioned(RiskPara para)`
- `Boolean CancelAttentionObject(RiskPara para)`
- `String BatchCreateRisk(RiskPara para)`
- `Boolean CheckRiskState(RiskPara para)`
- `EditGridTitleData GetBatchCreateRiskTitleData(GridRowTitlePara para)`
- `String TransferRisk(RiskPara para)`
- `TreeRootData GetRiskTreeRootData(TreeViewPara para)`
- `Boolean SaveRiskAssessInfo(RiskPara para)`
- `String GetRiskAssessInfo(RiskPara para)`
- `Boolean SetRiskTemplateInvalid(RiskPara para)`
- `String UpdateAssess(RiskPara para)`
- `String UseAssess(RiskPara para)`
- `String Assign(RiskPara para)`
- `GridObject GetRiskProjectStatusPie(SessionPara para)`
- `GridObject GetMyRiskGridData(SessionPara para)`
- `String RiskAffectMatrixData(RiskPara para)`
- `TreeRootData GetProjectTypeRootNode(TreeViewPara para)`
- `List`1 GetProjectAllNode(TreeViewPara para)`
- `TreeListRootData GetProjectTaskRootData(TreeListViewPara para)`
- `GridObject GetRiskStatusChart(SessionPara para)`
- `GridObject GetRiskTypeChart(SessionPara para)`
- `GridObject GetProjectRiskTypeByProjectId(RiskPara para)`
- `GridObject GetProjectRiskStateByProjectId(RiskPara para)`
- `GridRowTitleObject GetProjectRiskGridRowTitle(SessionPara para)`
- `GridObject GetProjectRiskGridData(RiskPara para)`
- `Boolean SetAttentionLink(RiskPara para)`
- `Boolean CanDo(RiskPara para)`
- `String GetRiskIDByWorkFlowInfo(RiskPara para)`
- `String GetAimsIDByRiskID(RiskPara para)`
- `TreeRootData GetProjectNodes(TreeViewPara para)`
- `String BatchGetObjListString(RiskPara para)`
- `List`1 GetDownloadFileInfo(RiskPara para)`
- `Boolean BatchDeleteAttach(RiskPara para)`
- `Boolean BatchSetRiskAmis(RiskPara para)`
- `GridObject GetDisposeRiskList(OnePageGridDataPara para)`
- `GridTitleData GetDisposeRiskListTitleData(GridRowTitlePara para)`
- `Boolean SetRiskFavorite(RiskPara para)`
- `EditGridTitleData GetRiskAssessTitleData(GridRowTitlePara para)`
- `EditGridObject GetRiskAssessData(EditGridDataPara para)`
- `Boolean SaveRiskAssessData(RiskPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `Boolean CheckRiskCodeExist(RiskPara para)`
- `List`1 GetRiskLifeCircleState(SessionPara para)`
- `String GetEnumText(SessionPara para)`
- `GridObject GetProjectRiskQueryGridData(OnePageGridDataPara para)`
- `String GetProjectDataByTaskID(RiskPara para)`
- `Boolean MoveAssessStandard(RiskPara para)`
- `Boolean CheckRiskTemplateInvalid(RiskPara para)`
- `String GetRiskStatisticDataRange(RiskPara para)`
- `Boolean UpdateRiskSubmitDate(RiskPara para)`
- `GridObject GetRiskListByStatisticFilter(OnePageGridDataPara para)`
- `GridObject GetRiskQueryGridData(OnePageGridDataPara para)`
- `String GetDefaultProjectType(SessionPara para)`
- `GridObject GetRiskList(OnePageGridDataPara para)`
- `String GetManagerFilter(SessionPara para)`
- `Boolean CheckTemplateBeforeStart(StartWorkflowPagePara para)`
- `GridObject GetMyDisposeRiskGridData(OnePageGridDataPara para)`
- `String GetProjectMangerByEuid(RiskPara para)`

### [interface] Hoteam.InforCenter.Risk.Service.IRiskService2
- `String GetRiskAssessValue(RiskPara para)`
- `GridObject GetRiskAppraiserList(OnePageGridDataPara para)`
- `String GetMyRiskAssessValue(RiskPara para)`
- `String GetExpertIdsByRiskid(RiskPara para)`
- `String GetRiskInfo(RiskPara para)`
- `String GetPMbyRiskid(RiskPara para)`
- `String HasAllAssessFinished(RiskPara para)`
- `GridObject GetMyRiskList(OnePageGridDataPara para)`
- `String AddExpert(RiskPara para)`
- `String GetRiskLevel(RiskPara para)`

### [class] Hoteam.InforCenter.Risk.Service.RiskService2
- `GridObject GetRiskAppraiserList(OnePageGridDataPara para)`
- `String GetRiskAssessValue(RiskPara para)`
- `String GetMyRiskAssessValue(RiskPara para)`
- `String GetExpertIdsByRiskid(RiskPara para)`
- `String GetRiskInfo(RiskPara para)`
- `String GetPMbyRiskid(RiskPara para)`
- `String HasAllAssessFinished(RiskPara para)`
- `GridObject GetMyRiskList(OnePageGridDataPara para)`
- `String AddExpert(RiskPara para)`
- `String GetRiskLevel(RiskPara para)`

### [class] Hoteam.InforCenter.Risk.Service.RiskService
- `String GetRiskTreeCountData(TreeViewPara para)`
- `List`1 GetRiskWareHourseAllData(TreeViewPara para)`
- `Boolean CheckRiskAttentioned(RiskPara para)`
- `Boolean CancelAttentionObject(RiskPara para)`
- `String BatchCreateRisk(RiskPara para)`
- `Boolean CheckRiskState(RiskPara para)`
- `EditGridTitleData GetBatchCreateRiskTitleData(GridRowTitlePara para)`
- `String AddExpert(RiskPara para)`
- `String TransferRisk(RiskPara para)`
- `TreeRootData GetRiskTreeRootData(TreeViewPara para)`
- `Boolean SaveRiskAssessInfo(RiskPara para)`
- `String GetRiskAssessInfo(RiskPara para)`
- `Boolean SetRiskTemplateInvalid(RiskPara para)`
- `String UpdateAssess(RiskPara para)`
- `String UseAssess(RiskPara para)`
- `GridObject GetRiskProjectStatusPie(SessionPara para)`
- `GridObject GetMyRiskGridData(SessionPara para)`
- `String GetAimsIDByRiskID(RiskPara para)`
- `String RiskAffectMatrixData(RiskPara para)`
- `TreeRootData GetProjectTypeRootNode(TreeViewPara para)`
- `String Assign(RiskPara para)`
- `List`1 GetProjectAllNode(TreeViewPara para)`
- `TreeListRootData GetProjectTaskRootData(TreeListViewPara para)`
- `GridObject GetRiskStatusChart(SessionPara para)`
- `GridObject GetRiskTypeChart(SessionPara para)`
- `GridObject GetProjectRiskTypeByProjectId(RiskPara para)`
- `GridObject GetProjectRiskStateByProjectId(RiskPara para)`
- `GridRowTitleObject GetProjectRiskGridRowTitle(SessionPara para)`
- `GridObject GetProjectRiskGridData(RiskPara para)`
- `Boolean SetAttentionLink(RiskPara para)`
- `Boolean CanDo(RiskPara para)`
- `String GetRiskIDByWorkFlowInfo(RiskPara para)`
- `List`1 GetDownloadFileInfo(RiskPara para)`
- `Boolean BatchDeleteAttach(RiskPara para)`
- `TreeRootData GetProjectNodes(TreeViewPara para)`
- `String BatchGetObjListString(RiskPara para)`
- `Boolean BatchSetRiskAmis(RiskPara para)`
- `GridObject GetDisposeRiskList(OnePageGridDataPara para)`
- `GridTitleData GetDisposeRiskListTitleData(GridRowTitlePara para)`
- `Boolean SetRiskFavorite(RiskPara para)`
- `EditGridTitleData GetRiskAssessTitleData(GridRowTitlePara para)`
- `EditGridObject GetRiskAssessData(EditGridDataPara para)`
- `Boolean SaveRiskAssessData(RiskPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `Boolean CheckRiskCodeExist(RiskPara para)`
- `List`1 GetRiskLifeCircleState(SessionPara para)`
- `String GetEnumText(SessionPara para)`
- `GridObject GetProjectRiskQueryGridData(OnePageGridDataPara para)`
- `String GetProjectDataByTaskID(RiskPara para)`
- `Boolean MoveAssessStandard(RiskPara para)`
- `Boolean CheckRiskTemplateInvalid(RiskPara para)`
- `String GetRiskStatisticDataRange(RiskPara para)`
- `Boolean UpdateRiskSubmitDate(RiskPara para)`
- `GridObject GetRiskListByStatisticFilter(OnePageGridDataPara para)`
- `GridObject GetRiskQueryGridData(OnePageGridDataPara para)`
- `String GetDefaultProjectType(SessionPara para)`
- `GridObject GetRiskList(OnePageGridDataPara para)`
- `String GetManagerFilter(SessionPara para)`
- `Boolean CheckTemplateBeforeStart(StartWorkflowPagePara para)`
- `GridObject GetMyDisposeRiskGridData(OnePageGridDataPara para)`
- `String GetProjectMangerByEuid(RiskPara para)`

## Hoteam.InforCenter.ProjectTemplate.Service.dll

### [interface] Hoteam.InforCenter.ProjectTemplate.Service.IProjectTemplateService
- `List`1 GetProjectTypeAllNode(SessionPara para)`
- `List`1 GetProjectTemplateAllNode(ProjectGridDataTemplatePara para)`
- `GridObject GetProjectTemplateGridData(OnePageGridDataPara para)`
- `Boolean AddObjectToProjectFolderTemplate(ProjectTemplatePara para)`
- `Boolean AddObjectToProjectFolderTemplateMultiNoMgs(ProjectTemplatePara para)`
- `List`1 GetProjectTemplateSelectList(ProjectTemplatePara para)`
- `String SaveProjectTemplateData(ProjectTemplateSavePara para)`
- `GridObject GetGridDataByObjectId(ProjectTemplatePara para)`
- `Boolean CheckProjectTempalteNameExist(ProjectTemplateSavePara para)`
- `Boolean CheckLinkExistByChildId(ProjectTemplateSavePara para)`
- `List`1 GetProjectTaskTemplateGridGridRowData(ProjectTemplatePara para)`
- `TreeListRootData GetProjectTaskRootData(TreeListViewPara para)`
- `Boolean CheckLinkExist(ProjectTemplateSavePara para)`
- `String SaveTaskTemplateObjectService(ProjectTemplateSavePara para)`
- `Void DeleteTaskTemplateObjectService(ProjectTemplateSavePara para)`
- `String UpdateTaskTemplateDocName(ProjectTemplateSavePara para)`
- `Boolean TolerantTemplate(ProjectTemplatePara para)`

### [class] Hoteam.InforCenter.ProjectTemplate.Service.ProjectTemplateService
- `GridObject GetGridDataByObjectId(ProjectTemplatePara para)`
- `TreeListRootData GetProjectTaskRootData(TreeListViewPara para)`
- `List`1 GetProjectTaskTemplateGridGridRowData(ProjectTemplatePara para)`
- `Boolean AddObjectToProjectFolderTemplate(ProjectTemplatePara para)`
- `Boolean AddObjectToProjectFolderTemplateMultiNoMgs(ProjectTemplatePara para)`
- `List`1 GetProjectTypeAllNode(SessionPara para)`
- `List`1 GetProjectTemplateAllNode(ProjectGridDataTemplatePara para)`
- `GridObject GetProjectTemplateGridData(OnePageGridDataPara para)`
- `List`1 GetProjectTemplateSelectList(ProjectTemplatePara para)`
- `String SaveProjectTemplateData(ProjectTemplateSavePara para)`
- `Boolean CheckLinkExist(ProjectTemplateSavePara para)`
- `Boolean CheckLinkExistByChildId(ProjectTemplateSavePara para)`
- `Boolean CheckProjectTempalteNameExist(ProjectTemplateSavePara para)`
- `String SaveTaskTemplateObjectService(ProjectTemplateSavePara para)`
- `String UpdateTaskTemplateDocName(ProjectTemplateSavePara para)`
- `Void DeleteTaskTemplateObjectService(ProjectTemplateSavePara para)`
- `Boolean TolerantTemplate(ProjectTemplatePara para)`

## Hoteam.InforCenter.WorkReport.Service.dll

### [interface] Hoteam.InforCenter.WorkReport.Service.IWorkReportService
- `EditGridObject GetDataGridList(OnePageGridDataPara para)`
- `GridObject GetBackWorkLog(OnePageGridDataPara para)`
- `GridObject GetAuditWorkLogList(OnePageGridDataPara para)`
- `GridObject GetAuditedWorkLogList(OnePageGridDataPara para)`
- `Boolean BatchSubmitWorkLog(WorkReportPara para)`
- `GridObject GetHisWorkLogList(OnePageGridDataPara para)`
- `GridObject GetSearchWorkLogList(OnePageGridDataPara para)`
- `String GetRemarkList(WorkReportPara para)`
- `String GetHisDateDaysPara(WorkReportPara para)`
- `List`1 GetWorkLogAllNode(SessionPara para)`
- `WorkReportNodeData GetWorkLogAllNodeData(SessionPara para)`
- `Boolean IsMainResource(WorkReportPara para)`
- `Boolean UpdateTaskSchedule(WorkReportPara para)`
- `EditGridObject LoadTaskList(OnePageGridDataPara para)`
- `String SaveWorkLogObject(WorkReportPara para)`
- `Int32 GetMaxHour(SessionPara para)`
- `GridObject LoadWorkReportForTaskObject(OnePageGridDataPara para)`
- `Void DeleteRemark(WorkReportPara para)`
- `EditGridTitleData GetTitle(GridRowTitlePara para)`
- `Dictionary`2 GetMyJoinProjectList(SessionPara para)`
- `Dictionary`2 GetAllProjectList(SessionPara para)`
- `List`1 GetAboutPersonList(SessionPara para)`
- `List`1 GetAboutGroupInfo(SessionPara para)`
- `List`1 GetWorkHours(WorkReportPara para)`
- `String BatchSaveWorkLogObject(WorkReportPara para)`
- `TreeChildData GetProjectWorkReportChildNode(TreeViewPara para)`
- `GridObject GetProjectWorkLogGridData(OnePageGridDataPara para)`
- `Boolean CheckBeforeSubmit(WorkReportPara para)`
- `GridTitleData GetTitleCommon(GridRowTitlePara para)`
- `GridObject GetGridDataCommon(OnePageGridDataPara para)`
- `Boolean SubmitWorkLog(WorkReportPara para)`
- `Void UpdateRemarkCount(WorkReportPara para)`
- `Boolean BatchSubmitHisWorkLog(WorkReportPara para)`
- `GridObject GetAttentionWorkLog(OnePageGridDataPara para)`
- `List`1 GetWorkLogAuditor(WorkReportPara para)`
- `Dictionary`2 GetSearchProjectList(WorkReportPara para)`
- `Dictionary`2 GetSearchProjectUIDList(WorkReportPara para)`
- `Boolean AuditWorkLogFlag(SessionPara para)`
- `Boolean UpdateTaskInfo(WorkReportPara para)`
- `Boolean BatchUpdateTaskInfo(WorkReportPara para)`
- `Boolean AddRemarkRemind(WorklogInternalMailPara para)`
- `List`1 GetWorkHourstring(WorkReportPara para)`
- `String GetWorkReportTreeCountData(TreeViewPara para)`
- `Void DeleteWorkLogData(WorkReportPara para)`
- `GridObject GetPortalWorklogListOnePageGridData(OnePageGridDataPara para)`
- `GridTitleData GetTitleTaskWorkCommon(GridRowTitlePara para)`
- `GridObject GetPortalTaskWorkListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetPortalTeamHoursListOnePageGridData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.WorkReport.Service.WorkReportService
- `EditGridObject GetDataGridList(OnePageGridDataPara para)`
- `GridObject GetBackWorkLog(OnePageGridDataPara para)`
- `GridObject GetAuditWorkLogList(OnePageGridDataPara para)`
- `GridObject GetAuditedWorkLogList(OnePageGridDataPara para)`
- `GridObject GetSearchWorkLogList(OnePageGridDataPara para)`
- `Boolean BatchSubmitWorkLog(WorkReportPara para)`
- `Boolean SubmitWorkLog(WorkReportPara para)`
- `Boolean CheckBeforeSubmit(WorkReportPara para)`
- `GridObject GetHisWorkLogList(OnePageGridDataPara para)`
- `String GetRemarkList(WorkReportPara para)`
- `String GetHisDateDaysPara(WorkReportPara para)`
- `List`1 GetWorkLogAllNode(SessionPara para)`
- `WorkReportNodeData GetWorkLogAllNodeData(SessionPara para)`
- `Boolean UpdateTaskSchedule(WorkReportPara para)`
- `Boolean IsMainResource(WorkReportPara para)`
- `EditGridObject LoadTaskList(OnePageGridDataPara para)`
- `String SaveWorkLogObject(WorkReportPara para)`
- `Int32 GetMaxHour(SessionPara para)`
- `GridObject LoadWorkReportForTaskObject(OnePageGridDataPara para)`
- `Void DeleteRemark(WorkReportPara para)`
- `EditGridTitleData GetTitle(GridRowTitlePara para)`
- `Dictionary`2 GetMyJoinProjectList(SessionPara para)`
- `Dictionary`2 GetAllProjectList(SessionPara para)`
- `List`1 GetAboutPersonList(SessionPara para)`
- `List`1 GetAboutGroupInfo(SessionPara para)`
- `List`1 GetWorkHours(WorkReportPara para)`
- `List`1 GetWorkHourstring(WorkReportPara para)`
- `String BatchSaveWorkLogObject(WorkReportPara para)`
- `TreeChildData GetProjectWorkReportChildNode(TreeViewPara para)`
- `GridObject GetProjectWorkLogGridData(OnePageGridDataPara para)`
- `GridTitleData GetTitleCommon(GridRowTitlePara para)`
- `GridObject GetGridDataCommon(OnePageGridDataPara para)`
- `GridObject GetAttentionWorkLog(OnePageGridDataPara para)`
- `Void UpdateRemarkCount(WorkReportPara para)`
- `Boolean BatchSubmitHisWorkLog(WorkReportPara para)`
- `List`1 GetWorkLogAuditor(WorkReportPara para)`
- `Boolean AuditWorkLogFlag(SessionPara para)`
- `Dictionary`2 GetSearchProjectList(WorkReportPara para)`
- `Dictionary`2 GetSearchProjectUIDList(WorkReportPara para)`
- `Boolean UpdateTaskInfo(WorkReportPara para)`
- `Boolean BatchUpdateTaskInfo(WorkReportPara para)`
- `Boolean AddRemarkRemind(WorklogInternalMailPara para)`
- `String GetWorkReportTreeCountData(TreeViewPara para)`
- `Void DeleteWorkLogData(WorkReportPara para)`
- `GridObject GetPortalWorklogListOnePageGridData(OnePageGridDataPara para)`
- `GridTitleData GetTitleTaskWorkCommon(GridRowTitlePara para)`
- `GridObject GetPortalTaskWorkListOnePageGridData(OnePageGridDataPara para)`
- `GridObject GetPortalTeamHoursListOnePageGridData(OnePageGridDataPara para)`

## Hoteam.InforCenter.ProjectFolderTemplate.Service.dll

### [interface] Hoteam.InforCenter.ProjectFolderTemplate.Service.IProjectFolderTemplateService
- `Boolean AddObjectToProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `Boolean AddFolderStructFromProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `Boolean IsEmptyFolderStructFromProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `String AddFolderStructFromProjectFolderTemplateEx(ProjectFolderTemplatePara para)`
- `List`1 GetFolderTemplateChildNode(TreeViewPara para)`
- `Boolean CheckProjectFolderTemplatePermission(ProjectFolderTemplatePara para)`
- `Boolean CheckLinkExist(ProjectFolderTemplatePara para)`
- `String PasteProjectChildObject(ProjectFolderTemplatePara para)`
- `Boolean CheckLinkExistByChildId(ProjectFolderTemplatePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `GridTitleData GetImportExcelTitlData(SessionPara para)`
- `Boolean CheckImportTemplateFormat(ProjectFolderTemplatePara para)`
- `Boolean ImportProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `Boolean CheckBeforeDeleteTemplateClassify(ProjectFolderTemplatePara para)`
- `String BatchCreateDelivertyAndDocTemplate(ImportTemplatePara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `Boolean DeleteTemplateClassify(ProjectFolderTemplatePara para)`

### [class] Hoteam.InforCenter.ProjectFolderTemplate.Service.ProjectFolderTemplateService
- `Boolean AddObjectToProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `Boolean CheckLinkExist(ProjectFolderTemplatePara para)`
- `Boolean CheckProjectFolderTemplatePermission(ProjectFolderTemplatePara para)`
- `Boolean AddFolderStructFromProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `String AddFolderStructFromProjectFolderTemplateEx(ProjectFolderTemplatePara para)`
- `Boolean IsEmptyFolderStructFromProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `List`1 GetFolderTemplateChildNode(TreeViewPara para)`
- `Boolean CheckLinkExistByChildId(ProjectFolderTemplatePara para)`
- `String PasteProjectChildObject(ProjectFolderTemplatePara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `GridObject GetImportExcelData(ImportWcfPara para)`
- `GridTitleData GetImportExcelTitlData(SessionPara para)`
- `Boolean CheckImportTemplateFormat(ProjectFolderTemplatePara para)`
- `Boolean ImportProjectFolderTemplate(ProjectFolderTemplatePara para)`
- `Boolean CheckBeforeDeleteTemplateClassify(ProjectFolderTemplatePara para)`
- `String BatchCreateDelivertyAndDocTemplate(ImportTemplatePara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `Boolean DeleteTemplateClassify(ProjectFolderTemplatePara para)`

## Hoteam.InforCenter.BaseLine.Service.dll

### [class] Hoteam.InforCenter.BaseLine.Service.BaseLineService
- `Int32 GetBaseLineMaxSerialNumber(BaseLinePara para)`
- `BaseLineItemInfo GetItemInfoByBaseLineEID(GetObjectDataPara para)`
- `ReturnMsg SaveBaseLine(SaveBaseLinePara para)`
- `List`1 GetCompareBaseLines(CompareBaseLinePara para)`
- `Void DeleteBaseLine(DeleteBaseLinePara para)`
- `GridObject GetAllBaseLineData(OnePageGridDataPara para)`
- `BOMTitleData GetPseBaseLineBomTitle(GetBomTitlePara para)`
- `GridTitleData GetAllBaseLineGridTitle(GridRowTitlePara para)`
- `List`1 GetPseBaseLineBomAllStructData(GetBaseLineBomStructPara para)`
- `String GetPseBaseLineBomOnePageData(BaseLineBomOnePageDataPara para)`
- `List`1 GetPseBaseLineBomQueryData(GetBaseLineBomStructPara para)`
- `AutoSaveBaseLineTargetInfo GetAutoSaveBaseLineTargetInfo(BaseLineWorkflowPara para)`
- `GridObject GetBaseLineDataSetFileList(OnePageGridDataPara para)`
- `String GetItemHistoryPicDataForBaseLine(UpdateObjectPara para)`
- `DeleteMessage BomCanDeleteInBaseLine(BaseLinePara para)`

### [interface] Hoteam.InforCenter.BaseLine.Service.IBaseLineService
- `Int32 GetBaseLineMaxSerialNumber(BaseLinePara para)`
- `BaseLineItemInfo GetItemInfoByBaseLineEID(GetObjectDataPara para)`
- `ReturnMsg SaveBaseLine(SaveBaseLinePara para)`
- `List`1 GetCompareBaseLines(CompareBaseLinePara para)`
- `Void DeleteBaseLine(DeleteBaseLinePara para)`
- `GridObject GetAllBaseLineData(OnePageGridDataPara para)`
- `BOMTitleData GetPseBaseLineBomTitle(GetBomTitlePara para)`
- `List`1 GetPseBaseLineBomAllStructData(GetBaseLineBomStructPara para)`
- `String GetPseBaseLineBomOnePageData(BaseLineBomOnePageDataPara para)`
- `List`1 GetPseBaseLineBomQueryData(GetBaseLineBomStructPara para)`
- `AutoSaveBaseLineTargetInfo GetAutoSaveBaseLineTargetInfo(BaseLineWorkflowPara para)`
- `GridObject GetBaseLineDataSetFileList(OnePageGridDataPara para)`
- `String GetItemHistoryPicDataForBaseLine(UpdateObjectPara para)`
- `GridTitleData GetAllBaseLineGridTitle(GridRowTitlePara para)`
- `DeleteMessage BomCanDeleteInBaseLine(BaseLinePara para)`

## Hoteam.InforCenter.PSEBom.Service.dll

### [interface] Hoteam.InforCenter.PSEBom.Service.IPSEBomService
- `TreeListRootData GetPseBomData(TreeListViewPara para)`
- `TreeListChildData GetPseBomChildData(TreeListViewPara para)`
- `List`1 GetTreeListQueryData(TreeListViewQueryPara para)`
- `TreeListRootData GetTreeListAllData(TreeListViewPara para)`
- `AddLinkMessage BatchAlterRemoveItem(BatchAlterPara para)`
- `AddLinkMessage BatchAlterAddItem(BatchAlterPara para)`
- `AddLinkMessage BatchAlterReplaceItem(BatchAlterPara para)`
- `AddLinkMessage BatchAlterEditNumItem(BatchAlterPara para)`
- `String CheckBomLoop(BomLinePara para)`
- `Void ReplaceItem(BomLinePara para)`
- `DeleteMessage ItemCanDelete(BomLinePara para)`
- `Void RemoveItemByMasterIDAndPviewID(BomLinePara para)`
- `Void DeleteItemAndCheckIn(DeletePara para)`
- `String CanDeleteBom(BomLinePara para)`
- `Void DeleteBom(DeletePara para)`
- `Boolean PseBomEditSave(BomEditSavePara para)`
- `GridTitleData GetImportBomTitleData(GridRowTitlePara para)`
- `GridTitleData GetImportBomItemExistTitleData(GridRowTitlePara para)`
- `GridObject GetImportBomData(ImportWcfPara para)`
- `AddLinkMessage ImportBom(PSEBomImportPara para)`
- `ImportCheckResult ImportBomCheckData(ImportBomCheckPara para)`
- `AddLinkMessage CheckAddItem(BomLinePara para)`
- `List`1 GetItemViewHistory(BomLinePara para)`
- `TreeListChildData GetTreeListAllDatas(TreeListViewPara para)`
- `String SaveMSEInputItemQuality(SaveMSEInputItemQualityPara para)`
- `String GetRootProcessID(SaveMSEInputItemQualityPara para)`
- `String ProcessEditCheck(SaveMSEInputItemQualityPara para)`
- `String RecordProcessEditDate(SaveMSEInputItemQualityPara para)`
- `Boolean RemoveCheck(BomLinePara para)`
- `String SaveAlternatesParts(AddAlternatesPartsPara para)`
- `EditGridObject GetAlternatesPartsEditGridData(EditGridDataPara para)`
- `EditGridObject GetGlobalAlternatesPartsEditGridData(EditGridDataPara para)`
- `TreeRootData GetBomTreeRootData(TreeViewPara para)`
- `TreeChildData GetBomTreeChildData(TreeViewPara para)`
- `EditGridObject GetBomTreeChildOnePageData(EditGridDataPara para)`
- `EditGridTitleData GetBomTreeChildTitle(GridRowTitlePara para)`
- `List`1 GetEditBomAllStructData(GetBomStructPara para)`
- `List`1 GetEditBomQueryData(GetBomStructPara para)`
- `String GetEditBomOnePageData(EditBomOnePageDataPara para)`
- `BOMTitleData GetEditBomTitle(GetBomTitlePara para)`
- `String CheckRemoveUnion(BomLinePara para)`
- `BOMTitleData GetBatchUpdateBomTitle(SessionPara para)`
- `String GetBatchUpdateBomData(EditBomOnePageDataPara para)`
- `List`1 GetBatchUpdateBom(GetBomStructPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnRemove(EditBomOnePageDataPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnAdd(EditBomOnePageDataPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnReplace(EditBomOnePageDataPara para)`
- `Void CutRemoveItemByMasterIDAndPviewID(BomLinePara para)`
- `String PseInputAddByBomSaveData(PseInputAddData para)`
- `String PseInputFromBomData(PseInputAddData para)`
- `List`1 GetBrowserBomAllStructData(GetBrowserBomStructPara para)`
- `String GetBrowserBomOnePageData(GetBrowserBomOnePageDataPara para)`
- `List`1 GetBrowserBomQueryData(GetBrowserBomStructPara para)`
- `List`1 GetNotExistBomBrowserDocData(BomLinePara para)`
- `AddLinkMessage PseAddExistBomData(AddLinkAndInitDataPara para)`
- `BOMTitleData GetInputFromBomTitle(SessionPara para)`
- `List`1 GetInputBomAllStructData(GetBomStructPara para)`
- `String GetInputBomOnePageData(EditBomOnePageDataPara para)`
- `Dictionary`2 GetAlreadyAllocatedData(PseInputAddData para)`
- `Int32 GetDecimalPlaces(SessionPara para)`
- `String SaveBOMRoouserData(SaveBOMRouserDataPara para)`
- `ReturnBomInformation ApiGetBom(Apipara para)`

### [class] Hoteam.InforCenter.PSEBom.Service.PSEBomService
- `TreeListRootData GetPseBomData(TreeListViewPara para)`
- `TreeListChildData GetPseBomChildData(TreeListViewPara para)`
- `List`1 GetTreeListQueryData(TreeListViewQueryPara para)`
- `TreeListRootData GetTreeListAllData(TreeListViewPara para)`
- `TreeListChildData GetTreeListAllDatas(TreeListViewPara para)`
- `AddLinkMessage BatchAlterRemoveItem(BatchAlterPara para)`
- `String CheckBomLoop(BomLinePara para)`
- `AddLinkMessage BatchAlterAddItem(BatchAlterPara para)`
- `AddLinkMessage BatchAlterReplaceItem(BatchAlterPara para)`
- `AddLinkMessage BatchAlterEditNumItem(BatchAlterPara para)`
- `DeleteMessage ItemCanDelete(BomLinePara para)`
- `Void RemoveItemByMasterIDAndPviewID(BomLinePara para)`
- `Void CutRemoveItemByMasterIDAndPviewID(BomLinePara para)`
- `Boolean RemoveCheck(BomLinePara para)`
- `String CheckRemoveUnion(BomLinePara para)`
- `Void ReplaceItem(BomLinePara para)`
- `Void DeleteItemAndCheckIn(DeletePara para)`
- `String CanDeleteBom(BomLinePara para)`
- `Void DeleteBom(DeletePara para)`
- `Boolean PseBomEditSave(BomEditSavePara para)`
- `GridTitleData GetImportBomTitleData(GridRowTitlePara para)`
- `GridTitleData GetImportBomItemExistTitleData(GridRowTitlePara para)`
- `GridObject GetImportBomData(ImportWcfPara para)`
- `ImportCheckResult ImportBomCheckData(ImportBomCheckPara para)`
- `AddLinkMessage ImportBom(PSEBomImportPara para)`
- `AddLinkMessage CheckAddItem(BomLinePara para)`
- `List`1 GetItemViewHistory(BomLinePara para)`
- `String SaveMSEInputItemQuality(SaveMSEInputItemQualityPara para)`
- `String ProcessEditCheck(SaveMSEInputItemQualityPara para)`
- `String GetRootProcessID(SaveMSEInputItemQualityPara para)`
- `String RecordProcessEditDate(SaveMSEInputItemQualityPara para)`
- `String SaveAlternatesParts(AddAlternatesPartsPara para)`
- `EditGridObject GetAlternatesPartsEditGridData(EditGridDataPara para)`
- `EditGridObject GetGlobalAlternatesPartsEditGridData(EditGridDataPara para)`
- `TreeRootData GetBomTreeRootData(TreeViewPara para)`
- `TreeChildData GetBomTreeChildData(TreeViewPara para)`
- `EditGridObject GetBomTreeChildOnePageData(EditGridDataPara para)`
- `EditGridTitleData GetBomTreeChildTitle(GridRowTitlePara para)`
- `List`1 GetEditBomAllStructData(GetBomStructPara para)`
- `List`1 GetEditBomQueryData(GetBomStructPara para)`
- `BOMTitleData GetEditBomTitle(GetBomTitlePara para)`
- `String GetEditBomOnePageData(EditBomOnePageDataPara para)`
- `BOMTitleData GetBatchUpdateBomTitle(SessionPara para)`
- `List`1 GetBatchUpdateBom(GetBomStructPara para)`
- `String GetBatchUpdateBomData(EditBomOnePageDataPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnRemove(EditBomOnePageDataPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnAdd(EditBomOnePageDataPara para)`
- `BacthUpdateBomRet BatchUpdateBomOnReplace(EditBomOnePageDataPara para)`
- `String PseInputAddByBomSaveData(PseInputAddData para)`
- `String PseInputFromBomData(PseInputAddData para)`
- `AddLinkMessage PseAddExistBomData(AddLinkAndInitDataPara para)`
- `BOMTitleData GetInputFromBomTitle(SessionPara para)`
- `List`1 GetInputBomAllStructData(GetBomStructPara para)`
- `String GetInputBomOnePageData(EditBomOnePageDataPara para)`
- `List`1 GetBrowserBomAllStructData(GetBrowserBomStructPara para)`
- `String GetBrowserBomOnePageData(GetBrowserBomOnePageDataPara para)`
- `List`1 GetBrowserBomQueryData(GetBrowserBomStructPara para)`
- `List`1 GetNotExistBomBrowserDocData(BomLinePara para)`
- `Dictionary`2 GetAlreadyAllocatedData(PseInputAddData para)`
- `Int32 GetDecimalPlaces(SessionPara para)`
- `String SaveBOMRoouserData(SaveBOMRouserDataPara para)`
- `ReturnBomInformation ApiGetBom(Apipara para)`

## Hoteam.InforCenter.BomValidity.Service.dll

### [class] Hoteam.InforCenter.BomValidity.Service.BomValidityService
- `GridTitleData GetDateValidityTitle(GridRowTitlePara para)`
- `GridObject GetDateValidityData(OnePageGridDataPara para)`
- `GridTitleData GetUnitValidityTitle(GridRowTitlePara para)`
- `GridObject GetUnitValidityData(OnePageGridDataPara para)`
- `String UnitValiditySettingSave(UnitValidityPara para)`
- `String UnitValiditySettingLoadData(UnitValidityPara para)`
- `List`1 GetUnitParentSettingRanges(UnitValidityPara para)`
- `List`1 GetUnitSettingRangeStatementRecordData(UnitValidityPara para)`
- `String UnitValidityNewDataSave(UnitValidityPara para)`
- `String UnitValidityEditDataSave(UnitValidityPara para)`
- `List`1 UnitValidityLoadData(UnitValidityPara para)`
- `List`1 GetUserValidityDateID(DateValidityPara para)`
- `String SaveDateValidity(DateValidityPara para)`
- `Boolean IsRepeatID(UnitValidityPara para)`
- `String IsExistID(DateValidityPara para)`
- `Boolean IsQuoteID(UnitValidityPara para)`
- `String GetWorkFlowInfo(DateValidityPara para)`
- `Void DeleteValidityWithRelationId(BomValidityPara para)`

### [interface] Hoteam.InforCenter.BomValidity.Service.IBomValidityService
- `GridTitleData GetDateValidityTitle(GridRowTitlePara para)`
- `GridObject GetDateValidityData(OnePageGridDataPara para)`
- `GridTitleData GetUnitValidityTitle(GridRowTitlePara para)`
- `GridObject GetUnitValidityData(OnePageGridDataPara para)`
- `String UnitValiditySettingSave(UnitValidityPara para)`
- `String UnitValiditySettingLoadData(UnitValidityPara para)`
- `List`1 GetUnitParentSettingRanges(UnitValidityPara para)`
- `List`1 GetUnitSettingRangeStatementRecordData(UnitValidityPara para)`
- `String UnitValidityNewDataSave(UnitValidityPara para)`
- `String UnitValidityEditDataSave(UnitValidityPara para)`
- `List`1 UnitValidityLoadData(UnitValidityPara para)`
- `List`1 GetUserValidityDateID(DateValidityPara para)`
- `String SaveDateValidity(DateValidityPara para)`
- `Boolean IsRepeatID(UnitValidityPara para)`
- `String IsExistID(DateValidityPara para)`
- `Boolean IsQuoteID(UnitValidityPara para)`
- `String GetWorkFlowInfo(DateValidityPara para)`
- `Void DeleteValidityWithRelationId(BomValidityPara para)`

## Hoteam.InforCenter.PSEItem.Service.dll

### [interface] Hoteam.InforCenter.PSEItem.Service.IItemService
- `Boolean CheckItemCodeRepeat(PSEItemEditPara para)`
- `Dictionary`2 GetItemTypes(SessionPara para)`
- `List`1 GetToolingItemTypes(SessionPara para)`
- `String CreateNewItem(PSEItemSavePara para)`
- `String CopyNewItem(PSEItemSavePara para)`
- `String EmendNewItem(PSEItemSavePara para)`
- `String InitVersionItem(PSEItemEditPara para)`
- `String EmendVersionItem(PSEItemEditPara para)`
- `String GetItemByItemIDAndFormType(PSEItemEditPara para)`
- `List`1 AddItemRelations(PSEItemRelationPara para)`
- `String SetDsRelationType(PSEItemRelationPara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetProcessInputSelectTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `EditGridObject GetItemRealtionEditGridData(EditGridDataPara para)`
- `EditGridObject GetItemRealtionForCopyEditGridData(EditGridDataPara para)`
- `String BatchCreateItem(PSEItemSavePara para)`
- `String EditItem(PSEItemSavePara para)`
- `AddLinkMessage ReplaceItemRelations(PSEItemRelationPara para)`
- `List`1 CheckEmendItem(PSEItemEditPara para)`
- `GridTitleData GetBatchAlterTitle(GridRowTitlePara para)`
- `GridObject GetBatchAlterData(OnePageGridDataPara para)`
- `GridTitleData GetItemCompareTitle(GridRowTitlePara para)`
- `GridTitleData GetImportItemCompareTitleData(ImportItemGridRowTitlePara para)`
- `GridObject GetItemCompareData(OnePageGridDataPara para)`
- `GridObject GetImportItemCompareData(OnePageGridDataPara para)`
- `GridObject GetStandardDocVisualData(OnePageGridDataPara para)`
- `GridTitleData GetImportItemTitleData(ImportItemGridRowTitlePara para)`
- `GridTitleData GetImportItemExistTitleData(ImportItemGridRowTitlePara para)`
- `GridObject GetImportItemData(ImportWcfPara para)`
- `AddLinkMessage ImportItem(PSEItemImportPara para)`
- `String ImportItemCheckData(ImportCheckPara para)`
- `String CheckAddNewItem(PSEItemEditPara para)`
- `List`1 GetUsingStatusEntityTypeList(SessionPara para)`
- `String GetItemByCode(PSEItemEditPara para)`
- `Dictionary`2 GetItemAndFormByCodes(PSEItemEditPara para)`
- `Dictionary`2 GetPreVersionItem(PSEItemEditPara para)`
- `String GetSpecificationDocByItemID(PSEItemEditPara para)`
- `GridObject GetMyPseItemListMainFlatData(SessionPara para)`
- `GridObject GetMyPseItemListMainFlatData2(SessionPara para)`
- `Dictionary`2 GetCreatePseItemView(PSEItemEditPara para)`
- `GridObject GetCheckOutViewData(OnePageGridDataPara para)`
- `GridObject GetItemLogData(OnePageGridDataPara para)`
- `String GetDefaultItemViewByItemID(PSEItemEditPara para)`
- `GridObject QueryItemByInfo(CustomGridDataPara para)`
- `String SaveItemView(PSEItemEditPara para)`
- `String CheckDeteleItemView(PSEItemEditPara para)`
- `List`1 CheckOutItem(PSEItemEditPara para)`
- `String CheckInItem(PSEItemEditPara para)`
- `String UnCheckOutItem(PSEItemEditPara para)`
- `String GetFormTypeByViewType(PSEItemEditPara para)`
- `Dictionary`2 GetAllViewTypes(SessionPara para)`
- `List`1 GetExistItemView(PSEItemEditPara para)`
- `Boolean IsOnlyOneFormType(PSEItemEditPara para)`
- `Boolean CanAddRelationLink(ClipBoardPara para)`
- `String GetItemByFormType(PSEItemEditPara para)`
- `Dictionary`2 GetItemTypeDataModel(PSEItemEditPara para)`
- `List`1 GetItemVersionsByMID(PSEItemEditPara para)`
- `List`1 GetItemsByItemID(PSEItemEditPara para)`
- `GridTitleData GetStandardDocVisualTitle(GridRowTitlePara para)`
- `Boolean HasDatasetByItemID(PSEItemEditPara para)`
- `String GetLastestViewItem(PSEItemEditPara para)`
- `String GetItemByObjectId(GetObjectDataPara para)`
- `List`1 GetItemTypeForm(PSEItemEditPara para)`
- `List`1 GetItemTypeFormAndMerge(PSEItemEditPara para)`
- `List`1 GetCodeValueColumn(PSEItemEditPara para)`
- `Dictionary`2 GetClassifySettingGridData(EditGridDataPara para)`
- `String SaveClassifySettingData(PSEItemEditPara para)`
- `Dictionary`2 GetFormValueByClassifySetting(PSEItemSavePara para)`
- `GridObject GetPseItemViewData(OnePageGridDataPara para)`
- `Dictionary`2 GetViewTypeByItemID(PSEItemEditPara para)`
- `Dictionary`2 GetViewTypesByItemID(PSEItemEditPara para)`
- `Boolean CheckDocVisualPermission(PSEItemEditPara para)`
- `GridObject GetObjectReferencePseItemList(OnePageGridDataPara para)`
- `Dictionary`2 GetNotIsolateViewTypes(PSEItemEditPara para)`
- `String GetNotIsolateItemByItemIDAndFormType(PSEItemEditPara para)`
- `EditGridObject GetPsePropertyMergeRulesSystemSetting(PSEItemEditPara para)`
- `EditGridObject GetMergeRulesGrid(PSEItemEditPara para)`
- `AddLinkMessage CheckPsePropertyMergeRules(PSEItemEditPara para)`
- `Dictionary`2 GetPSEDataModelList(PSEItemEditPara para)`
- `Dictionary`2 GetPseModelPropertyList(PSEItemEditPara para)`
- `Dictionary`2 CheckItemRulesRepeat(PSEItemSavePara para)`
- `GridObject GetRemarkGridData(SessionPara para)`
- `EditGridObject ProcessingInputRelatedListsDenselyIsolatedData(EditGridDataPara para)`
- `GridObject GetPseItemReferenceObjectData(OnePageGridDataPara para)`
- `GridObject GetPseItemReferencedObjectData(OnePageGridDataPara para)`
- `GridObject GetPseItemAssociatedObjectData(OnePageGridDataPara para)`
- `EditGridObject GetItemReferenceObjectEditGridData(EditGridDataPara para)`
- `EditGridObject GetItemAssociatedObjectEditGridData(EditGridDataPara para)`
- `ReturnItemInformation GetPseMaterial(PseItemApiParaReq para)`

### [class] Hoteam.InforCenter.PSEItem.Service.ItemService
- `Boolean CheckItemCodeRepeat(PSEItemEditPara para)`
- `Dictionary`2 GetItemTypes(SessionPara para)`
- `List`1 GetToolingItemTypes(SessionPara para)`
- `String InitVersionItem(PSEItemEditPara para)`
- `String EmendVersionItem(PSEItemEditPara para)`
- `String CreateNewItem(PSEItemSavePara para)`
- `String CopyNewItem(PSEItemSavePara para)`
- `String EmendNewItem(PSEItemSavePara para)`
- `String GetItemByItemIDAndFormType(PSEItemEditPara para)`
- `String GetNotIsolateItemByItemIDAndFormType(PSEItemEditPara para)`
- `List`1 AddItemRelations(PSEItemRelationPara para)`
- `String SetDsRelationType(PSEItemRelationPara para)`
- `EditGridTitleData GetProcessInputSelectTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetEditGridData(OnePageGridDataPara para)`
- `EditGridObject GetItemRealtionEditGridData(EditGridDataPara para)`
- `EditGridObject GetItemRealtionForCopyEditGridData(EditGridDataPara para)`
- `String BatchCreateItem(PSEItemSavePara para)`
- `String EditItem(PSEItemSavePara para)`
- `AddLinkMessage ReplaceItemRelations(PSEItemRelationPara para)`
- `List`1 CheckEmendItem(PSEItemEditPara para)`
- `GridTitleData GetBatchAlterTitle(GridRowTitlePara para)`
- `GridObject GetBatchAlterData(OnePageGridDataPara para)`
- `GridTitleData GetItemCompareTitle(GridRowTitlePara para)`
- `GridObject GetItemCompareData(OnePageGridDataPara para)`
- `GridTitleData GetImportItemCompareTitleData(ImportItemGridRowTitlePara para)`
- `GridObject GetImportItemCompareData(OnePageGridDataPara para)`
- `GridObject GetStandardDocVisualData(OnePageGridDataPara para)`
- `GridTitleData GetStandardDocVisualTitle(GridRowTitlePara para)`
- `GridTitleData GetImportItemTitleData(ImportItemGridRowTitlePara para)`
- `GridTitleData GetImportItemExistTitleData(ImportItemGridRowTitlePara para)`
- `GridObject GetImportItemData(ImportWcfPara para)`
- `String ImportItemCheckData(ImportCheckPara para)`
- `AddLinkMessage ImportItem(PSEItemImportPara para)`
- `String CheckAddNewItem(PSEItemEditPara para)`
- `List`1 GetUsingStatusEntityTypeList(SessionPara para)`
- `String GetItemByCode(PSEItemEditPara para)`
- `Dictionary`2 GetPreVersionItem(PSEItemEditPara para)`
- `Dictionary`2 GetItemAndFormByCodes(PSEItemEditPara para)`
- `String GetSpecificationDocByItemID(PSEItemEditPara para)`
- `GridObject GetMyPseItemListMainFlatData(SessionPara para)`
- `GridObject GetMyPseItemListMainFlatData2(SessionPara para)`
- `Dictionary`2 GetCreatePseItemView(PSEItemEditPara para)`
- `GridObject GetCheckOutViewData(OnePageGridDataPara para)`
- `GridObject GetItemLogData(OnePageGridDataPara para)`
- `String GetDefaultItemViewByItemID(PSEItemEditPara para)`
- `GridObject QueryItemByInfo(CustomGridDataPara para)`
- `String SaveItemView(PSEItemEditPara para)`
- `String CheckDeteleItemView(PSEItemEditPara para)`
- `List`1 CheckOutItem(PSEItemEditPara para)`
- `String CheckInItem(PSEItemEditPara para)`
- `String UnCheckOutItem(PSEItemEditPara para)`
- `String GetFormTypeByViewType(PSEItemEditPara para)`
- `Dictionary`2 GetAllViewTypes(SessionPara para)`
- `Dictionary`2 GetNotIsolateViewTypes(PSEItemEditPara para)`
- `Dictionary`2 GetViewTypesByItemID(PSEItemEditPara para)`
- `List`1 GetExistItemView(PSEItemEditPara para)`
- `Boolean IsOnlyOneFormType(PSEItemEditPara para)`
- `Boolean CanAddRelationLink(ClipBoardPara para)`
- `String GetItemByFormType(PSEItemEditPara para)`
- `Dictionary`2 GetItemTypeDataModel(PSEItemEditPara para)`
- `List`1 GetItemsByItemID(PSEItemEditPara para)`
- `List`1 GetItemVersionsByMID(PSEItemEditPara para)`
- `Boolean HasDatasetByItemID(PSEItemEditPara para)`
- `String GetLastestViewItem(PSEItemEditPara para)`
- `String GetItemByObjectId(GetObjectDataPara para)`
- `List`1 GetItemTypeForm(PSEItemEditPara para)`
- `List`1 GetItemTypeFormAndMerge(PSEItemEditPara para)`
- `List`1 GetCodeValueColumn(PSEItemEditPara para)`
- `Dictionary`2 GetClassifySettingGridData(EditGridDataPara para)`
- `String SaveClassifySettingData(PSEItemEditPara para)`
- `Dictionary`2 GetFormValueByClassifySetting(PSEItemSavePara para)`
- `GridObject GetPseItemViewData(OnePageGridDataPara para)`
- `Dictionary`2 GetViewTypeByItemID(PSEItemEditPara para)`
- `Boolean CheckDocVisualPermission(PSEItemEditPara para)`
- `GridObject GetObjectReferencePseItemList(OnePageGridDataPara para)`
- `EditGridObject GetPsePropertyMergeRulesSystemSetting(PSEItemEditPara para)`
- `EditGridObject GetMergeRulesGrid(PSEItemEditPara para)`
- `AddLinkMessage CheckPsePropertyMergeRules(PSEItemEditPara para)`
- `Dictionary`2 GetPseModelPropertyList(PSEItemEditPara para)`
- `Dictionary`2 GetPSEDataModelList(PSEItemEditPara para)`
- `Dictionary`2 CheckItemRulesRepeat(PSEItemSavePara para)`
- `GridObject GetRemarkGridData(SessionPara para)`
- `EditGridObject ProcessingInputRelatedListsDenselyIsolatedData(EditGridDataPara para)`
- `GridObject GetPseItemReferenceObjectData(OnePageGridDataPara para)`
- `GridObject GetPseItemReferencedObjectData(OnePageGridDataPara para)`
- `GridObject GetPseItemAssociatedObjectData(OnePageGridDataPara para)`
- `EditGridObject GetItemReferenceObjectEditGridData(EditGridDataPara para)`
- `EditGridObject GetItemAssociatedObjectEditGridData(EditGridDataPara para)`
- `ReturnItemInformation GetPseMaterial(PseItemApiParaReq para)`

## Hoteam.InforCenter.BomStatistics.Service.dll

### [class] Hoteam.InforCenter.BomStatistics.Service.BomStatisticsService
- `GridTitleData GetStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetStatisticsData(OnePageGridDataPara para)`
- `GridTitleData GetCommonStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetCellStatisticsData(OnePageGridDataPara para)`
- `GridObject GetBaseLineCellStatisticsData(OnePageGridDataPara para)`
- `GridObject GetBOMBrownCellStatisticsData(OnePageGridDataPara para)`
- `GridObject GetMaterialConsumptionSummaryData(OnePageGridDataPara para)`
- `GridObject GetOriginStatisticsData(OnePageGridDataPara para)`
- `GridObject GetRatioData(SessionPara para)`
- `GridTitleData GetStructureStatisticsTitle(BomStatisticsPara para)`
- `GridObject GetStructureStatisticsData(BomStatisticsPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `GridTitleData GetCompareGridRowTitle(BomComparePara para)`
- `CompareResult GetBomCompareResult(BomComparePara para)`
- `Boolean IsBaseLineOn(SessionPara para)`
- `Boolean CheckItemValidity(CheckItemValidityPara para)`
- `ExcelExportTemplateDataModel GetExportBomDifferResult(ExportBomDifferPara para)`
- `GridObject GetItemCompareResult(BomComparePara para)`
- `GridObject GetCheckOutCompareResult(BomComparePara para)`
- `GridObject GetItemViewCompareResult(BomComparePara para)`
- `GridObject GetImportBomCompareResult(ImportBomComparePara para)`
- `GridRowTitleObject GetImpactAnalysisGridRowTitle(SessionPara para)`
- `GridObject GetImpactAnalysisGridData(BomStatisticsPara para)`
- `GridObject GetBomData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportExcelItemBom(ExportTemplatePara para)`
- `ExcelExportTemplateDataModel ExportExcelOriginBom(ExportTemplatePara para)`
- `ExcelExportTemplateDataModel ExportExcelCellBom(ExportTemplatePara para)`
- `ExcelExportTemplateDataModel ExportExcelBaseLineCellBom(ExportTemplatePara para)`
- `GridObject GetBomReport(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.BomStatistics.Service.IBomStatisticsService
- `GridTitleData GetStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetStatisticsData(OnePageGridDataPara para)`
- `GridTitleData GetCommonStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetCellStatisticsData(OnePageGridDataPara para)`
- `GridObject GetMaterialConsumptionSummaryData(OnePageGridDataPara para)`
- `GridObject GetOriginStatisticsData(OnePageGridDataPara para)`
- `GridObject GetRatioData(SessionPara para)`
- `GridObject GetStructureStatisticsData(BomStatisticsPara para)`
- `GridTitleData GetStructureStatisticsTitle(BomStatisticsPara para)`
- `GridTitleData GetIntegrityCheckTitle(GridRowTitlePara para)`
- `GridObject GetIntegrityCheckData(OnePageGridDataPara para)`
- `GridTitleData GetCompareGridRowTitle(BomComparePara para)`
- `CompareResult GetBomCompareResult(BomComparePara para)`
- `Boolean IsBaseLineOn(SessionPara para)`
- `Boolean CheckItemValidity(CheckItemValidityPara para)`
- `ExcelExportTemplateDataModel GetExportBomDifferResult(ExportBomDifferPara para)`
- `GridObject GetItemCompareResult(BomComparePara para)`
- `GridObject GetCheckOutCompareResult(BomComparePara para)`
- `GridObject GetItemViewCompareResult(BomComparePara para)`
- `GridObject GetImportBomCompareResult(ImportBomComparePara para)`
- `GridRowTitleObject GetImpactAnalysisGridRowTitle(SessionPara para)`
- `GridObject GetImpactAnalysisGridData(BomStatisticsPara para)`
- `GridObject GetBomData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportExcelItemBom(ExportTemplatePara para)`
- `ExcelExportTemplateDataModel ExportExcelOriginBom(ExportTemplatePara para)`
- `ExcelExportTemplateDataModel ExportExcelCellBom(ExportTemplatePara para)`
- `GridObject GetBomReport(OnePageGridDataPara para)`
- `GridObject GetBaseLineCellStatisticsData(OnePageGridDataPara para)`
- `GridObject GetBOMBrownCellStatisticsData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportExcelBaseLineCellBom(ExportTemplatePara para)`

## Hoteam.InforCenter.PseValidity.Service.dll

### [interface] Hoteam.InforCenter.PseValidity.Service.IPseValidityService
- `String SavePseValidity(PseValidityPara para)`
- `String SavePseValidityEdit(PseValidityPara para)`
- `GridObject GetValidityListData(OnePageGridDataPara para)`
- `GridObject GetVersionRuleListData(OnePageGridDataPara para)`
- `String SavePseVersionRule(PseValidityPara para)`
- `String SavePseVersionRuleEdit(PseValidityPara para)`
- `IEnumerable`1 GetVersionRules(SessionPara para)`
- `String GetPseValidityByCode(PseValidityPara para)`

### [class] Hoteam.InforCenter.PseValidity.Service.PseValidityService
- `String SavePseValidity(PseValidityPara para)`
- `String SavePseValidityEdit(PseValidityPara para)`
- `GridObject GetValidityListData(OnePageGridDataPara para)`
- `GridObject GetVersionRuleListData(OnePageGridDataPara para)`
- `String SavePseVersionRule(PseValidityPara para)`
- `String SavePseVersionRuleEdit(PseValidityPara para)`
- `IEnumerable`1 GetVersionRules(SessionPara para)`
- `String GetPseValidityByCode(PseValidityPara para)`

## Hoteam.InforCenter.QProblem.Service.dll

### [interface] Hoteam.InforCenter.QProblem.Service.IQProblemService
- `String SaveQProblemInfo(QProblemInfoPara para)`
- `Boolean CheckQProblemCodeExist(QProblemInfoPara para)`
- `List`1 GetUnExistAttentionedObjectID(QProblemInfoPara para)`
- `Boolean CheckQProblemAttentioned(QProblemInfoPara para)`
- `String BatchCreateQProblem(QProblemInfoPara para)`
- `Boolean SetFlowState(QProblemInfoPara para)`
- `Boolean BatchSaveQProblemSolution(QProblemSolutionPara para)`
- `Boolean CheckSolutionState(QProblemSolutionPara para)`
- `Boolean UpdateSolutionInfo(QProblemSolutionPara para)`
- `String GetQProblemTreeCountData(TreeViewPara para)`
- `Boolean SetQProblemAttentionLink(QProblemPara para)`
- `Boolean CancelAttentionObject(QProblemInfoPara para)`
- `Int32 GetSolutionCount(QProblemInfoPara para)`
- `GridTitleData GetImportQProblemTitleData(GridRowTitlePara para)`
- `GridObject GetImportQProblemData(ImportWcfPara para)`
- `String ImportQProblemCheckData(ImportQProblemPara para)`
- `String ImportQProblemData(ImportQProblemPara para)`
- `GridTitleData GetQProblemGridTitle(GridRowTitlePara para)`
- `String QProblemRepeatFileOnclick(QProblemInfoPara para)`
- `GridObject GetQProblemGridData(OnePageGridDataPara para)`
- `GridObject GetQProblemQueryGridData(OnePageGridDataPara para)`
- `GridObject GetQProblemDocImage(OnePageGridDataPara para)`
- `GridObject GetQProblemPseItem(OnePageGridDataPara para)`
- `EditGridRowTitleData GetQProblemSolutionEditTitle(GridRowTitlePara para)`
- `EditGridObject GetQProblemSolutionData(QProblemEditGridDataPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `Boolean QProblemTransfer(QProblemPara para)`
- `GridObject GetQProblemManagementGridData(SessionPara para)`
- `AddLinkMessage EffectCheck(QProblemPara para)`
- `Dictionary`2 GetPseItemListDic(SessionPara para)`
- `List`1 GetQProblemDownloadFileInfo(QProblemInfoPara para)`
- `List`1 CreateQProblemAttachInfo(QProblemInfoPara para)`

### [class] Hoteam.InforCenter.QProblem.Service.QProblemService
- `String SaveQProblemInfo(QProblemInfoPara para)`
- `String QProblemRepeatFileOnclick(QProblemInfoPara para)`
- `Boolean CheckQProblemCodeExist(QProblemInfoPara para)`
- `List`1 GetUnExistAttentionedObjectID(QProblemInfoPara para)`
- `Boolean CheckQProblemAttentioned(QProblemInfoPara para)`
- `String BatchCreateQProblem(QProblemInfoPara para)`
- `Boolean SetFlowState(QProblemInfoPara para)`
- `Boolean BatchSaveQProblemSolution(QProblemSolutionPara para)`
- `Boolean CheckSolutionState(QProblemSolutionPara para)`
- `Boolean UpdateSolutionInfo(QProblemSolutionPara para)`
- `Boolean CancelAttentionObject(QProblemInfoPara para)`
- `Int32 GetSolutionCount(QProblemInfoPara para)`
- `GridTitleData GetImportQProblemTitleData(GridRowTitlePara para)`
- `GridObject GetImportQProblemData(ImportWcfPara para)`
- `String ImportQProblemCheckData(ImportQProblemPara para)`
- `String ImportQProblemData(ImportQProblemPara para)`
- `String GetQProblemTreeCountData(TreeViewPara para)`
- `Boolean SetQProblemAttentionLink(QProblemPara para)`
- `GridTitleData GetQProblemGridTitle(GridRowTitlePara para)`
- `GridObject GetQProblemGridData(OnePageGridDataPara para)`
- `GridObject GetQProblemQueryGridData(OnePageGridDataPara para)`
- `GridObject GetQProblemDocImage(OnePageGridDataPara para)`
- `GridObject GetQProblemPseItem(OnePageGridDataPara para)`
- `EditGridRowTitleData GetQProblemSolutionEditTitle(GridRowTitlePara para)`
- `EditGridObject GetQProblemSolutionData(QProblemEditGridDataPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(StartWorkflowPagePara para)`
- `Boolean QProblemTransfer(QProblemPara para)`
- `GridObject GetQProblemManagementGridData(SessionPara para)`
- `AddLinkMessage EffectCheck(QProblemPara para)`
- `Dictionary`2 GetPseItemListDic(SessionPara para)`
- `List`1 GetQProblemDownloadFileInfo(QProblemInfoPara para)`
- `List`1 CreateQProblemAttachInfo(QProblemInfoPara para)`

## Hoteam.InforCenter.QProblemLibrary.Service.dll

### [interface] Hoteam.InforCenter.QProblemLibrary.Service.IQProblemLibraryService
- `List`1 GetQProblemLibraryAllData(TreeViewPara para)`
- `AddLinkMessage SetQProblemTemplateValidity(QProblemLibraryPara para)`
- `GridTitleData GetImportQProblemTemplateTitleData(GridRowTitlePara para)`
- `GridObject GetImportQProblemTemplateData(ImportWcfPara para)`
- `String ImportQProblemTemplateCheck(ImportQProblemTemplatePara para)`
- `String ImportTemplateDataByCache(ImportQProblemTemplatePara para)`

### [class] Hoteam.InforCenter.QProblemLibrary.Service.QProblemLibraryService
- `List`1 GetQProblemLibraryAllData(TreeViewPara para)`
- `AddLinkMessage SetQProblemTemplateValidity(QProblemLibraryPara para)`
- `GridTitleData GetImportQProblemTemplateTitleData(GridRowTitlePara para)`
- `GridObject GetImportQProblemTemplateData(ImportWcfPara para)`
- `String ImportQProblemTemplateCheck(ImportQProblemTemplatePara para)`
- `String ImportTemplateDataByCache(ImportQProblemTemplatePara para)`

## Hoteam.InforCenter.Coordination.Service.dll

### [class] Hoteam.InforCenter.Coordination.Service.CoordinationService
- `Boolean SaveDistributeData(CoordinationPara para)`
- `Boolean SaveOrganizeData(CoordinationPara para)`
- `GridTitleData GetCoordinationDataTitle(GridRowTitlePara para)`
- `GridObject GetCoordinationData(OnePageGridDataPara para)`
- `String MarkImportant(CoordinationPara para)`
- `String MarkReadOrUnRead(CoordinationPara para)`
- `String SaveDistributeInfo(CoordinationPara para)`
- `GridObject GetDistributeDocImage(OnePageGridDataPara para)`
- `List`1 GetDistributeDownloadFileInfo(CoordinationPara para)`
- `String PullAttach(CoordinationPara para)`
- `DistributeDataObj AnswerDataByWebService(CoordinationPara para)`
- `String PullBeforeDownload(CoordinationPara para)`

### [interface] Hoteam.InforCenter.Coordination.Service.ICoordinationService
- `GridTitleData GetCoordinationDataTitle(GridRowTitlePara para)`
- `GridObject GetCoordinationData(OnePageGridDataPara para)`
- `String MarkImportant(CoordinationPara para)`
- `String MarkReadOrUnRead(CoordinationPara para)`
- `Boolean SaveDistributeData(CoordinationPara para)`
- `Boolean SaveOrganizeData(CoordinationPara para)`
- `String SaveDistributeInfo(CoordinationPara para)`
- `GridObject GetDistributeDocImage(OnePageGridDataPara para)`
- `List`1 GetDistributeDownloadFileInfo(CoordinationPara para)`
- `String PullAttach(CoordinationPara para)`
- `DistributeDataObj AnswerDataByWebService(CoordinationPara para)`
- `String PullBeforeDownload(CoordinationPara para)`

## Hoteam.InforCenter.Distribute.Service.dll

### [class] Hoteam.InforCenter.Distribute.Service.DistributeService
- `GridTitleData GetDistributeDataTitle(GridRowTitlePara para)`
- `GridObject GetDistributeData(OnePageGridDataPara para)`
- `AddLinkMessage SaveDistributeData(DistributePara para)`
- `String MarkImportant(DistributePara para)`
- `String MarkReadOrUnRead(DistributePara para)`
- `Boolean UpdateLinkObject(DistributePara para)`
- `BOMTitleData GetEditBomTitle(SessionPara para)`
- `Dictionary`2 GetPseItemListDic(SessionPara para)`
- `EditGridObject GetSupplierDistributeFileSystemSetting(DistributeFileSystemSettingPara para)`
- `DistributeDataObj DistributeDataByWebService(DistributePara para)`
- `AddLinkMessage SynchronizeSuppliersCheck(DistributePara para)`
- `Boolean SaveAnswerData(DistributePara para)`
- `List`1 GetDownloadFileInfo(DistributePara para)`
- `String PullAttach(DistributePara para)`
- `GridObject GetDistributeDocImage(OnePageGridDataPara para)`
- `String PullBeforeDownload(DistributePara para)`

### [interface] Hoteam.InforCenter.Distribute.Service.IDistributeService
- `GridTitleData GetDistributeDataTitle(GridRowTitlePara para)`
- `GridObject GetDistributeData(OnePageGridDataPara para)`
- `AddLinkMessage SaveDistributeData(DistributePara para)`
- `String MarkImportant(DistributePara para)`
- `Boolean UpdateLinkObject(DistributePara para)`
- `String MarkReadOrUnRead(DistributePara para)`
- `BOMTitleData GetEditBomTitle(SessionPara para)`
- `Dictionary`2 GetPseItemListDic(SessionPara para)`
- `EditGridObject GetSupplierDistributeFileSystemSetting(DistributeFileSystemSettingPara para)`
- `DistributeDataObj DistributeDataByWebService(DistributePara para)`
- `AddLinkMessage SynchronizeSuppliersCheck(DistributePara para)`
- `Boolean SaveAnswerData(DistributePara para)`
- `List`1 GetDownloadFileInfo(DistributePara para)`
- `String PullAttach(DistributePara para)`
- `GridObject GetDistributeDocImage(OnePageGridDataPara para)`
- `String PullBeforeDownload(DistributePara para)`

## Hoteam.InforCenter.SuOrganize.Service.dll

### [interface] Hoteam.InforCenter.SuOrganize.Service.ISuOrganizeService
- `List`1 GetSuOrganizeAllNode(SessionPara para)`
- `List`1 GetSuGroupToSuGroup(TreeViewPara para)`
- `AddLinkMessage AddSuOrganize(SuOrganizePara para)`
- `Boolean RemoveSuOrganizeLinkCheck(TreeViewPara para)`
- `Boolean RemoveSuOrganizeLink(SuOrganizePara para)`
- `TreeRootData GetQuerySuUserListByNameo(TreeViewQueryPara para)`
- `List`1 GetQuerySuUserListByName(SuOrganizePara para)`

### [class] Hoteam.InforCenter.SuOrganize.Service.SuOrganizeService
- `List`1 GetSuOrganizeAllNode(SessionPara para)`
- `List`1 GetSuGroupToSuGroup(TreeViewPara para)`
- `AddLinkMessage AddSuOrganize(SuOrganizePara para)`
- `Boolean RemoveSuOrganizeLinkCheck(TreeViewPara para)`
- `Boolean RemoveSuOrganizeLink(SuOrganizePara para)`
- `TreeRootData GetQuerySuUserListByNameo(TreeViewQueryPara para)`
- `List`1 GetQuerySuUserListByName(SuOrganizePara para)`

## Hoteam.InforCenter.PMTask.Service.dll

### [interface] Hoteam.InforCenter.PMTask.Service.ITaskService
- `String SaveTask(TaskEditPara para)`
- `String EditTask(TaskEditPara para)`
- `List`1 GetTaskTemplateAllNode(SessionPara para)`
- `List`1 GetTaskTemplateByTaskType(TaskEditPara para)`
- `Dictionary`2 GetRelationByObjectID(TaskEditPara para)`
- `String PostTask(TaskEditPara para)`
- `Void CancelTask(TaskEditPara para)`
- `Void ReceiveTask(TaskEditPara para)`
- `Void RefuseTask(TaskEditPara para)`
- `String TransferTask(TaskEditPara para)`
- `EditGridObject GetOutputEditGridData(EditGridDataPara para)`
- `Void SaveWeight(TaskRelationPara para)`
- `Void RemoveOutputAndUpdatePercent(TaskRelationPara para)`
- `GridObject GetData(OnePageGridDataPara para)`
- `AddLinkMessage AlterTask(AlterTaskPara para)`
- `EditGridRowTitleData GetBatchEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchEditGridData(EditTaskSessionPara para)`
- `String BatchEdit(TaskEditPara para)`
- `EditGridRowTitleData GetPostTaskTitleData(GridRowTitlePara para)`
- `EditGridObject GetPostTaskData(EditGridDataPara para)`
- `GridObject GetGridData(OnePageGridDataPara para)`
- `GridObject GetTaskStatusCount(TaskEditPara para)`
- `GridObject GetTaskStateCountEachMonth(TaskEditPara para)`
- `String CheckTaskActionRulePermission(CheckTaskActionRulePara para)`
- `String GetOutputObjectIDs(TaskEditPara para)`
- `GridObject GetOutputGridObject(TaskOutputObjectListPara para)`
- `List`1 GetQueryTask(TaskQueryPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `List`1 GetMyTaskTreeAllData(TreeViewPara para)`
- `Void EmendInputObject(TaskRelationPara para)`
- `AddLinkMessage CheckPostData(TaskEditPara para)`
- `GridObject GetTaskStatisticsGridObject(TaskQueryPara para)`
- `Boolean IsHasOutputRelation(TaskEditPara para)`
- `Boolean CheckBatchCreateTask(TaskEditPara para)`
- `Boolean CheckTaskCommitByTaskId(TaskRelationPara para)`
- `EditGridObject GetWeightGridData(EditGridDataPara para)`
- `Boolean UpdatePmtaskoutputrelation(TaskEditPara para)`
- `GridTitleData GetTaskOutObjListTitle(GridRowTitlePara para)`
- `GridObject GetTaskOutObjListData(OnePageGridDataPara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchCreateGridData(EditGridDataPara para)`
- `Boolean UpdateTaskPercent(TaskEditPara para)`
- `String GetQueryViewColumnInfo(OnePageGridDataPara para)`
- `String GetInputEmendPosion(TaskEditPara para)`
- `EditGridObject GetTaskEmendSystemSetting(TaskEmendSystemSettingPara para)`
- `Boolean TaskCommit(TaskRelationPara para)`
- `Int32 CouldEditTaskSchedule(TaskRelationPara para)`
- `String EditPMTask(TaskEditPara para)`
- `Boolean CheckCommitTask(TaskRelationPara para)`
- `String BatchCreateTask(TaskEditPara para)`
- `Void NoProjectUpdateTaskStateTimer(SessionPara para)`
- `String GetMyTaskTreeCountData(TreeViewPara para)`
- `GridObject GetRecieveTaskBoardData(TaskEditPara para)`

### [class] Hoteam.InforCenter.PMTask.Service.TaskService
- `String SaveTask(TaskEditPara para)`
- `String EditTask(TaskEditPara para)`
- `List`1 GetTaskTemplateAllNode(SessionPara para)`
- `List`1 GetTaskTemplateByTaskType(TaskEditPara para)`
- `Dictionary`2 GetRelationByObjectID(TaskEditPara para)`
- `String PostTask(TaskEditPara para)`
- `Void CancelTask(TaskEditPara para)`
- `Void ReceiveTask(TaskEditPara para)`
- `Void RefuseTask(TaskEditPara para)`
- `String TransferTask(TaskEditPara para)`
- `EditGridObject GetOutputEditGridData(EditGridDataPara para)`
- `Void SaveWeight(TaskRelationPara para)`
- `EditGridObject GetWeightGridData(EditGridDataPara para)`
- `Void RemoveOutputAndUpdatePercent(TaskRelationPara para)`
- `GridObject GetData(OnePageGridDataPara para)`
- `AddLinkMessage AlterTask(AlterTaskPara para)`
- `EditGridRowTitleData GetBatchEditTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchEditGridData(EditTaskSessionPara para)`
- `String BatchEdit(TaskEditPara para)`
- `EditGridRowTitleData GetPostTaskTitleData(GridRowTitlePara para)`
- `EditGridObject GetPostTaskData(EditGridDataPara para)`
- `GridObject GetGridData(OnePageGridDataPara para)`
- `GridObject GetTaskStatusCount(TaskEditPara para)`
- `GridObject GetTaskStateCountEachMonth(TaskEditPara para)`
- `String CheckTaskActionRulePermission(CheckTaskActionRulePara para)`
- `String GetOutputObjectIDs(TaskEditPara para)`
- `GridObject GetOutputGridObject(TaskOutputObjectListPara para)`
- `List`1 GetQueryTask(TaskQueryPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `List`1 GetMyTaskTreeAllData(TreeViewPara para)`
- `Void EmendInputObject(TaskRelationPara para)`
- `AddLinkMessage CheckPostData(TaskEditPara para)`
- `GridObject GetTaskStatisticsGridObject(TaskQueryPara para)`
- `Boolean IsHasOutputRelation(TaskEditPara para)`
- `Boolean CheckBatchCreateTask(TaskEditPara para)`
- `Boolean CheckTaskCommitByTaskId(TaskRelationPara para)`
- `Boolean UpdatePmtaskoutputrelation(TaskEditPara para)`
- `Boolean UpdateTaskPercent(TaskEditPara para)`
- `GridObject GetTaskOutObjListData(OnePageGridDataPara para)`
- `GridTitleData GetTaskOutObjListTitle(GridRowTitlePara para)`
- `String GetQueryViewColumnInfo(OnePageGridDataPara para)`
- `String GetInputEmendPosion(TaskEditPara para)`
- `EditGridObject GetTaskEmendSystemSetting(TaskEmendSystemSettingPara para)`
- `Boolean TaskCommit(TaskRelationPara para)`
- `Int32 CouldEditTaskSchedule(TaskRelationPara para)`
- `String EditPMTask(TaskEditPara para)`
- `Boolean CheckCommitTask(TaskRelationPara para)`
- `EditGridTitleData GetBatchCreateTitleData(GridRowTitlePara para)`
- `EditGridObject GetBatchCreateGridData(EditGridDataPara para)`
- `String BatchCreateTask(TaskEditPara para)`
- `Void NoProjectUpdateTaskStateTimer(SessionPara para)`
- `String GetMyTaskTreeCountData(TreeViewPara para)`
- `GridObject GetRecieveTaskBoardData(TaskEditPara para)`

## Hoteam.InforCenter.ThreeManagement.Service.dll

### [interface] Hoteam.InforCenter.ThreeManagement.Service.IThreeManagementService
- `AddLinkMessage AddUser(ThreeUserPara para)`
- `Boolean AuditStatus(ThreeUserPara para)`
- `Boolean CheckRemoveUser(ThreeUserPara para)`
- `Boolean CheckObjectSecurity(ThreeUserPara para)`

### [class] Hoteam.InforCenter.ThreeManagement.Service.ThreeManagementService
- `AddLinkMessage AddUser(ThreeUserPara para)`
- `Boolean AuditStatus(ThreeUserPara para)`
- `Boolean CheckRemoveUser(ThreeUserPara para)`
- `Boolean CheckObjectSecurity(ThreeUserPara para)`

## Hoteam.InforCenter.TimeQuota.Service.dll

### [interface] Hoteam.InforCenter.TimeQuota.Service.ITimeQuotaService
- `Dictionary`2 GetLevel(TimeQuotaPara para)`
- `String NewTTQGroupObj(TTQGroupPara para)`
- `String NewMcobjObj(TTQGroupPara para)`
- `String CheckMcobjEname(TTQGroupPara para)`
- `Boolean CheckTtqObjNameIfRepeat(TTQGroupPara para)`
- `EditGridTitleData GetTTQParaListTitleData(GridRowTitlePara para)`
- `TreeListRootData GetWorkingHourQuotaPageTreeListAllData(TreeListViewPara para)`
- `Dictionary`2 GetMseObjToMseTimeData(TimeQuotaPara para)`
- `ReturnData UpdateMseObjToMseTimeData(TimeQuotaPara para)`
- `EditGridTitleData GetTTQParaValueListTitleData(GridRowTitlePara para)`
- `EditGridObject GetTTQParaListData(EditGridDataPara para)`
- `TTQStitchingOneAndTwo GetParameterFromTreeData(TimeQuotaPara para)`
- `String EmendTimeQuota(TimeQuotaPara para)`
- `String CreateTimeQuota(NewTimeQuotaPara para)`
- `String DeleteTimeQuota(TimeQuotaPara para)`
- `List`1 GetAllTTQTreeNode(TreeViewPara para)`
- `String DeleteObjWithChildren(TimeQuotaPara para)`
- `String CalibrateTimeQuota(TimeQuotaPara para)`
- `List`1 GetTimeQuotaByMseObjId(TimeQuotaPara para)`
- `String GetTimeQuotaIdByMseObjId(TimeQuotaPara para)`

### [class] Hoteam.InforCenter.TimeQuota.Service.TimeQuotaService
- `Dictionary`2 GetLevel(TimeQuotaPara para)`
- `String NewTTQGroupObj(TTQGroupPara para)`
- `String NewMcobjObj(TTQGroupPara para)`
- `String CheckMcobjEname(TTQGroupPara para)`
- `Boolean CheckTtqObjNameIfRepeat(TTQGroupPara para)`
- `TreeListRootData GetWorkingHourQuotaPageTreeListAllData(TreeListViewPara para)`
- `Dictionary`2 GetMseObjToMseTimeData(TimeQuotaPara para)`
- `ReturnData UpdateMseObjToMseTimeData(TimeQuotaPara para)`
- `EditGridTitleData GetTTQParaListTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetTTQParaValueListTitleData(GridRowTitlePara para)`
- `EditGridObject GetTTQParaListData(EditGridDataPara para)`
- `TTQStitchingOneAndTwo GetParameterFromTreeData(TimeQuotaPara para)`
- `String EmendTimeQuota(TimeQuotaPara para)`
- `String CreateTimeQuota(NewTimeQuotaPara para)`
- `String DeleteTimeQuota(TimeQuotaPara para)`
- `List`1 GetAllTTQTreeNode(TreeViewPara para)`
- `String DeleteObjWithChildren(TimeQuotaPara para)`
- `String CalibrateTimeQuota(TimeQuotaPara para)`
- `List`1 GetTimeQuotaByMseObjId(TimeQuotaPara para)`
- `String GetTimeQuotaIdByMseObjId(TimeQuotaPara para)`

## Hoteam.InforCenter.TSManagementNew.Service.dll

### [class] Hoteam.InforCenter.TSManagementNew.Service.TSConfigService
- `TreeRootData GetTSConfigAttributeTreeRootNode(TreeViewPara para)`
- `TreeRootData GetTSConfigGroupTreeRootNode(TreeViewPara para)`
- `List`1 GetConfigTreeNodes(TreeViewPara para)`
- `TreeRootData GetConfigTreeRootNode(TreeViewPara para)`
- `GridObject GetTSConfigAttributeListData(OnePageGridDataPara para)`
- `GridObject GetTSConfigClassListData(OnePageGridDataPara para)`
- `GridObject GetTSConfigProcessViewData(OnePageGridDataPara para)`
- `GridObject GetTSConfigGroupListData(OnePageGridDataPara para)`
- `String AddAttributeOrGroupSave(AddAttributeOrGroupSavePara para)`
- `String CanRemoveGroupCheck(RemoveGroupCheckPara para)`
- `String CanRemoveTSClassCheck(RemoveGroupCheckPara para)`
- `String RemoveAttOrGroupConfig(RemoveGroupCheckPara para)`
- `String CheckAttributeOrGroupRepeated(CheckAttributeOrGroupRepeatedPara para)`
- `String CheckAddGroupCycle(CheckAddGroupCyclePara para)`
- `String MoveUp(MoveUpOrDownPara para)`
- `String MoveDown(MoveUpOrDownPara para)`
- `Boolean CheckIsExclusiveGroup(CheckIsExclusiveGroupAndHaveSubgroupsPara para)`
- `EditGridObject GetTSConfigGroupAttributeListData(EditGridDataPara para)`
- `String ModifyTSConfigInfo(ModifyTSConfigInfoPara para)`
- `String CreateTSClass(CreateTSClassPara para)`
- `String RemoveConfigTSClass(RemoveGroupCheckPara para)`
- `String GetTSConfigClass(CreateTSClassPara para)`

### [class] Hoteam.InforCenter.TSManagementNew.Service.TSKnowledgeService
- `TreeRootData GetTreeRootNode(TreeViewPara para)`
- `List`1 GetTreeNodes(TreeViewPara para)`
- `GridObject GetTSClassListData(OnePageGridDataPara para)`
- `EditGridTitleData GetTSEditListTitleData(GridRowTitlePara para)`
- `GridTitleData GetTSImportListTitleData(GetTSImportListTitleDataPara para)`
- `GridTitleData GetUseTSKnowledgeListTitleData(GridRowTitlePara para)`
- `String GetNoPGroupIdInfo(GetNoPGroupIdInfoPara para)`
- `String HasExclusiveGroupInfo(HasExclusiveGroupInfoPara para)`
- `String DeleteAttValue(DeleteAttValuePara para)`
- `String DeleteAttValueAndGroup(DeleteAttValueAndGroupPara para)`
- `String SaveAttValueAndGroup(SaveAttValueAndGroupPara para)`
- `EditGridObject DealWithTSData(EditGridDataPara para)`
- `String DeleteTSDatas(DeleteTSDatasPara para)`
- `GridObject GetTSExcelData(ImportWcfPara para)`
- `String SaveImportTSData(SaveImportTSDataPara para)`
- `GridObject DealWithUseTSKnowledgeData(OnePageGridDataPara para)`
- `GridObject QueryUseTSKnowledgeData(CustomGridDataPara para)`
- `BOMTitleData GetTSEditListTitleDataV2(LoadTSPara para)`
- `List`1 GetAllStructData(LoadTSPara para)`
- `String GetTSOnePageData(LoadTSPara para)`
- `List`1 GetTSEditQueryData(DeleteTSDatasPara para)`

### [class] Hoteam.InforCenter.TSManagementNew.Service.TSManagerService
- `List`1 GetTreeNodes(TreeViewPara para)`
- `TreeRootData GetTreeRootNode(TreeViewPara para)`
- `List`1 GetTSClassTreeRootNode(TreeViewPara para)`
- `List`1 GetTSConfigTree(GetTSConfigTreePara para)`
- `String CreateItemTSClass(CreateItemTSClassPara para)`
- `String DeleteItemTSClass(DeleteItemTSClassPara para)`
- `String DeleteItemProcessView(DeleteItemProcessViewPara para)`
- `GridObject DealWithItemTSClassList(OnePageGridDataPara para)`
- `GridObject DealWithItemTSProcessViewList(OnePageGridDataPara para)`
- `List`1 GetTSClassAttributes(GetTSClassAttributesPara para)`
- `String SaveTSClassAttributes(SaveTSClassAttributesPara para)`
- `List`1 GetTSKnowledgeQueryFilter(GetTSKnowledgeQueryFilterPara para)`
- `String ExportTSInfoToExcel(ExportTSInfoToExcelPara para)`
- `String RecordOperateLog(RecordLogPara para)`
- `String CheckTSFileState(CheckTSFileStatePara para)`

## Hoteam.InforCenter.WorkSpace.Service.dll

### [interface] Hoteam.InforCenter.WorkSpace.Service.IWorkFolderService
- `AddLinkMessage CopyPastFolder(ClipBoardPara para)`
- `String PasteFolderAndRelation(SaveObjectDataPara para)`

### [interface] Hoteam.InforCenter.WorkSpace.Service.IWorkSpaceService
- `String GetParentObjectPosition(WorkSpacePara para)`
- `String GetWorkSpaceObjectPath(WorkSpacePara para)`
- `String GetDefaultCreatePosition(SessionPara para)`
- `Boolean RemoveObjectReference(WorkSpacePara para)`
- `String GetParentOnlyNodeByChildObjectID(WorkSpacePara para)`
- `TreeRootData GetParentNodeByChildObjectID(TreeViewPara para)`
- `Void MoveObjectDown(WorkSpacePara para)`
- `Void MoveObjectUp(WorkSpacePara para)`
- `DeleteMessage CheckObjectCanDelete(WorkSpacePara para)`
- `Boolean CheckObjectLastInsert(WorkSpacePara para)`
- `Void DeleteObject(WorkSpacePara para)`
- `Boolean CheckObjectExistOnCurrentNode(WorkSpacePara para)`
- `Dictionary`2 GetWorkSpacePosition(WorkSpacePara para)`
- `Void SaveWorkSpacePosition(WorkSpacePara para)`
- `Boolean GetWorkSpaceWSFOLDER(WorkSpacePara para)`
- `Boolean LoopForProcessWSFOLDER(WorkSpacePara para)`

### [class] Hoteam.InforCenter.WorkSpace.Service.LogHelper
- (no public methods)

### [class] Hoteam.InforCenter.WorkSpace.Service.WorkFolderService
- `AddLinkMessage CopyPastFolder(ClipBoardPara para)`
- `String PasteFolderAndRelation(SaveObjectDataPara para)`

### [class] Hoteam.InforCenter.WorkSpace.Service.WorkSpaceService
- `String GetParentObjectPosition(WorkSpacePara para)`
- `String GetDefaultCreatePosition(SessionPara para)`
- `Boolean RemoveObjectReference(WorkSpacePara para)`
- `String GetParentOnlyNodeByChildObjectID(WorkSpacePara para)`
- `TreeRootData GetParentNodeByChildObjectID(TreeViewPara para)`
- `Void MoveObjectDown(WorkSpacePara para)`
- `Void MoveObjectUp(WorkSpacePara para)`
- `DeleteMessage CheckObjectCanDelete(WorkSpacePara para)`
- `Void DeleteObject(WorkSpacePara para)`
- `Boolean CheckObjectLastInsert(WorkSpacePara para)`
- `Boolean CheckObjectExistOnCurrentNode(WorkSpacePara para)`
- `String GetWorkSpaceObjectPath(WorkSpacePara para)`
- `Dictionary`2 GetWorkSpacePosition(WorkSpacePara para)`
- `Void SaveWorkSpacePosition(WorkSpacePara para)`
- `Boolean GetWorkSpaceWSFOLDER(WorkSpacePara para)`
- `Boolean LoopForProcessWSFOLDER(WorkSpacePara para)`

## Hoteam.Mobile.Common.Service.dll

### [class] Hoteam.Mobile.Common.Service.CommonService
- `ReturnListData GetAllData(GetItemBomDataPara para)`
- `ReturnObjectInfoData GetObjectPropertyData(GetItemBomDataPara para)`
- `WorkPromptData GetWorkPromptData(GetListDataPara para)`

### [interface] Hoteam.Mobile.Common.Service.ICommonService
- `ReturnListData GetAllData(GetItemBomDataPara para)`
- `ReturnObjectInfoData GetObjectPropertyData(GetItemBomDataPara para)`
- `WorkPromptData GetWorkPromptData(GetListDataPara para)`

## Hoteam.InforCenter.Mobile.Service.dll

### [class] Hoteam.InforCenter.Mobile.Service.MobilePlatformService
- `ReturnLoginUser GetLoginUser(LoginUserPara para)`
- `Boolean CheckPassword(PasswordPara para)`
- `ReturnPersonalSetting GetPersonalSetting(SessionPara para)`
- `Boolean SavePersonalSetting(PersonalSettingPara para)`
- `ReturnListData GetAllData(GetItemBomDataPara para)`
- `ReturnObjectInfoData GetObjectPropertyData(GetListDataPara para)`
- `RetunMessageStatistics GetIISMessageStatistics(MobileBasePara para)`
- `RetunSingleMessageData GetSingleMessageData(GetListDataPara para)`

### [interface] Hoteam.InforCenter.Mobile.Service.IMobilePlatformService
- `ReturnLoginUser GetLoginUser(LoginUserPara para)`
- `Boolean CheckPassword(PasswordPara para)`
- `ReturnPersonalSetting GetPersonalSetting(SessionPara para)`
- `Boolean SavePersonalSetting(PersonalSettingPara para)`
- `ReturnListData GetAllData(GetItemBomDataPara para)`
- `ReturnObjectInfoData GetObjectPropertyData(GetListDataPara para)`
- `RetunMessageStatistics GetIISMessageStatistics(MobileBasePara para)`
- `RetunSingleMessageData GetSingleMessageData(GetListDataPara para)`

## Hoteam.InforCenter.MobileRegistered.Service.dll

### [interface] Hoteam.InforCenter.MobileRegistered.Service.IMobileRegisteredService
- `ReturnLoginUser GetLoginUser(LoginUserPara para)`
- `Boolean CheckPassword(PasswordPara para)`
- `ReturnPersonalSetting GetPersonalSetting(SessionPara para)`
- `Boolean SavePersonalSetting(PersonalSettingPara para)`

### [class] Hoteam.InforCenter.MobileRegistered.Service.MobileRegisteredService
- `ReturnLoginUser GetLoginUser(LoginUserPara para)`
- `Boolean CheckPassword(PasswordPara para)`
- `ReturnPersonalSetting GetPersonalSetting(SessionPara para)`
- `Boolean SavePersonalSetting(PersonalSettingPara para)`

## Hoteam.InforCenter.Mobile.Service.dll

> LOAD FAILED: 使用“1”个参数调用“ReflectionOnlyLoadFrom”时发生异常:“API 限制: 程序集“file:///E:\tedri_project\dev\Plm_Code\PLMSOFT\Server\MobilePlatform\H5\Bin\Hoteam.InforCenter.Mobile.Service.dll”已从其他位置加载。无法从同一个 Appdomain 中的另一新位置加载该程序集。”

## Hoteam.InforCenter.MobileRegistered.Service.dll

> LOAD FAILED: 使用“1”个参数调用“ReflectionOnlyLoadFrom”时发生异常:“API 限制: 程序集“file:///E:\tedri_project\dev\Plm_Code\PLMSOFT\Server\MobilePlatform\H5\Bin\Hoteam.InforCenter.MobileRegistered.Service.dll”已从其他位置加载。无法从同一个 Appdomain 中的另一新位置加载该程序集。”

## Hoteam.InforCenter.MobileNative.Service.dll

### [interface] Hoteam.InforCenter.MobileNative.Service.IMobileNativeService
- `String RePassWord(RePasswordPara para)`
- `MobileRetMsg InputCardIdOrFaceId(MobileUserInfoPara para)`
- `String CheckLoginTypeId(MobileUserInfoPara para)`
- `HomePageRet GetHomePageInfo(HomePagePara para)`
- `List`1 GetNavPageInfo(SessionPara para)`
- `MobileListRet GetStandardListLayout(MobilePagePara para)`
- `MobileListDataRet GetStandardListData(MobilePageDataPara para)`
- `MobilePropertyRet GetPropertyTabLayout(MobilePropertyPara para)`
- `String GetPropertyTabID(MobilePropertyPara para)`
- `List`1 GetPropertyTabData(MobilePropertyPara para)`
- `MobileObjectFormRet GetObjectFormByObjectId(ObjectFormPara para)`
- `MobileObjectFormRet GetObjectForm(ObjectFormPara para)`
- `MobileGridObject GetQueryDataByFilter(MobileOnePageDataPara para)`
- `Dictionary`2 GetDropDownListData(FormDataSourcePara para)`
- `Dictionary`2 GetTextValueListData(FormDataSourcePara para)`
- `MobileGridTitleData GetQueryTitleDataByViewName(MobileOnePageDataPara para)`
- `MobileGridObject GetQueryGridByFilter(MobileOnePageDataPara para)`
- `ExecScriptRet SetUserEnabled(MobileButtonPara para)`
- `ExecScriptRet SaveObject(MobileButtonPara para)`
- `ExecScriptRet GetButtonExecScript(ExecScriptPara para)`
- `Dictionary`2 GetUnHandleInformationNum(SessionPara para)`
- `Dictionary`2 GetChangeTaskActor(ChangeTaskActorPara para)`
- `MobileFlowAuditRet GetFlowAuditData(MobilePageDataPara para)`
- `String UpdataWorkflowActor(ChangeTaskActorPara para)`
- `SubmitFlowPara SubmitFlow(AuditFlowTaskPara para)`
- `List`1 GetFlowActorEditData(MobilePageDataPara para)`
- `Dictionary`2 GetAdvancedQuerySelectItem(AdvancedQueryPara para)`
- `List`1 GetWorkPanelInfo(SessionPara para)`
- `DatasetDownloadInfos GetDatasetDownloadInfo(MobilePageDataPara para)`
- `LoginPageInitInfo GetMobileLoginInfo(LangPara para)`
- `DetailInfomationRet GetDIData(DetailInfomationPara para)`
- `String GetDepartment(SessionPara para)`
- `DeptUser GetPeopleDetail(MobilePageDataPara para)`
- `String SendMessage(JPushPara para)`

### [class] Hoteam.InforCenter.MobileNative.Service.MobileNativeService
- `String RePassWord(RePasswordPara para)`
- `List`1 GetNavPageInfo(SessionPara para)`
- `HomePageRet GetHomePageInfo(HomePagePara para)`
- `MobileListRet GetStandardListLayout(MobilePagePara para)`
- `MobileListDataRet GetStandardListData(MobilePageDataPara para)`
- `MobileObjectFormRet GetObjectFormByObjectId(ObjectFormPara para)`
- `MobileObjectFormRet GetObjectForm(ObjectFormPara para)`
- `MobileGridTitleData GetQueryTitleDataByViewName(MobileOnePageDataPara para)`
- `MobileGridObject GetQueryDataByFilter(MobileOnePageDataPara para)`
- `MobileGridObject GetQueryGridByFilter(MobileOnePageDataPara para)`
- `Dictionary`2 GetDropDownListData(FormDataSourcePara para)`
- `Dictionary`2 GetTextValueListData(FormDataSourcePara para)`
- `ExecScriptRet SetUserEnabled(MobileButtonPara para)`
- `ExecScriptRet SaveObject(MobileButtonPara para)`
- `MobilePropertyRet GetPropertyTabLayout(MobilePropertyPara para)`
- `List`1 GetPropertyTabData(MobilePropertyPara para)`
- `String GetPropertyTabID(MobilePropertyPara para)`
- `ExecScriptRet GetButtonExecScript(ExecScriptPara para)`
- `Dictionary`2 GetUnHandleInformationNum(SessionPara para)`
- `Dictionary`2 GetChangeTaskActor(ChangeTaskActorPara para)`
- `MobileFlowAuditRet GetFlowAuditData(MobilePageDataPara para)`
- `List`1 GetFlowActorEditData(MobilePageDataPara para)`
- `String UpdataWorkflowActor(ChangeTaskActorPara para)`
- `SubmitFlowPara SubmitFlow(AuditFlowTaskPara para)`
- `Dictionary`2 GetAdvancedQuerySelectItem(AdvancedQueryPara para)`
- `DatasetDownloadInfos GetDatasetDownloadInfo(MobilePageDataPara para)`
- `MobileRetMsg InputCardIdOrFaceId(MobileUserInfoPara para)`
- `String CheckLoginTypeId(MobileUserInfoPara para)`
- `LoginPageInitInfo GetMobileLoginInfo(LangPara para)`
- `List`1 GetWorkPanelInfo(SessionPara para)`
- `DetailInfomationRet GetDIData(DetailInfomationPara para)`
- `String GetDepartment(SessionPara para)`
- `DeptUser GetPeopleDetail(MobilePageDataPara para)`
- `String SendMessage(JPushPara para)`

## Hoteam.InforCenter.MobilePageDev.Service.dll

### [class] Hoteam.InforCenter.MobilePageDev.Service.MobilePageDevService
- `Dictionary`2 GetPageName(SessionPara para)`
- `List`1 GetMainConfigPage(MobilePageDevPara para)`
- `String SaveMobilePageListItem(SaveMobilePageListItemDataPara para)`
- `String SaveMobilePageObjectForm(SaveMobilePageListItemDataPara para)`
- `Dictionary`2 GetMobilePageDevName(SessionPara para)`
- `String Test(TestPara para)`
- `TreeChildData GetDevelopmentChildData(TreeViewPara para)`
- `Boolean MobilePageDevMove(MobilePageDevMovePara para)`

## Hoteam.InforCenter.MobilePermission.Service.dll

### [interface] Hoteam.InforCenter.MobilePermission.Service.IMobilePermissionService
- `List`1 GetDevPageNodeData(SessionPara para)`
- `String GetDevPageChildNodeData(PermissionPara para)`
- `Boolean SavePermission(PermissionPara para)`
- `String GetPermissionStr(PermissionPara para)`

### [class] Hoteam.InforCenter.MobilePermission.Service.MobilePermissionService
- `List`1 GetDevPageNodeData(SessionPara para)`
- `String GetDevPageChildNodeData(PermissionPara para)`
- `Boolean SavePermission(PermissionPara para)`
- `String GetPermissionStr(PermissionPara para)`

## Hoteam.InforCenter.AccessRecord.Service.dll

### [class] Hoteam.InforCenter.AccessRecord.Service.AccessRecordService
- `Boolean DeleteAllRecord(AccessRecordPara para)`
- `Boolean DeleteRecord(AccessRecordPara para)`
- `Boolean DeleteRecordByTimeRange(AccessRecordPara para)`
- `List`1 GetAccessRecordAllNode(TreeViewPara para)`
- `TreeChildData GetAccessRecordChildNode(TreeViewPara para)`
- `GridObject GetAccessRecordGridData(OnePageGridDataPara para)`
- `GridTitleData GetAccessRecordGridTitle(GridRowTitlePara para)`
- `TreeRootData GetAccessRecordRootNode(TreeViewPara para)`
- `List`1 GetAllObjectTypeData(SessionPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`

### [interface] Hoteam.InforCenter.AccessRecord.Service.IAccessRecordService
- `TreeRootData GetAccessRecordRootNode(TreeViewPara para)`
- `TreeChildData GetAccessRecordChildNode(TreeViewPara para)`
- `List`1 GetAccessRecordAllNode(TreeViewPara para)`
- `Boolean DeleteRecord(AccessRecordPara para)`
- `Boolean DeleteAllRecord(AccessRecordPara para)`
- `Boolean DeleteRecordByTimeRange(AccessRecordPara para)`
- `GridTitleData GetAccessRecordGridTitle(GridRowTitlePara para)`
- `GridObject GetAccessRecordGridData(OnePageGridDataPara para)`
- `List`1 GetAllObjectTypeData(SessionPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`

## Hoteam.InforCenter.Common.DataService.dll

### [class] Hoteam.InforCenter.Common.DataService.ServiceInit
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ServiceUtility
- `String ToWebIconPath(String iconPath)`
- `Dictionary`2 SPlitReturnParameter(String paraList)`
- `String ReplaceParameters(Dictionary`2 paraValues, String fliter)`
- `String ReplaceQueryID(SessionPara para, String queryID)`
- `String ListConvertToString(List`1 objectIDs)`
- `List`1 GetFilterFlag(List`1 filterFlag, String filter)`
- `String ReplaceFilter(Dictionary`2 paraValues, String filterString, String configFilter)`
- `List`1 StringConvertToList(String str)`
- `List`1 GetParaValueList(TreeListPara para, String paraName)`
- `String GetParaFirstValue(TreeListPara para, String paraName)`
- `String ReplaceJsonString(String json, String filter)`
- `TreeNodeObject GetTreeNodeObject(String text, String eid, String lid, String objType, String nodeIndex, String iconOpen, String nodeType, Boolean IsOpenTreeNode)`
- `Void ExecuteJsException(String title, String detail, String containerID, String order)`
- `BaseObject ViewObjectToBaseObject(ViewConfig view, Object obj)`
- `List`1 ViewObjectsToBaseObjects(ViewConfig view, List`1 objs)`
- `List`1 ViewObjectsToLinkObjects(ViewConfig view, List`1 objs)`
- ` GetObjectImagePath(<unresolved>)`
- `String GetExpandActionByTreeView(WebTreeView treeView, BaseTreeView schemaView)`
- ` CheckTreeNodeExpandPermission(<unresolved>)`
- ` CheckTreeNodeExpandPermission(<unresolved>)`
- `Dictionary`2 GetMutliObjectSettings(String settings)`
- `Dictionary`2 GetFilterFlagValues(TreeListPara para, List`1 filterFlag)`
- `String ReplaceXMLStr(String str)`

### [class] Hoteam.InforCenter.Common.DataService.FeildSettings
- (no public methods)

### [interface] Hoteam.InforCenter.Common.DataService.WebAction.Service.IWebActionService
- `Void ExecuteBusinessMethod(BusinessMethodPara para)`
- `Void ExecuteMessageAndLoggerMethod(MessageAndLoggerPara para)`
- `Boolean CheckSelectType(CheckSelectTypePara para)`
- `Boolean CheckActionPermission(CheckActionPara para)`
- `Boolean CheckObjectInfo(CheckActionPara para)`
- `String CustomCmdsqlCheck(CheckActionPara para)`

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Service.WebActionService
- `Void ExecuteBusinessMethod(BusinessMethodPara para)`
- `Void ExecuteMessageAndLoggerMethod(MessageAndLoggerPara para)`
- `Boolean CheckSelectType(CheckSelectTypePara para)`
- `Boolean CheckActionPermission(CheckActionPara para)`
- `Boolean CheckObjectInfo(CheckActionPara para)`
- `String CustomCmdsqlCheck(CheckActionPara para)`

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.BrowserPermissionPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.BusinessMethodPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.MethodPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.CheckActionPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.CheckSelectTypePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.MessageAndLoggerPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Parameter.PagePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.BusinessMethodExecutor
- `Boolean ExcuteBusinessMethod(BusinessMethodPara para, List`1 methodPara)`

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.CheckActionExecutor
- ` CheckAction(<unresolved>)`
- `Boolean CheckAction(CheckActionPara para)`
- ` CustomCmdsqlCheck(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.CheckSelectTypeExecutor
- `Boolean CheckType(CheckSelectTypePara para)`

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.MenuSelectTypeInfo
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.ObjectInfoTypeInfo
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.WebAction.Business.MessageAndLoggerMethodExecutor
- `Boolean ExecuteMessageAndLoggerMethod(MessageAndLoggerPara para)`
- ` ExecuteMessageAndLoggerMethod(<unresolved>)`
- `String GetInstantMessageLink(String objid)`
- ` SendMessage(<unresolved>)`
- ` RecordLogger(<unresolved>)`
- ` RecordLogger(<unresolved>)`

### [interface] Hoteam.InforCenter.Common.DataService.TreeView.Service.IWebTreeViewService
- `TreeRootData GetTreeRootData(TreeViewPara para)`
- `TreeChildData GetTreeChildData(TreeViewPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetTreeQueryData_Prefilted(TreeViewQueryPara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `List`1 GetTreeSimpleAllData(TreeViewPara para)`
- `Boolean GetTreeNodeExpandPermission(TreeViewPara para)`
- `String GetTreeNodeChildCount(TreeViewPara para)`

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Service.WebTreeViewService
- `TreeRootData GetTreeRootData(TreeViewPara para)`
- `TreeChildData GetTreeChildData(TreeViewPara para)`
- `Boolean GetTreeNodeExpandPermission(TreeViewPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetTreeQueryData_Prefilted(TreeViewQueryPara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `List`1 GetTreeSimpleAllData(TreeViewPara para)`
- `String GetTreeNodeChildCount(TreeViewPara para)`

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Parameter.TreeChildData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Parameter.TreeSimpleNode
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Parameter.TreeViewPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Parameter.TreeViewQueryPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeView.Business.TreeViewExecutor
- ` GenerateRootNodes(<unresolved>)`
- ` LoadRootTreeNodeObject(<unresolved>)`
- ` CheckNodeExpandPermission(<unresolved>)`
- ` CheckTreeNodeExpandPermission(<unresolved>)`
- `TreeNodeObject AddNodeToTree(List`1 rowItem, String text, String objType, String iconClose, String iconOpen, Int32 itemKey, Boolean isOpenTreeNode, String nodeType)`
- `TreeNodeObject AddNodeToTree(List`1 rowItem, String text, String objType, String iconClose, String iconOpen, Int32 itemKey, Boolean isOpenTreeNode, String nodeType, BaseObject baseobj)`
- ` LoadNextTreeNodeObjects(<unresolved>)`
- `List`1 QueryTreeNode()`
- `List`1 QueryTreeNode_Prefilted()`
- ` GetTreeSimpleAllData(<unresolved>)`
- ` GetAllTreeNodeData(<unresolved>)`
- ` IsExistChildrenNode(<unresolved>)`
- ` SetShowExpandIconForRoot(<unresolved>)`
- ` SetShowExpandIcon(<unresolved>)`
- ` SetShowExpandIcon(<unresolved>)`

### [interface] Hoteam.InforCenter.Common.DataService.TreeListView.Service.IWebTreeListViewService
- `TreeListRootData GetTreeListRootData(TreeListViewPara para)`
- `TreeListChildData GetTreeListChildData(TreeListViewPara para)`
- `List`1 GetTreeListQueryData(TreeListViewQueryPara para)`
- `TreeListRootData GetTreeListAllData(TreeListViewPara para)`
- `Boolean GetTreeNodeExpandPermission(TreeListViewPara para)`

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Service.WebTreeListViewService
- `TreeListRootData GetTreeListRootData(TreeListViewPara para)`
- `TreeListChildData GetTreeListChildData(TreeListViewPara para)`
- `List`1 GetTreeListQueryData(TreeListViewQueryPara para)`
- `TreeListRootData GetTreeListAllData(TreeListViewPara para)`
- `Boolean GetTreeNodeExpandPermission(TreeListViewPara para)`

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Parameter.TreeListChildData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Parameter.TreeListRootData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Parameter.TreeListOptions
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Parameter.TreeListViewPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.TreeListView.Parameter.TreeListViewQueryPara
- (no public methods)

### [interface] Hoteam.InforCenter.Common.DataService.Object.IObjectService
- `String GetObjectData(GetObjectDataPara para)`
- `String GetObjectInitData(GetObjectInitDataPara para)`
- `TreeRootData GetCreateMultiObjectTreeData(TreeViewPara para)`
- `Dictionary`2 GetSubDataModelList(SubDataModelPara para)`
- `Dictionary`2 GetUnionDataModelList(UnionDataModelPara para)`
- `Dictionary`2 GetLinkChildDataModelList(SubDataModelPara para)`
- `String SaveObjectData(SaveObjectDataPara para)`
- `String SaveFkObjectData(SaveObjectDataPara para)`
- `Boolean CommonSaveData(SaveObjectDataPara para)`
- `String CommonGetDataByCmdSql(SaveObjectDataPara para)`
- `String CommonGetObjectDataByFilter(SaveObjectDataPara para)`
- `String CreateGuidList(SaveObjectDataPara para)`
- `String DeleteAllVersionObjectData(DeleteObjectDataPara para)`
- `String DeleteObjectData(DeleteObjectDataPara para)`
- `AddLinkMessage AddLinkObject(AddLinkAndInitDataPara para)`
- `String DeleteLinkObject(DeleteLinkObjectPara para)`
- `List`1 GetStatesList(GetStatesListPara para)`
- `List`1 GetStageStatesList(GetStatesListPara para)`
- `List`1 GetStatesListItem(GetStatesListPara para)`
- `Int32 DeleteObjCheckObjToObj(DeleteObjCheckPara para)`
- `Int32 DeleteObjCheckLink(DeleteObjCheckLinkPara para)`
- `AddLinkMessage Paste(ClipBoardPara para)`
- `String Cut(ClipBoardPara para)`
- `ObjectInitData GetObjectInitDataByIDs(GetObjectInitDataPByIDsPara para)`
- `Void ChangeObjectOwnGroup(ChangeObjectOwnGroupPara para)`
- `Void ChangeObjectOwnUser(ChangeObjectOwnUserPara para)`
- `Boolean CheckObjectUnique(SaveObjectDataPara para)`
- `Dictionary`2 GetObjectTypeList(ObjectTypeListPara para)`
- `Dictionary`2 GetObjectTypeListByModelGroup(ModelGroupPara para)`
- `Dictionary`2 GetStateList(StatePara para)`
- `Dictionary`2 GetMajorMinorVersionList(VersionPara para)`
- `Void MoveObject(MoveObjectPara para)`
- `String GetObjectTypeIcon(GetObjectInitDataPara para)`
- `Dictionary`2 GetInfoTypeList(ObjectTypeListPara para)`
- `Dictionary`2 GetDataModelsExtendList(SubDataModelPara para)`
- `String GetForeignKeyObject(GetObjectDataPara para)`
- `String GetForeignKeyObjectInitData(GetObjectInitDataPara para)`
- `String GetControlPermissionByObjType(SaveObjectDataPara para)`
- `String ExportTableRecords(GetObjectDataPara para)`
- `String ExportTables(GetObjectInitDataPara para)`
- `ObjectInfoType GetObjectInfoType(GetObjectInfoTypePara para)`
- `List`1 GetObjectInfoControlData(GetObjectInfoTypePara para)`
- `Dictionary`2 GetObjTypeFieldData(GetObjectInfoTypePara para)`
- `Boolean ClearDiskLog(SessionPara para)`
- `List`1 GetObjectOperateType(ObjectTypeListPara para)`
- `String GetGridDataFromObjectIds(GetGridDataFromObjectIdsPara para)`

### [class] Hoteam.InforCenter.Common.DataService.Object.ObjectInfoTypeOperate
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ExportTablePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ExportTableRecordPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.GetStatesListPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.GetObjectInfoTypePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.GetObjectDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.GetObjectInitDataPByIDsPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ObjectInitData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.GetObjectInitDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.SaveObjectDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ChangeObjectOwnUserPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ChangeObjectOwnGroupPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.DeleteObjectDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ClipBoardPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.ObjectService
- `String GetObjectData(GetObjectDataPara para)`
- `String GetObjectInitData(GetObjectInitDataPara para)`
- `TreeRootData GetCreateMultiObjectTreeData(TreeViewPara para)`
- `Dictionary`2 GetSubDataModelList(SubDataModelPara para)`
- `Dictionary`2 GetUnionDataModelList(UnionDataModelPara para)`
- `Dictionary`2 GetLinkChildDataModelList(SubDataModelPara para)`
- `Dictionary`2 GetDataModelsExtendList(SubDataModelPara para)`
- `ObjectInitData GetObjectInitDataByIDs(GetObjectInitDataPByIDsPara para)`
- `Void ChangeObjectOwnUser(ChangeObjectOwnUserPara para)`
- `Void ChangeObjectOwnGroup(ChangeObjectOwnGroupPara para)`
- `String SaveObjectData(SaveObjectDataPara para)`
- `String SaveFkObjectData(SaveObjectDataPara para)`
- `Boolean CommonSaveData(SaveObjectDataPara para)`
- `String CommonGetDataByCmdSql(SaveObjectDataPara para)`
- `String CommonGetObjectDataByFilter(SaveObjectDataPara para)`
- `String CreateGuidList(SaveObjectDataPara para)`
- `Boolean CheckObjectUnique(SaveObjectDataPara para)`
- `String DeleteAllVersionObjectData(DeleteObjectDataPara para)`
- `String DeleteObjectData(DeleteObjectDataPara para)`
- `Int32 DeleteObjCheckObjToObj(DeleteObjCheckPara para)`
- `Int32 DeleteObjCheckLink(DeleteObjCheckLinkPara para)`
- `List`1 GetStatesList(GetStatesListPara para)`
- `AddLinkMessage Paste(ClipBoardPara para)`
- `String Cut(ClipBoardPara para)`
- `String DeleteLinkObject(DeleteLinkObjectPara para)`
- `AddLinkMessage AddLinkObject(AddLinkAndInitDataPara para)`
- `Dictionary`2 GetObjectTypeList(ObjectTypeListPara para)`
- `Dictionary`2 GetInfoTypeList(ObjectTypeListPara para)`
- `Dictionary`2 GetObjectTypeListByModelGroup(ModelGroupPara para)`
- `Dictionary`2 GetMajorMinorVersionList(VersionPara para)`
- `Dictionary`2 GetStateList(StatePara para)`
- `Void MoveObject(MoveObjectPara para)`
- `String GetObjectTypeIcon(GetObjectInitDataPara para)`
- `String GetForeignKeyObject(GetObjectDataPara para)`
- `String GetForeignKeyObjectInitData(GetObjectInitDataPara para)`
- `String GetControlPermissionByObjType(SaveObjectDataPara para)`
- `String ExportTableRecords(GetObjectDataPara para)`
- `String ExportTables(GetObjectInitDataPara para)`
- `ObjectInfoType GetObjectInfoType(GetObjectInfoTypePara para)`
- `Dictionary`2 GetObjTypeFieldData(GetObjectInfoTypePara para)`
- `List`1 GetObjectInfoControlData(GetObjectInfoTypePara para)`
- `List`1 GetStageStatesList(GetStatesListPara para)`
- `List`1 GetStatesListItem(GetStatesListPara para)`
- `Boolean ClearDiskLog(SessionPara para)`
- `List`1 GetObjectOperateType(ObjectTypeListPara para)`
- `String GetGridDataFromObjectIds(GetGridDataFromObjectIdsPara para)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.AddLinkAndInitDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.AddLinkData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.InitData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.AddLinkMessage
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.DeleteLinkObjectPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.FilterData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.DeleteObjCheckLinkPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.DeleteObjCheckPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.GetGridDataFromObjectIdsPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.ModelGroupPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.MoveObjectPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.ObjectTypeListPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.StatePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.SubDataModelPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.UnionDataModelPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Parameter.VersionPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.AddLinkObjectUtil
- ` AddLinkAndInitDataAndExist(<unresolved>)`
- ` AddLinkAndInitDataExistLinkFilter(<unresolved>)`
- ` AddLinkAndInitDataExistLinkFilterWithoutCheckLoopAndUnique(<unresolved>)`
- ` ReplaceCheckMessage(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.AddLinkCheckResultType
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.CheckObjectUniqueUtil
- ` CheckObjectUnique(<unresolved>)`
- ` CheckObjectFieldUnique(<unresolved>)`
- ` CheckLinkFieldUnique(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.DataExportUtil
- `DBDatasFile ExportTableRecords(SessionPara para, List`1 ids)`
- `DBDatasFile ExportTables(SessionPara para, List`1 tableNames)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.DeleteObjCheckUtil
- `Int32 DeleteObjCheckObjToObj(SessionPara para, String ValidateObject, String SelectID, String IsPrompt)`
- `Int32 DeleteObjCheckLink(DeleteObjCheckLinkPara para)`
- `Boolean CheckIsExistLink(SessionPara para, String field, Boolean isPType, String selectID, Boolean oneIsReference, String linkfilter)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.ObjectServiceUtil
- ` GetSubDataModelList(<unresolved>)`
- ` GetDataModelsExtendList(<unresolved>)`
- ` GetLinkChildDataModelList(<unresolved>)`
- ` GetForeignKeyObject(<unresolved>)`
- ` GetUnionDataModelList(<unresolved>)`
- ` GetControlPermissionByObjType(<unresolved>)`
- `String GetFkObjOrderString(String objTypeStr)`
- `String GetGridDataFromObjectIds(GetGridDataFromObjectIdsPara para)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.PasteLinkObjectUtility
- ` CopyLinkAndInitDataExistLinkFilter(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.Object.Business.SaveObjectDataUtil
- ` SaveObjectData(<unresolved>)`
- ` DeleteObjectData(<unresolved>)`
- ` CommonSaveData(<unresolved>)`
- ` CommonGetDataByCmdSql(<unresolved>)`
- ` CommonGetObjectDataByFilter(<unresolved>)`
- `String CreateGuidList(SessionPara para, String guidCount)`
- ` SaveFkObjectData(<unresolved>)`
- ` SaveFkObjectData(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.FilterListView.Service.FilterListViewService
- `FilterGridTitleData GetGridRowTitle(GridRowTitlePara para)`
- `String GetOnePageGridData(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.Common.DataService.FilterListView.Service.IFilterListViewService
- `String GetOnePageGridData(OnePageGridDataPara para)`
- `FilterGridTitleData GetGridRowTitle(GridRowTitlePara para)`

### [class] Hoteam.InforCenter.Common.DataService.FilterListView.Parameter.FilterGridTitleData
- (no public methods)

### [interface] Hoteam.InforCenter.Common.DataService.ListView.Service.IWebListViewService
- `GridObject GetOnePageGridData(OnePageGridDataPara para)`
- `GridTitleData GetGridRowTitle(GridRowTitlePara para)`
- `GridTitleAndRowData GetGridTitleAndData(OnePageGridDataPara para)`
- `List`1 GetWebViewQueryBaseData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.Common.DataService.ListView.Service.WebListViewService
- `GridTitleData GetGridRowTitle(GridRowTitlePara para)`
- `GridObject GetOnePageGridData(OnePageGridDataPara para)`
- `GridTitleAndRowData GetGridTitleAndData(OnePageGridDataPara para)`
- `List`1 GetWebViewQueryBaseData(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.GridRowTitlePara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.GridTitleAndRowData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.GridTitleData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.OnePageGridDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.QueryDataItem
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.TreeListPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Parameter.TreeRootData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.ListView.Business.FilterListViewExecutor
- `FilterGridTitleObject GetGridTitleDataByViewName(SessionPara para, WebListView webList, String& keyFeild)`
- `FilterGridTitleObject GetGridTitleObjectDataByViewName(SessionPara para, WebListView webList, String& keyFeild)`
- `FilterGridDataObject GetGridDataByViewName(OnePageGridDataPara para, WebListView webList)`
- ` GetViewData(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.ListView.Business.ListViewExecutor
- `GridRowTitleObject GetGridTitleDataByViewName(SessionPara para, WebListView webList, String& keyFeild)`
- `GridRowTitleData GetGridTitleObjectDataByViewName(SessionPara para, WebListView webList, String& keyFeild)`
- `GridObject GetGridDataByViewName(OnePageGridDataPara para, WebListView webList)`
- ` GetViewData(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Service.EditWebListViewService
- `EditGridTitleData GetEditGridRowTitle(GridRowTitlePara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`
- `Boolean SaveEditGrid(SaveEditGridPara para)`

### [interface] Hoteam.InforCenter.Common.DataService.EditListView.Service.IEditWebListViewService
- `EditGridTitleData GetEditGridRowTitle(GridRowTitlePara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`
- `Boolean SaveEditGrid(SaveEditGridPara para)`

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Parameter.EditGridDataPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Parameter.EditGridTitleData
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Parameter.SaveEditGridPara
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Business.EditListViewExecutor
- `EditGridRowTitleData GetEditGridTitleObjectDataByViewName(SessionPara para, WebListView webList)`
- `EditGridRowTitleObject GetEditGridTitleDataByViewName(SessionPara para, WebListView webList)`
- `EditGridObject GetGridDataByViewName(EditGridDataPara para, WebListView webList)`
- ` GetViewData(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.EditListView.Business.SaveEditList
- ` AddObject(<unresolved>)`
- ` AddObject(<unresolved>)`
- ` EditObject(<unresolved>)`
- ` EditObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.Control.SelectedList
- (no public methods)

### [interface] Hoteam.InforCenter.Common.DataService.Config.IListRowDataFormart
- ` ListRowDataFormart(<unresolved>)`

### [class] Hoteam.InforCenter.Common.DataService.Config.WebListViews
- `Void Init()`
- `Void SingleInit(String path)`
- `WebListView Get(String Name)`
- `List`1 GetFileByFilter(String txt)`

### [class] Hoteam.InforCenter.Common.DataService.Config.WebListViewsFile
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.WebListView
- `IListRowDataFormart GetListRowDataFormartInstance()`
- `List`1 GetConfigFilterFlag(List`1 filterFlag)`

### [class] Hoteam.InforCenter.Common.DataService.Config.WebListColumnType
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.EditWebListColumnType
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.EditOperatorColumnType
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.DetailColumnSetting
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.WebQueryViewMachine
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.WebTreeViews
- `List`1 GetFileByFilter(String txt)`
- `Void Init()`
- `Void SingleInit(String path)`
- `WebTreeView Get(String Name)`

### [class] Hoteam.InforCenter.Common.DataService.Config.WebTreeViewsFile
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.BaseTreeView
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.WebTreeView
- `List`1 GetConfigFilterFlag(List`1 filterFlag)`
- `String GetHeader(String lanuage)`
- `String GetCaption(String lanuage)`
- `String GetText(String lanuage)`
- `List`1 LoadSchemas(String superSchemaKey, String objType, String nodeType)`
- `List`1 GetTreeViewFilterFlag()`
- `String GetTreeViewExpandAction(String schemaKey)`

### [class] Hoteam.InforCenter.Common.DataService.Config.WebTreeSchema
- `String GetHeader(String lanuage)`
- `String GetCaption(String lanuage)`
- `String GetText(String lanuage)`

### [class] Hoteam.InforCenter.Common.DataService.Config.QueryViewSchema
- (no public methods)

### [class] Hoteam.InforCenter.Common.DataService.Config.NodeValue
- (no public methods)

## Hoteam.InforCenter.DataIsolation.Service.dll

### [class] Hoteam.InforCenter.DataIsolation.Service.DataIsolationService
- `List`1 GetShareGroupTree(SessionPara para)`
- `String GetShareGroupByGroupID(SessionPara para)`
- `Boolean IsDataGroup(SessionPara para)`
- `Boolean SetGroupIsolation(SessionPara para)`
- `Boolean ClearGroupIsolation(SessionPara para)`
- `Boolean SaveGroupShareInfo(SessionPara para)`
- `Boolean EnableDataIsolation(SessionPara para)`
- `Boolean CheckSelectObjectCanSetShare(SessionPara para)`
- `Boolean IsCurrentGroupOrSubGroup(SessionPara para)`
- `Boolean SaveSelectObjectShareInfo(SaveSelectObjectGroupSharePara para)`
- `Boolean CheckGroupShareDateTime(SessionPara para)`
- `Boolean RefreshGroupShareInfo(SessionPara para)`
- `Boolean OrganizeChangeHandler(SessionPara para)`
- `BatchPermissionChildObjPageData GetChildObjectData(BatchPermissionPara para)`
- `Boolean SelectObjectOwnGroupCanShare(SessionPara para)`
- `GridObject GetObjectShareInfoGrid(SessionPara para)`
- `String GetOwnGroupShareInfo(SessionPara para)`
- `Boolean EnableDataIsolationByObjectID(SessionPara para)`
- `String GetObjectShareGroupInfos(SessionPara para)`

### [interface] Hoteam.InforCenter.DataIsolation.Service.IDataIsolationService
- `List`1 GetShareGroupTree(SessionPara para)`
- `String GetShareGroupByGroupID(SessionPara para)`
- `Boolean IsDataGroup(SessionPara para)`
- `Boolean SetGroupIsolation(SessionPara para)`
- `Boolean ClearGroupIsolation(SessionPara para)`
- `Boolean SaveGroupShareInfo(SessionPara para)`
- `Boolean EnableDataIsolation(SessionPara para)`
- `Boolean CheckSelectObjectCanSetShare(SessionPara para)`
- `Boolean IsCurrentGroupOrSubGroup(SessionPara para)`
- `Boolean SaveSelectObjectShareInfo(SaveSelectObjectGroupSharePara para)`
- `Boolean CheckGroupShareDateTime(SessionPara para)`
- `Boolean RefreshGroupShareInfo(SessionPara para)`
- `Boolean OrganizeChangeHandler(SessionPara para)`
- `BatchPermissionChildObjPageData GetChildObjectData(BatchPermissionPara para)`
- `Boolean SelectObjectOwnGroupCanShare(SessionPara para)`
- `GridObject GetObjectShareInfoGrid(SessionPara para)`
- `String GetOwnGroupShareInfo(SessionPara para)`
- `Boolean EnableDataIsolationByObjectID(SessionPara para)`
- `String GetObjectShareGroupInfos(SessionPara para)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Paras.BatchPermissionChildObjPageData
- (no public methods)

### [class] Hoteam.InforCenter.DataIsolation.Service.Paras.BatchPermissionPara
- (no public methods)

### [class] Hoteam.InforCenter.DataIsolation.Service.Paras.SaveSelectObjectGroupSharePara
- (no public methods)

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.DataGroupInnerCache
- `Void ClearCache()`
- ` GetShareGroups(<unresolved>)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.DataIsolationNotifyEventData
- (no public methods)

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.DataIsolationUpdateEventHandler
- `Void HandleEvent(DataIsolationNotifyEventData eventData)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.DataIsolationLogs
- ` WriteOperateLog(<unresolved>)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.DataIsolationUtility
- ` GetGroupTreeByID(<unresolved>)`
- ` IsSystemOrGroupAdmin(<unresolved>)`
- ` GroupIsolationCommonCheck(<unresolved>)`
- ` ComputeDataGroupIsolationAndShare(<unresolved>)`
- ` CheckObjectIsDataIsolation(<unresolved>)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.RefreshGroupShareUtility
- ` GetLock(<unresolved>)`
- ` ReleaseLock(<unresolved>)`
- `Boolean RefreshGroupShareInfo(SessionPara para)`
- `Boolean RefreshSelectObjectShareExpired(SessionPara para)`
- `Void WriteStartLog()`
- `Void WriteStopLog()`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.SelectObjectShareUtility
- ` CheckSelectObjectCanSetShare(<unresolved>)`
- ` IsCurrentGroupOrSubGroup(<unresolved>)`

### [class] Hoteam.InforCenter.DataIsolation.Service.Buz.ShowShareInfos
- ` GetObjectShareInfoGrid(<unresolved>)`

## Hoteam.InforCenter.Enumeration.Service.dll

### [class] Hoteam.InforCenter.Enumeration.Service.EnumerationService
- `Dictionary`2 GetEnumerationItem(EnumerationPara para)`
- `Dictionary`2 GetEnumerationItemFromObj(EnumerationPara para)`
- `Dictionary`2 GetOjbectEnumerationItem(EnumerationPara para)`
- `Dictionary`2 GetLovListItemFromObj(EnumerationPara para)`
- `Boolean IsPromptLovList(EnumerationPara para)`
- `Dictionary`2 GetLov(SessionPara para)`
- `Dictionary`2 GetLovListByName(EnumerationPara para)`
- `Boolean CheckEnum(SaveEnumPara para)`
- `Void SetMaxSequence(SetMaxSequencePara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `String EnumItemImportCheck(EnumImportPara para)`
- `Boolean EnumItemImportSave(EnumImportPara para)`
- `String MullevelLovGetEnumID(EnumerationPara para)`
- `String MullevelLovGetAllPath(EnumerationPara para)`

### [interface] Hoteam.InforCenter.Enumeration.Service.IEnumerationService
- `Dictionary`2 GetEnumerationItem(EnumerationPara para)`
- `Dictionary`2 GetEnumerationItemFromObj(EnumerationPara para)`
- `Dictionary`2 GetOjbectEnumerationItem(EnumerationPara para)`
- `Dictionary`2 GetLov(SessionPara para)`
- `Dictionary`2 GetLovListItemFromObj(EnumerationPara para)`
- `Dictionary`2 GetLovListByName(EnumerationPara para)`
- `Boolean CheckEnum(SaveEnumPara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`
- `Boolean IsPromptLovList(EnumerationPara para)`
- `Void SetMaxSequence(SetMaxSequencePara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `String EnumItemImportCheck(EnumImportPara para)`
- `Boolean EnumItemImportSave(EnumImportPara para)`
- `String MullevelLovGetEnumID(EnumerationPara para)`
- `String MullevelLovGetAllPath(EnumerationPara para)`

## Hoteam.InforCenter.ImportExport.Service.dll

### [class] Hoteam.InforCenter.ImportExport.Service.ImportExportService
- `ExportFileResult ExportFile(ExportWcfPara para)`
- `ExportFileResult ExportFileByTemplate(ExportWcfPara para)`
- `ExportFileResult ExportPdfFromExcelFile(ExportWcfPara para)`
- `String GetImportExcelContent(ImportWcfPara para)`
- `EditGridObject GetImportExcelData(ImportWcfPara para)`
- `String GetImportExcelPreviewData(ImportWcfPara para)`

### [class] Hoteam.InforCenter.ImportExport.Service.Parameter.ExportExcelTemplatePara
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Service.Excel.ExportExcelTemplateExecutor
- `ExcelExportTemplateDataModel GetExportTemplateResult(ExportExcelTemplatesConfig exportTemplate, ExportExcelTemplateDataSource exportDataSource)`
- `List`1 GetPageDataList(ExportExcelTemplatesConfig exportTemplate, ExportExcelTemplateDataSource exportDataSource)`
- `ExcelExportTemplateDataModel GetExportTemplateResult(ExportExcelTemplatesConfig exportTemplate, List`1 exportDataSource)`

### [class] Hoteam.InforCenter.ImportExport.Service.Excel.ExportExcelTemplateItemBom
- `ExcelExportTemplateDataModel ExportItemBom(ExportExcelTemplatePara para)`

### [class] Hoteam.InforCenter.ImportExport.Service.Excel.ExportExcelTemplateDataSource
- (no public methods)

## Hoteam.InforCenter.LifeCycle.Service.dll

### [interface] Hoteam.InforCenter.LifeCycle.Service.ILifeCycleService
- `List`1 GetLifeCycleToolBar(SessionPara para)`
- `List`1 GetLifeCycleState(SessionPara para)`
- `Boolean SaveLifeCycleData(LifeCycleSavePara para)`
- `LifeCycleEditInfo GetLifeCycleTemplate(LifeCycleSavePara para)`
- `List`1 LifeCycleSaveValidate(LifeCycleSavePara para)`
- `List`1 GetLifeCyclePluginListByType(LifeCycleSavePara para)`
- `List`1 GetLifeCyclePluginList(SessionPara para)`
- `Boolean SetLifeCycleEnabled(LifeCycleSavePara para)`
- `Boolean CheckLifeCycleNameExist(LifeCycleSavePara para)`

### [class] Hoteam.InforCenter.LifeCycle.Service.LifeCycleService
- `List`1 GetLifeCycleState(SessionPara para)`
- `List`1 GetLifeCycleToolBar(SessionPara para)`
- `Boolean SaveLifeCycleData(LifeCycleSavePara para)`
- `LifeCycleEditInfo GetLifeCycleTemplate(LifeCycleSavePara para)`
- `List`1 LifeCycleSaveValidate(LifeCycleSavePara para)`
- `List`1 GetLifeCyclePluginListByType(LifeCycleSavePara para)`
- `List`1 GetLifeCyclePluginList(SessionPara para)`
- `Boolean SetLifeCycleEnabled(LifeCycleSavePara para)`
- `Boolean CheckLifeCycleNameExist(LifeCycleSavePara para)`

## Hoteam.InforCenter.OperateLog.Service.dll

### [interface] Hoteam.InforCenter.OperateLog.Service.IOperateLogServiceExt
- `GridObject GetOperateLogOnePageGrid(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.OperateLog.Service.OperateLogServiceExt
- `GridObject GetOperateLogOnePageGrid(OnePageGridDataPara para)`

### [interface] Hoteam.InforCenter.Common.OperateLog.Service.IOperateLogService
- `Void RecordLog(LogPara para)`
- `Void EntityRecordLog(EntityLogPara para)`

### [class] Hoteam.InforCenter.Common.OperateLog.Service.OperateLogService
- `Void RecordLog(LogPara para)`
- `Void EntityRecordLog(EntityLogPara para)`

## Hoteam.InforCenter.Organization.DataService.dll

### [class] Hoteam.InforCenter.Organization.Parameter.LoginCheckPara
- (no public methods)

### [interface] Hoteam.InforCenter.Organization.DataService.Service.IOrganizationDataService
- `Int64 GetUserCheckOperateTimeSpan(SessionPara para)`
- `LoginPageInitInfo GetLoginInfo(LangPara para)`
- `LoginUser CheckAutoLoginUser(LoginUserPara para)`
- `LoginUser GetLoginUser(LoginUserPara para)`
- `LoginUser GetAgentUser(LoginUserPara para)`
- `PersonalSettingData GetUserInfoForPersonalSetting(LoginUserPara para)`
- `Boolean SaveForPersonalSetting(PersonalSettingPara para)`
- `Boolean SavePassword(PasswordPara para)`
- `String GetAgentID(SessionPara para)`
- `String GetUserName(SessionPara para)`
- `String GetPassword(SessionPara para)`
- `List`1 GetUserQuickNavigationList(QuickNavigationPara para)`
- `String AddQuickNavigation(QuickNavigationPara para)`
- `Boolean RemoveQuickNavigation(QuickNavigationPara para)`
- `String CheckPassword(PasswordPara para)`
- `LoginCheckPara GetLoginService(SessionPara para)`
- `TreeRootData GetGroupToGroupRootNode(TreeViewPara para)`
- `List`1 GetGroupToGroupChildNode(TreeViewPara para)`
- `Boolean CanSetAsAgence(PersonalSettingPara para)`
- `Boolean UpdateQuickNavigation(QuickNavigationPara para)`
- `Boolean UpdateQuickNavigationSort(QuickNavigationSortPara para)`
- `String SetDimissionState(UserPara para)`
- `String SetIncumbentState(UserPara para)`
- `Boolean MoveOrganization(TreeViewPara para)`
- `String MoveToOther(TreeViewPara para)`
- `TreeRootData GetGroupToGroupRootNodeForMoveToOther(TreeViewPara para)`
- `List`1 GetGroupToGroupChildNodeForMoveToOther(TreeViewPara para)`
- `GridObject GetRoleToUserGridData(OnePageGridDataPara para)`
- `Boolean InitQuickNavigation(InitQuickNavigationPara para)`
- `String SaveOrganizationData(ImportDataPara para)`
- `String GetUserListForTreeCommonQuery(SessionPara para)`
- `String GetRoleListForTreeCommonQuery(SessionPara para)`
- `String GetGroupListForTreeCommonQuery(SessionPara para)`
- `String GetGroupRoleListForTreeCommonQuery(SessionPara para)`
- `List`1 GetUserSelectList(UserSelectListQueryPara para)`
- `List`1 GetRoleSelectList(SessionPara para)`
- `List`1 GetGroupSelectList(SessionPara para)`
- `List`1 GetCompanyGroupSelectList(SessionPara para)`
- `List`1 GetGroupRoleSelectList(SessionPara para)`
- `Boolean SaveWorkAgentDate(WorkAgentPara para)`
- `Boolean CancelWorkAgentDate(WorkAgentPara para)`
- `List`1 RemoveExistEID(TreeViewPara para)`
- `Boolean RemoveOrganizeLinkCheck(TreeViewPara para)`
- `Boolean RemoveOrganizeLink(UserPara para)`
- `Boolean PersonDeleteCheck(UserPara para)`
- `Boolean ComanyGroupUserDeleteCheck(UserPara para)`
- `Boolean OrganizeDeleteCheck(UserPara para)`
- `Void UserTransferOwnership(TransferPara para)`
- `String ObjectTransferOwnership(TransferPara para)`
- `AddLinkMessage CompanyAddGroup(CompanyAddGroupPara para)`
- `AddLinkMessage GroupRoleAddUser(GroupRoleAddUserPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetRoleTreeQuery(TreeViewQueryPara para)`
- `Void CancelAgentSendMessage(SessionPara para)`
- `String TakeBackObjectOwnership(TransferPara para)`
- `Boolean SavePersonAndUser(PersonUserDataPara para)`
- `List`1 GetUserDropdownList(UserDropListPara para)`
- `List`1 GetRoleDropdownList(SessionPara para)`
- `List`1 GetGroupDropdownList(SessionPara para)`
- `List`1 GetUserSelectListByGroupID(UserSelectListPara para)`
- `Boolean RecordOrganizationTreeLog(SessionPara para)`
- `TreeRootData GetQueryUserListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryRoleListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryGroupListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryGroupRoleListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryMoveToOtherGroupListByName(GetQueryOrganizeListByNamePara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `GroupInfoDisplayInfo GetGroupInfoCreatePageDisplayInfo(SessionPara para)`
- `GroupInfoDisplayInfo GetGroupInfoEditPageDisplayInfo(SessionPara para)`
- `GroupInfoDisplayInfo GetGroupInfoViewPageDisplayInfo(SessionPara para)`
- `String GetGroupCode(SessionPara para)`
- `Boolean SetGroupSpace(SetGroupSpace para)`
- `Boolean InitGroupSpace(SessionPara para)`
- `Boolean IsSystemOrGroupAdminRecursion(SessionPara para)`
- `List`1 GetAllUserListData(UserSelectListQueryPara para)`
- `TryLoginUserPara GetLoginInfoByOAuth(TryLoginUserPara para)`

### [class] Hoteam.InforCenter.Organization.DataService.Service.OrganizationDataService
- `LoginPageInitInfo GetLoginInfo(LangPara para)`
- `LoginUser GetAgentUser(LoginUserPara para)`
- `Boolean SaveWorkAgentDate(WorkAgentPara para)`
- `Void CancelAgentSendMessage(SessionPara para)`
- `Boolean CancelWorkAgentDate(WorkAgentPara para)`
- `LoginUser GetLoginUser(LoginUserPara para)`
- `LoginUser CheckAutoLoginUser(LoginUserPara para)`
- `List`1 GetUserQuickNavigationList(QuickNavigationPara para)`
- `Boolean UpdateQuickNavigation(QuickNavigationPara para)`
- `Boolean UpdateQuickNavigationSort(QuickNavigationSortPara para)`
- `String AddQuickNavigation(QuickNavigationPara para)`
- `Boolean RemoveQuickNavigation(QuickNavigationPara para)`
- `PersonalSettingData GetUserInfoForPersonalSetting(LoginUserPara para)`
- `Boolean SaveForPersonalSetting(PersonalSettingPara para)`
- `String CheckPassword(PasswordPara para)`
- `Boolean CheckADUser(String userCode, String pwd)`
- `TryLoginUserPara GetLoginInfoByOAuth(TryLoginUserPara para)`
- `LoginCheckPara GetLoginService(SessionPara para)`
- `Boolean SavePassword(PasswordPara para)`
- `String GetAgentID(SessionPara para)`
- `String GetUserName(SessionPara para)`
- `String GetPassword(SessionPara para)`
- `Boolean CanSetAsAgence(PersonalSettingPara para)`
- `TreeRootData GetGroupToGroupRootNode(TreeViewPara para)`
- `List`1 GetGroupToGroupChildNode(TreeViewPara para)`
- `String SetDimissionState(UserPara para)`
- `String SetIncumbentState(UserPara para)`
- `Boolean MoveOrganization(TreeViewPara para)`
- `String MoveToOther(TreeViewPara para)`
- `TreeRootData GetGroupToGroupRootNodeForMoveToOther(TreeViewPara para)`
- `List`1 GetGroupToGroupChildNodeForMoveToOther(TreeViewPara para)`
- `GridObject GetRoleToUserGridData(OnePageGridDataPara para)`
- `Boolean InitQuickNavigation(InitQuickNavigationPara para)`
- `String SaveOrganizationData(ImportDataPara para)`
- `String GetUserListForTreeCommonQuery(SessionPara para)`
- `String GetRoleListForTreeCommonQuery(SessionPara para)`
- `String GetGroupListForTreeCommonQuery(SessionPara para)`
- `String GetGroupRoleListForTreeCommonQuery(SessionPara para)`
- `List`1 GetUserSelectList(UserSelectListQueryPara para)`
- `List`1 GetUserSelectListByGroupID(UserSelectListPara para)`
- `List`1 GetRoleSelectList(SessionPara para)`
- `List`1 GetCompanyGroupSelectList(SessionPara para)`
- `List`1 GetGroupSelectList(SessionPara para)`
- `List`1 GetGroupRoleSelectList(SessionPara para)`
- `AddLinkMessage CompanyAddGroup(CompanyAddGroupPara para)`
- `AddLinkMessage GroupRoleAddUser(GroupRoleAddUserPara para)`
- `List`1 RemoveExistEID(TreeViewPara para)`
- `Boolean RemoveOrganizeLinkCheck(TreeViewPara para)`
- `Boolean RemoveOrganizeLink(UserPara para)`
- `Boolean OrganizeDeleteCheck(UserPara para)`
- `Boolean ComanyGroupUserDeleteCheck(UserPara para)`
- `Boolean PersonDeleteCheck(UserPara para)`
- `Void UserTransferOwnership(TransferPara para)`
- `String ObjectTransferOwnership(TransferPara para)`
- `String TakeBackObjectOwnership(TransferPara para)`
- `List`1 GetTreeQueryData(TreeViewQueryPara para)`
- `List`1 GetRoleTreeQuery(TreeViewQueryPara para)`
- `Boolean SavePersonAndUser(PersonUserDataPara para)`
- `List`1 GetUserDropdownList(UserDropListPara para)`
- `List`1 GetRoleDropdownList(SessionPara para)`
- `List`1 GetGroupDropdownList(SessionPara para)`
- `Boolean RecordOrganizationTreeLog(SessionPara para)`
- `TreeRootData GetQueryUserListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryRoleListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryGroupRoleListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryGroupListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryMoveToOtherGroupListByName(GetQueryOrganizeListByNamePara para)`
- `TreeRootData GetQueryOrganizeListByName(GetQueryOrganizeListByNamePara para)`
- `Int64 GetUserCheckOperateTimeSpan(SessionPara para)`
- `List`1 GetTreeAllData(TreeViewPara para)`
- `GroupInfoDisplayInfo GetGroupInfoCreatePageDisplayInfo(SessionPara para)`
- `GroupInfoDisplayInfo GetGroupInfoEditPageDisplayInfo(SessionPara para)`
- `GroupInfoDisplayInfo GetGroupInfoViewPageDisplayInfo(SessionPara para)`
- `String GetGroupCode(SessionPara para)`
- `Boolean SetGroupSpace(SetGroupSpace para)`
- `Boolean InitGroupSpace(SessionPara para)`
- `Boolean IsSystemOrGroupAdminRecursion(SessionPara para)`
- `List`1 GetAllUserListData(UserSelectListQueryPara para)`

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.AddOrganizeLinkPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.CompanyAddGroupPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.GetQueryOrganizeListByNamePara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.GroupInfoDisplayInfo
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.GroupRoleAddUserPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.SetGroupSpace
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.TransferPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.UserDropListPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.UserSelectListPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Parameter.UserSelectListQueryPara
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataService.Business.OrganizationMove
- ` OrganizationMoveToOther(<unresolved>)`
- ` MoveOrganization(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataService.Business.OrganizationNode
- ` GetGroupToRoleToUserChildData(<unresolved>)`
- ` GroupToUserChildData(<unresolved>)`
- ` GetGroupToGroupRootData(<unresolved>)`
- ` GetGroupToGroupChildData(<unresolved>)`
- ` GetRootNode(<unresolved>)`
- `Void SelectFirstRootNode(List`1 treeNodes)`

### [class] Hoteam.InforCenter.Organization.DataService.Business.OrganizationTreeQuery
- `List`1 QueryTreeNode()`

### [class] Hoteam.InforCenter.Organization.DataService.Business.TransferOwnership
- `Void TransferAllObjectType(TransferPara para)`
- ` TransferObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataService.Business.OrganizationUsingCheck
- `Boolean UserUsingCheck(SessionPara para, String objectID)`
- `Boolean GroupUsingCheck(SessionPara para, String objectID)`
- `Boolean CompanyUsingCheck(SessionPara para, String objectID)`

### [class] Hoteam.InforCenter.Organization.DataService.Business.WorkAgentBusiness
- ` SaveWorkAgentDate(<unresolved>)`
- ` CancelWorkAgentDate(<unresolved>)`
- ` GetAgentList(<unresolved>)`
- ` CancelAgentSendMessage(<unresolved>)`
- ` RecordLog(<unresolved>)`

## Hoteam.InforCenter.Rule.PageService.dll

### [class] Hoteam.InforCenter.Rule.PageService.ActionRuleTree
- `TreeChildData GetTreeChildData(TreeViewPara para)`

### [interface] Hoteam.InforCenter.Rule.PageService.Service.IRulePageService
- `Void GenerateSerialNumber(GenerateSerialNumberPara para)`
- `Boolean MoveActionRule(MoveUpAndDownPara para)`
- `EditGridTitleData GetActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRulePermissionData(EditGridDataPara para)`
- `TreeChildData GetActionRuleChildNode(TreeViewPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetCreateActionRulePermissionData(EditGridDataPara para)`
- `ActionRulePermissionTypePlugin GetActionRulePermissionTypePlugin(ActionRulePermissionPara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`
- `GridTitleData GetActionRuleBusinessModelTitle(GridRowTitlePara para)`
- `GridObject GetActionRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridTitleData GetActionRuleMessageTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRuleMessageData(EditGridDataPara para)`
- `Boolean GetPermissionEnable(PermissionEnablePara para)`
- `Boolean SavePermissionEnable(PermissionEnablePara para)`
- `EditGridTitleAndData GetGridDataByPatchObjectPermission(PatchPermissionPara para)`
- `String GetPatchPermissionExistData(PatchPermissionPara para)`
- `PatchPermissionChildObjPageData GetChildObjectData(PatchPermissionPara para)`
- `EditGridTitleAndData GetPermissionByUser(SearchPermissionPara para)`
- `EditGridTitleAndData GetPermissionGrid(SearchPermissionPara para)`
- `List`1 GetGroupInfoByUser(SearchPermissionPara para)`
- `List`1 GetStateConditionObjectList(SessionPara para)`
- `List`1 GetStageStateConditionObjectList(GetStageStateConditionObjectListPara para)`
- `Boolean SaveEditGrid(SaveEditGridPara para)`

### [class] Hoteam.InforCenter.Rule.PageService.Service.RulePageService
- `Void GenerateSerialNumber(GenerateSerialNumberPara para)`
- `Boolean MoveActionRule(MoveUpAndDownPara para)`
- `EditGridTitleData GetActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRulePermissionData(EditGridDataPara para)`
- `TreeChildData GetActionRuleChildNode(TreeViewPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetCreateActionRulePermissionData(EditGridDataPara para)`
- `ActionRulePermissionTypePlugin GetActionRulePermissionTypePlugin(ActionRulePermissionPara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`
- `GridTitleData GetActionRuleBusinessModelTitle(GridRowTitlePara para)`
- `GridObject GetActionRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridTitleData GetActionRuleMessageTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRuleMessageData(EditGridDataPara para)`
- `Boolean GetPermissionEnable(PermissionEnablePara para)`
- `Boolean SavePermissionEnable(PermissionEnablePara para)`
- `EditGridTitleAndData GetGridDataByPatchObjectPermission(PatchPermissionPara para)`
- `String GetPatchPermissionExistData(PatchPermissionPara para)`
- `PatchPermissionChildObjPageData GetChildObjectData(PatchPermissionPara para)`
- `EditGridTitleAndData GetPermissionByUser(SearchPermissionPara para)`
- `EditGridTitleAndData GetPermissionGrid(SearchPermissionPara para)`
- `List`1 GetGroupInfoByUser(SearchPermissionPara para)`
- `List`1 GetStateConditionObjectList(SessionPara para)`
- `List`1 GetStageStateConditionObjectList(GetStageStateConditionObjectListPara para)`
- `Boolean SaveEditGrid(SaveEditGridPara para)`

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.EditGridTitleAndData
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.GetStageStateConditionObjectListPara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.PatchPermissionChildObjPageData
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.PatchPermissionPara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.PermissionEnablePara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.SaveCreatePermissionEditGridPara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Parameter.SearchPermissionPara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Grid.ActionRuleConditionEditGrid
- ` AddObject(<unresolved>)`
- ` EditObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`
- ` InsertConditionLog(<unresolved>)`

### [class] Hoteam.InforCenter.Rule.PageService.Grid.ActionRulePermissionEditGrid
- `EditGridTitleData GetActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRulePermissionData(EditGridDataPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetCreateActionRulePermissionData(EditGridDataPara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`
- `GridTitleData GetActionRuleBusinessModelTitle(GridRowTitlePara para)`
- `GridObject GetActionRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridTitleData GetActionRuleMessageTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRuleMessageData(EditGridDataPara para)`

### [class] Hoteam.InforCenter.Rule.PageService.Grid.PatchPermissionGrid
- (no public methods)

### [class] Hoteam.InforCenter.Rule.PageService.Grid.SearchPermissionGrid
- `EditGridRowTitleObject GetUserGridTitle(SessionPara para, String selectid)`
- ` GetUserGridData(<unresolved>)`
- `EditGridRowTitleObject GetPermissionGridTitle(SessionPara para, String selectid)`
- ` GetPermissionGridData(<unresolved>)`
- ` GetEnableActionPermission(<unresolved>)`
- ` GetEnableActionPermission(<unresolved>)`

## Hoteam.InforCenter.Rule.RuleService.dll

### [interface] Hoteam.InforCenter.Rule.RuleService.Service.IRuleDataService
- `List`1 GetActionRuleConditionTypeList(ConditionTypePara para)`
- `List`1 GetObjectTypeList(ObjectTypeListPara para)`
- `List`1 GetLinkTypeRelationList(ObjectTypeListPara para)`
- `List`1 GetObjectStateList(SessionPara para)`
- `String GetActionRuleConditionValueText(ActionRuleConditionValuePara para)`
- `List`1 GetPermissionTypeList(ActionRulePermissionPara para)`
- `String GetPermissionActorValueText(PermissionActorValuePara para)`
- `List`1 GetPermissionUserList(SessionPara para)`
- `List`1 GetActionListData(ActionRulePermissionPara para)`
- `String GetPermissionActionValueText(PermissionActionValuePara para)`
- `EditGridTitleAndDataObject GetObjectPermissionGridData(ObjectPermissionListPara para)`
- `Boolean SaveObjectPermissionData(ObjectPermissionListPara para)`
- `String GetMessageActionValueText(MessageActionValuePara para)`
- `EditGridTitleAndDataObject GetObjectMessageGridData(ObjectMessageListPara para)`
- `Boolean SaveObjectMessageData(ObjectMessageListPara para)`
- `Boolean CheckObjectPermissionActorExist(ObjectPermissionListPara para)`
- `Dictionary`2 CheckNonPermission(ObjectPermissionListPara para)`
- `Boolean IsEnableObjectPermission(SessionPara para)`

### [class] Hoteam.InforCenter.Rule.RuleService.Service.RuleDataService
- `List`1 GetActionRuleConditionTypeList(ConditionTypePara para)`
- `List`1 GetObjectTypeList(ObjectTypeListPara para)`
- `List`1 GetLinkTypeRelationList(ObjectTypeListPara para)`
- `List`1 GetObjectStateList(SessionPara para)`
- `String GetActionRuleConditionValueText(ActionRuleConditionValuePara para)`
- `List`1 GetPermissionTypeList(ActionRulePermissionPara para)`
- `List`1 GetPermissionUserList(SessionPara para)`
- `List`1 GetActionListData(ActionRulePermissionPara para)`
- `String GetPermissionActorValueText(PermissionActorValuePara para)`
- `String GetPermissionActionValueText(PermissionActionValuePara para)`
- `EditGridTitleAndDataObject GetObjectPermissionGridData(ObjectPermissionListPara para)`
- `Boolean SaveObjectPermissionData(ObjectPermissionListPara para)`
- `Boolean CheckObjectPermissionActorExist(ObjectPermissionListPara para)`
- `String GetMessageActionValueText(MessageActionValuePara para)`
- `EditGridTitleAndDataObject GetObjectMessageGridData(ObjectMessageListPara para)`
- `Boolean SaveObjectMessageData(ObjectMessageListPara para)`
- `Dictionary`2 CheckNonPermission(ObjectPermissionListPara para)`
- `Boolean IsEnableObjectPermission(SessionPara para)`

### [class] Hoteam.InforCenter.Rule.RuleService.Service.EditGridTitleAndDataObject
- (no public methods)

## Hoteam.InforCenter.Workflow.FlowService.dll

### [interface] Hoteam.InforCenter.Workflow.FlowService.IWorkflowService
- `TemplateLsit GetFitWorkflowTemplate(GetTemplatePara para)`
- `Boolean MoveWerkflowClassify(MoveWorkflowTemplate para)`
- `DefaultTemplateInfo GetFlowTemplateInfo(GetFlowTemplateInfoPara para)`
- `List`1 GetAllWorkflowTemplate(SessionPara para)`
- `List`1 GetAllWorkflowTemplateEUID(SessionPara para)`
- `WorkflowResultModel StartWorkflow(StartWorkflowPara para)`
- `List`1 GetFlowPagePluginInfo(GetFlowPagePara para)`
- `AuditFlowTaskResult AuditFlowTask(AuditFlowTaskPara para)`
- `Void UpdataWorkflowAdmin(UpdataWorkflowAdminPara para)`
- `Void UpdataTaskAgentUser(TaskAgentUserPara para)`
- `Void StopWorkflow(WorkflowOperationPara para)`
- `Void DeleteWorkflow(WorkflowOperationPara para)`
- `Void SuspendWorkflow(WorkflowOperationPara para)`
- `Void ResumeWorkflow(WorkflowOperationPara para)`
- `FlowTaskInfo GetFlowTaskInfo(AuditFlowTaskPara para)`
- `WorkFlowActorData GetFlowActorEditData(WorkFlowActorPara para)`
- `Void UpdataWorkflowActor(UpdataWorkflowActorPara para)`
- `String GetActorDisplayText(GetActorDisplayTextByActor para)`
- `GridObject GetWorkflowStatistics(StatisticsPara para)`
- `GridObject GetWorkflowTaskStatistics(SessionPara para)`
- `GridObject GetWorkflowSmartStatistics(SessionPara para)`
- `EditGridObject GetWorkflowStartObjectData(StartWorkflowPara para)`
- `GridObject GetWorkflowObjectData(WorkflowObjectData para)`
- `GridTitleData GetWorkflowObjectTitle(WorkflowObjectData para)`
- `WorkflowTemplate GetFlowTemplateView(FlowTemplateViewPara para)`
- `String GetFlowIDByTaskID(WorkflowTaskPara para)`
- `Void RollbackTask(RollbackTaskPara para)`
- `TreeRootData GetChangeTaskActorRootNode(TreeViewPara para)`
- `List`1 GetChangeTaskActorAllNode(TreeViewPara para)`
- `List`1 GetChangeTaskActorChildNode(TreeViewPara para)`
- `GridObject GetChangeTaskActorListData(OnePageGridDataPara para)`
- `GridTitleData GetChangeTaskActorTitleData(GridRowTitlePara para)`
- `List`1 GetChangeTaskActorQueryData(TreeViewQueryPara para)`
- `List`1 GetChangeTaskActorChildNodes(TreeViewPara para)`
- `String GetTaskActorNodes(SearchTaskActorPara para)`
- `Void ExecuteFlowTaskForTimer(AuditFlowTaskPara para)`
- `List`1 GetMyWorkFlowTreeAllData(TreeViewPara para)`
- `List`1 GetPagePluginList(PagePluginPara para)`
- `Boolean ValidataActors(ValidateActorPara para)`
- `List`1 GetTreeQueryTempalteData(TreeViewQueryPara para)`
- `TreeRootData GetMyWorkFlowTreeAllDataWithStatistics(TreeViewPara para)`
- `String GetMyWorkFlowTreeCountData(TreeViewPara para)`
- `Void UpdataWorkflowActorByActorDic(UpdataWorkflowActorByActorDicPara para)`
- `TemplateLsitModel GetTempListForClassify(GetWorkFlowAndClassifyPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowId(WorkFlowAuditPara para)`
- `String GetObjIDForWorkflowId(WorkFlowAuditPara para)`
- `WorkflowResultModel GetChildDataToDestNode(FolwCheckInfoPara para)`
- `WorkflowResultModel GetGridObjectForIds(FolwCheckInfoPara para)`
- `String GetWorkflowTemplateExtendProperty(GetFlowPagePara para)`
- `EditGridObject GetWorkflowInform(WorkFlowActorPara para)`
- `String SaveTaskActor(WorkFlowActorPara para)`
- `TemplateLsitModel GetTempAndClassifyListModel(GetWorkFlowAndClassifyPara para)`
- `String SendBackFlowTask(StartWorkflowPara para)`
- `Boolean IsAssistAudit(SessionPara para)`
- `GridObject GetAssistAuditGrid(SessionPara para)`
- `Boolean SetAssistAudit(SessionPara para)`
- `TreeChildData WorkflowClassifyToTemplateChildData(TreeViewPara para)`
- `Boolean CheckCurSelectUserInRunTaskAuditor(WorkFlowActorPara para)`
- `String GetFlowTaskTemplateNameByID(WorkFlowActorPara para)`
- `List`1 GetActorQueryData(TreeViewQueryPara para)`
- `TreeChildData GetMyWorkFlowTaskTreeData(TreeViewPara para)`
- `List`1 GetAllWorkflowTemplateWithoutVersion(SessionPara para)`
- `List`1 GetWorkflowTemplateVersion(SessionPara para)`
- `String GetWorkflowTemplatesByTemplateNameAndVersion(SessionPara para)`
- `String UpdateFlowName(SessionPara para)`

### [class] Hoteam.InforCenter.Workflow.FlowService.WorkflowService
- `TemplateLsit GetFitWorkflowTemplate(GetTemplatePara para)`
- `DefaultTemplateInfo GetFlowTemplateInfo(GetFlowTemplateInfoPara para)`
- `List`1 GetAllWorkflowTemplate(SessionPara para)`
- `List`1 GetAllWorkflowTemplateEUID(SessionPara para)`
- `List`1 GetAllWorkflowTemplateWithoutVersion(SessionPara para)`
- `List`1 GetWorkflowTemplateVersion(SessionPara para)`
- `String GetWorkflowTemplatesByTemplateNameAndVersion(SessionPara para)`
- `List`1 GetFlowPagePluginInfo(GetFlowPagePara para)`
- `WorkflowResultModel StartWorkflow(StartWorkflowPara para)`
- `AuditFlowTaskResult AuditFlowTask(AuditFlowTaskPara para)`
- `String SendBackFlowTask(StartWorkflowPara para)`
- `FlowTaskInfo GetFlowTaskInfo(AuditFlowTaskPara para)`
- `Void UpdataWorkflowAdmin(UpdataWorkflowAdminPara para)`
- `Void UpdataWorkflowActor(UpdataWorkflowActorPara para)`
- `Void UpdataWorkflowActorByActorDic(UpdataWorkflowActorByActorDicPara para)`
- `Void UpdataTaskAgentUser(TaskAgentUserPara para)`
- `Void StopWorkflow(WorkflowOperationPara para)`
- `Void DeleteWorkflow(WorkflowOperationPara para)`
- `Void SuspendWorkflow(WorkflowOperationPara para)`
- `Void ResumeWorkflow(WorkflowOperationPara para)`
- `WorkFlowActorData GetFlowActorEditData(WorkFlowActorPara para)`
- `String GetActorDisplayText(GetActorDisplayTextByActor para)`
- `GridObject GetWorkflowStatistics(StatisticsPara para)`
- `GridObject GetWorkflowTaskStatistics(SessionPara para)`
- `GridObject GetWorkflowSmartStatistics(SessionPara para)`
- `EditGridObject GetWorkflowStartObjectData(StartWorkflowPara para)`
- `GridObject GetWorkflowObjectData(WorkflowObjectData para)`
- `GridTitleData GetWorkflowObjectTitle(WorkflowObjectData para)`
- `WorkflowTemplate GetFlowTemplateView(FlowTemplateViewPara para)`
- `String GetFlowIDByTaskID(WorkflowTaskPara para)`
- `Void RollbackTask(RollbackTaskPara para)`
- `List`1 GetChangeTaskActorChildNode(TreeViewPara para)`
- `List`1 GetChangeTaskActorChildNodes(TreeViewPara para)`
- `TreeRootData GetChangeTaskActorRootNode(TreeViewPara para)`
- `List`1 GetChangeTaskActorAllNode(TreeViewPara para)`
- `GridObject GetChangeTaskActorListData(OnePageGridDataPara para)`
- `GridTitleData GetChangeTaskActorTitleData(GridRowTitlePara para)`
- `String GetTaskActorNodes(SearchTaskActorPara para)`
- `Boolean MoveWerkflowClassify(MoveWorkflowTemplate para)`
- `Void ExecuteFlowTaskForTimer(AuditFlowTaskPara para)`
- `List`1 GetMyWorkFlowTreeAllData(TreeViewPara para)`
- `TreeRootData GetMyWorkFlowTreeAllDataWithStatistics(TreeViewPara para)`
- `List`1 GetPagePluginList(PagePluginPara para)`
- `Boolean ValidataActors(ValidateActorPara para)`
- `String GetMyWorkFlowTreeCountData(TreeViewPara para)`
- `List`1 GetChangeTaskActorQueryData(TreeViewQueryPara para)`
- `TemplateLsitModel GetTempListForClassify(GetWorkFlowAndClassifyPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowId(WorkFlowAuditPara para)`
- `String GetObjIDForWorkflowId(WorkFlowAuditPara para)`
- `WorkflowResultModel GetChildDataToDestNode(FolwCheckInfoPara para)`
- `WorkflowResultModel GetGridObjectForIds(FolwCheckInfoPara para)`
- `String GetWorkflowTemplateExtendProperty(GetFlowPagePara para)`
- `EditGridObject GetWorkflowInform(WorkFlowActorPara para)`
- `String SaveTaskActor(WorkFlowActorPara para)`
- `TemplateLsitModel GetTempAndClassifyListModel(GetWorkFlowAndClassifyPara para)`
- `Boolean IsAssistAudit(SessionPara para)`
- `GridObject GetAssistAuditGrid(SessionPara para)`
- `Boolean SetAssistAudit(SessionPara para)`
- `TreeChildData WorkflowClassifyToTemplateChildData(TreeViewPara para)`
- `Boolean CheckCurSelectUserInRunTaskAuditor(WorkFlowActorPara para)`
- `String GetFlowTaskTemplateNameByID(WorkFlowActorPara para)`
- `List`1 GetActorQueryData(TreeViewQueryPara para)`
- `TreeChildData GetMyWorkFlowTaskTreeData(TreeViewPara para)`
- `String UpdateFlowName(SessionPara para)`

### [class] Hoteam.InforCenter.Workflow.FlowService.Statistics.WorkFlowStatistics
- ` GetMyWorkFlowSmartStatistics(<unresolved>)`
- `GridObject GetWorkflowStatisticsGridObject(StatisticsPara para)`
- ` GetWorkflowStatisticsDataTable(<unresolved>)`
- ` GetResponsibleWorkflowStatisticsDataTable(<unresolved>)`
- ` GetStartWorkflowStatisticsDataTable(<unresolved>)`
- `GridObject GetWorkflowTaskStatisticsGridObject(SessionPara para, Boolean smartPagaData)`
- ` GetWorkflowTaskStatisticsDataTable(<unresolved>)`

### [class] Hoteam.InforCenter.Workflow.FlowService.FlowEngine.FlowUtilty
- `TemplateLsit GetFitWorkflowTemplate(GetTemplatePara para)`
- `TemplateLsit GetFitWorkflowTemplate(GetTemplatePara para, String stateColName)`
- `List`1 GetAllWorkflowTemplateEUID(SessionPara para)`
- `List`1 GetAllWorkflowTemplateWithoutVersion(SessionPara para)`
- `List`1 GetWorkflowTemplateVersion(SessionPara para)`
- `String GetWorkflowTemplatesByTemplateNameAndVersion(SessionPara para)`
- `List`1 GetAllWorkflowTemplate(SessionPara para)`
- `DefaultTemplateInfo GetFlowTemplateInfo(SessionPara para, String template)`
- ` GetFlowTaskInfo(<unresolved>)`
- ` StartWorkflow(<unresolved>)`
- ` CheckAuditActors(<unresolved>)`
- ` AuditFlowTask(<unresolved>)`
- ` SendBackFlowTask(<unresolved>)`
- ` SavePagePluginData(<unresolved>)`
- ` RollbackTask(<unresolved>)`
- ` MarkRollbackTask(<unresolved>)`
- ` UnMarkRollbackTask(<unresolved>)`
- ` UpdataWorkflowAdmin(<unresolved>)`
- ` UpdataTaskAgentUser(<unresolved>)`
- ` StopWorkflow(<unresolved>)`
- ` DeleteWorkflow(<unresolved>)`
- ` SuspendWorkflow(<unresolved>)`
- ` ResumeWorkflow(<unresolved>)`
- `List`1 GetFlowPagePluginInfo(SessionPara para, String template, String nodeID)`
- ` GetFlowActorEditData(<unresolved>)`
- ` GetTaskActorByTemplateID(<unresolved>)`
- ` UpdataWorkflowActor(<unresolved>)`
- ` GetTempListForClassify(<unresolved>)`
- ` IsAssistAudit(<unresolved>)`
- ` GetAssistAuditGrid(<unresolved>)`
- ` SetAssistAudit(<unresolved>)`

### [class] Hoteam.InforCenter.Workflow.FlowService.FlowEngine.WorkFlowActorTreeNodeUtilty
- ` GetWorkFlowActorTreeNode(<unresolved>)`
- ` GetWorkFlowActorTextAndValue(<unresolved>)`
- ` GetWorkFlowActorText(<unresolved>)`
- ` GetActorQueryData(<unresolved>)`
- ` GetActorRootTreeNode(<unresolved>)`
- ` GetActorChildTreeNode(<unresolved>)`
- ` GetChangeTaskActorChildTreeNodes(<unresolved>)`
- ` GetChangeTaskActorListData(<unresolved>)`
- ` GetGridDataByViewName(<unresolved>)`
- ` GetTaskActorNodes(<unresolved>)`

### [class] Hoteam.InforCenter.Workflow.FlowService.FlowTask.FlowTaskTimer
- `Void ExecuteFlowTaskForTimer(AuditFlowTaskPara para)`
- `List`1 TranslateActor(WorkflowAuditNode node, WorkflowInstance instance, BaseNodeEngine baseNodeEngine)`

### [class] Hoteam.InforCenter.Workflow.FlowService.FlowAttach.FlowAttachObject
- `GridTitleData GetWorkflowObjectTitle(WorkflowObjectData para)`
- `GridObject GetWorkflowObjectData(WorkflowObjectData para)`

### [class] Hoteam.InforCenter.Workflow.FlowService.Business.FlowBusiness
- `TemplateLsitModel GetTempAndClassifyListModel(GetWorkFlowAndClassifyPara para)`
- ` GetGridObjectListForWorkflowId(<unresolved>)`
- ` GetObjIDForWorkflowId(<unresolved>)`
- ` GetChildDataToDestNode(<unresolved>)`
- ` CheckObjectInFlow(<unresolved>)`
- ` GetGridObjectForIds(<unresolved>)`
- `String GetWorkflowTemplateExtendProperty(GetFlowPagePara para)`
- ` GetWorkflowInform(<unresolved>)`
- ` SaveTaskActor(<unresolved>)`
- ` WorkflowClassifyToTemplateChildData(<unresolved>)`
- ` CheckCurSelectUserInRunTaskAuditor(<unresolved>)`
- ` GetFlowTaskTemplateNameByID(<unresolved>)`

### [class] Hoteam.InforCenter.Workflow.FlowService.Business.MyWorkFlowTreeViewExecutor
- ` GetAllTreeNodeData(<unresolved>)`

### [class] Hoteam.InforCenter.Workflow.FlowService.Business.TaskActorSetting
- (no public methods)

## Hoteam.InforCenter.CompanyRule.Service.dll

### [class] Hoteam.InforCenter.CompanyRule.Service.CompanyRuleService
- `Boolean MoveActionRule(MoveUpAndDownPara para)`
- `EditGridTitleData GetCompanyRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetCompanyRulePermissionData(EditGridDataPara para)`
- `TreeChildData GetCompanyRuleChildNode(TreeViewPara para)`
- `GridObject GetCompanyRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridObject GetCreateCompanyRulePermissionData(EditGridDataPara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `GridTitleData GetCompanyManagementListTitle(GridRowTitlePara para)`
- `GridObject GetCompanyManagementListData(OnePageGridDataPara para)`
- `Boolean SetSystemPassword(SetSystemPasswordPara para)`

### [interface] Hoteam.InforCenter.CompanyRule.Service.ICompanyRuleService
- `Boolean MoveActionRule(MoveUpAndDownPara para)`
- `EditGridTitleData GetCompanyRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetCompanyRulePermissionData(EditGridDataPara para)`
- `TreeChildData GetCompanyRuleChildNode(TreeViewPara para)`
- `GridObject GetCompanyRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridObject GetCreateCompanyRulePermissionData(EditGridDataPara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `GridTitleData GetCompanyManagementListTitle(GridRowTitlePara para)`
- `GridObject GetCompanyManagementListData(OnePageGridDataPara para)`
- `Boolean SetSystemPassword(SetSystemPasswordPara para)`

### [class] Hoteam.InforCenter.CompanyRule.Service.Tree.CompanyRuleTree
- `TreeChildData GetTreeChildData(TreeViewPara para)`

### [class] Hoteam.InforCenter.CompanyRule.Service.Parameter.SaveCreatePermissionEditGridPara
- (no public methods)

### [class] Hoteam.InforCenter.CompanyRule.Service.Parameter.SetSystemPasswordPara
- (no public methods)

### [class] Hoteam.InforCenter.CompanyRule.Service.Grid.PermissionGrid
- `EditGridTitleData GetActionRulePermissionTitle(GridRowTitlePara para)`
- `EditGridObject GetActionRulePermissionData(EditGridDataPara para)`
- `GridObject GetCompanyRuleBusinessModelData(OnePageGridDataPara para)`
- `EditGridObject GetCreateCompanyRulePermissionData(EditGridDataPara para)`
- `EditGridTitleData GetCreateActionRulePermissionTitle(GridRowTitlePara para)`
- `Boolean SaveCreatePermissionEditGrid(SaveCreatePermissionEditGridPara para)`

## Hoteam.InforCenter.ConfigurableDevelop.Service.dll

### [class] Hoteam.InforCenter.ConfigurableDevelop.Service.ConfigurableDevelopService
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `String CreateNewModel(UserModelDataPara para)`
- `String NewModelData(SaveObjectDataPara para)`
- `EditGridTitleData GetInheritInfoTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetAboutObjectTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGridData(OnePageGridDataPara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `EditGridObject GetAboutObjectGridData(OnePageGridDataPara para)`
- `String SaveModelData(ModelSavePara para)`
- `EditGridTitleData GetListPageTitleData(GridRowTitlePara para)`
- `EditGridObject GetListPageGridData(ViewDataPara para)`
- `String CreateConfigurableDevelopView(ViewDataPara para)`
- `EditGridTitleData GetInfoTypePageInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetInfoTypePageInfoData(OnePageGridDataPara para)`
- `EditGridObject GetRelevancePageFieldInfoData(OnePageGridDataPara para)`
- `String SaveInfyTypeData(InfoTypePagePara para)`
- `EditGridObject GetFieldGridData(ViewDataPara para)`
- `AllConfigDevelopList GetAllConfigDevelopList(NavigationDataPara para)`
- `Boolean BulkUpdateData(BulkEditPara para)`
- `EditGridTitleData GetMenuManagementTitleData(GridRowTitlePara para)`
- `EditGridObject GetMenuManagementGridData(OnePageGridDataPara para)`
- `EditGridObject GetMenuActionLibraryGridData(ViewDataPara para)`
- `Int32 SaveNavigationSettings(SaveNavigationPara para)`
- `Boolean CreateObjectTypeRightMenu(ViewDataPara para)`
- `Dictionary`2 GetEqualColumnValue(BulkEditPara para)`
- `EditGridTitleData GetFieldsTitleData(GridRowTitlePara para)`
- `EditGridObject GetFieldsGridData(OnePageGridDataPara para)`
- `EditGridObject GetModelInfoData(OnePageGridDataPara para)`
- `List`1 GetDataTypeDropDownDataList(SessionPara para)`
- `EditGridTitleData GetInheritInfoGrdiTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGrdiRowsData(UserModelGridPara para)`
- `EditGridRowsObject GetAddRowsGridData(UserModelGridPara para)`
- `String CopyAddInfoType(InfoTypePagePara para)`
- `EditGridTitleData GetFileSelectTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetMenuSelectGridTitleData(GridRowTitlePara para)`
- `GridObject GetModelInfoType(UserModelGridPara para)`
- `String AddShowInfoTypeToUserInfoPage(InfoTypePagePara para)`
- `List`1 GetTreeDataByClassifyName(TreeViewPara para)`
- `String SaveClassifyFields(ClassifyManagementPara para)`
- `List`1 GetObjectInfoTypeList(InfoTypePagePara para)`
- `Dictionary`2 CreateLinkageFieldValue(LinkageFieldPara para)`
- `List`1 GetAllRelevanceFields(RelevancePageInfoPara para)`
- `String AboutObjectName(RelevancePageInfoPara para)`
- `String AboutObjectEID(RelevancePageInfoPara para)`
- `String AddShowInfoTypeToRelevancePageInfo(InfoTypePagePara para)`
- `TreeChildData GetModelTreeChildData(TreeViewPara para)`
- `String AboutFieldIsCreateLink(LinkageFieldPara para)`
- `String DeleteLinkByName(LinkageFieldPara para)`
- `GridObject GetLinkModelInfoType(UserModelGridPara para)`
- `GridTitleData GetModelGridTitle(GridRowTitlePara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `String EditModelDataMultiLanguage(UserModelDataPara para)`
- `Boolean RemoveModelData(UserModelDataPara para)`
- `String GetMenuTitleByMenuName(MenuDataPara para)`
- `Dictionary`2 GetObjectTypeList(ObjectTypePara para)`
- `Boolean CheckSQLRegex(UserModelDataPara para)`
- `String GetGuid(SessionPara para)`

### [interface] Hoteam.InforCenter.ConfigurableDevelop.Service.IConfigurableDevelopService
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `String NewModelData(SaveObjectDataPara para)`
- `EditGridTitleData GetInheritInfoTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGridData(OnePageGridDataPara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `String SaveModelData(ModelSavePara para)`
- `EditGridTitleData GetListPageTitleData(GridRowTitlePara para)`
- `EditGridObject GetListPageGridData(ViewDataPara para)`
- `String CreateConfigurableDevelopView(ViewDataPara para)`
- `EditGridTitleData GetInfoTypePageInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetInfoTypePageInfoData(OnePageGridDataPara para)`
- `String SaveInfyTypeData(InfoTypePagePara para)`
- `EditGridObject GetFieldGridData(ViewDataPara para)`
- `AllConfigDevelopList GetAllConfigDevelopList(NavigationDataPara para)`
- `Dictionary`2 GetEqualColumnValue(BulkEditPara para)`
- `Boolean BulkUpdateData(BulkEditPara para)`
- `EditGridTitleData GetMenuManagementTitleData(GridRowTitlePara para)`
- `EditGridObject GetMenuManagementGridData(OnePageGridDataPara para)`
- `EditGridObject GetMenuActionLibraryGridData(ViewDataPara para)`
- `Boolean CreateObjectTypeRightMenu(ViewDataPara para)`
- `Int32 SaveNavigationSettings(SaveNavigationPara para)`
- `EditGridTitleData GetFieldsTitleData(GridRowTitlePara para)`
- `EditGridObject GetFieldsGridData(OnePageGridDataPara para)`
- `EditGridObject GetModelInfoData(OnePageGridDataPara para)`
- `List`1 GetDataTypeDropDownDataList(SessionPara para)`
- `EditGridTitleData GetInheritInfoGrdiTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGrdiRowsData(UserModelGridPara para)`
- `EditGridRowsObject GetAddRowsGridData(UserModelGridPara para)`
- `String CopyAddInfoType(InfoTypePagePara para)`
- `EditGridTitleData GetFileSelectTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetMenuSelectGridTitleData(GridRowTitlePara para)`
- `GridObject GetModelInfoType(UserModelGridPara para)`
- `String AddShowInfoTypeToUserInfoPage(InfoTypePagePara para)`
- `List`1 GetTreeDataByClassifyName(TreeViewPara para)`
- `String SaveClassifyFields(ClassifyManagementPara para)`
- `List`1 GetObjectInfoTypeList(InfoTypePagePara para)`
- `EditGridTitleData GetAboutObjectTitleData(GridRowTitlePara para)`
- `EditGridObject GetAboutObjectGridData(OnePageGridDataPara para)`
- `Dictionary`2 CreateLinkageFieldValue(LinkageFieldPara para)`
- `List`1 GetAllRelevanceFields(RelevancePageInfoPara para)`
- `String AboutObjectName(RelevancePageInfoPara para)`
- `String AboutObjectEID(RelevancePageInfoPara para)`
- `EditGridObject GetRelevancePageFieldInfoData(OnePageGridDataPara para)`
- `String AddShowInfoTypeToRelevancePageInfo(InfoTypePagePara para)`
- `TreeChildData GetModelTreeChildData(TreeViewPara para)`
- `String AboutFieldIsCreateLink(LinkageFieldPara para)`
- `String DeleteLinkByName(LinkageFieldPara para)`
- `GridObject GetLinkModelInfoType(UserModelGridPara para)`
- `GridTitleData GetModelGridTitle(GridRowTitlePara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `String EditModelDataMultiLanguage(UserModelDataPara para)`
- `String CreateNewModel(UserModelDataPara para)`
- `Boolean RemoveModelData(UserModelDataPara para)`
- `String GetMenuTitleByMenuName(MenuDataPara para)`
- `Dictionary`2 GetObjectTypeList(ObjectTypePara para)`
- `Boolean CheckSQLRegex(UserModelDataPara para)`
- `String GetGuid(SessionPara para)`

## Hoteam.InforCenter.CustomForm.Service.dll

### [class] Hoteam.InforCenter.CustomForm.Service.CustomFormService
- `String GetCustomFormData(SessionPara para)`
- `String ClassifyMoveUp(ModelGeneratorPara para)`
- `String ClassifyMoveDown(ModelGeneratorPara para)`
- `String ModelMoveUp(ModelGeneratorPara para)`
- `String ModelMoveDown(ModelGeneratorPara para)`
- `GridTitleData GetModelLinkGridTitle(GridRowTitlePara para)`
- `TreeRootData GetCustormFormTreeNode(SessionPara para)`
- `TreeChildData GetCustormFormTreeChildNode(TreeViewPara para)`
- `List`1 GetCustomFormTreeQueryData(TreeViewPara para)`
- `Boolean AddFormTypeToFormClassify(ModelSavePara para)`
- `Boolean RemoveFormTypeOnFormClassify(ModelSavePara para)`
- `GridObject GetCustomFormGridData(OnePageGridDataPara para)`
- `ExcelExportData ExportFromFormData(ModelSavePara para)`
- `Boolean CheckObjectStateColumnExist(ModelSavePara para)`

### [interface] Hoteam.InforCenter.CustomForm.Service.ICustomFormService
- `String GetCustomFormData(SessionPara para)`
- `GridTitleData GetModelLinkGridTitle(GridRowTitlePara para)`
- `TreeRootData GetCustormFormTreeNode(SessionPara para)`
- `TreeChildData GetCustormFormTreeChildNode(TreeViewPara para)`
- `List`1 GetCustomFormTreeQueryData(TreeViewPara para)`
- `Boolean AddFormTypeToFormClassify(ModelSavePara para)`
- `Boolean RemoveFormTypeOnFormClassify(ModelSavePara para)`
- `GridObject GetCustomFormGridData(OnePageGridDataPara para)`
- `String ClassifyMoveUp(ModelGeneratorPara para)`
- `String ClassifyMoveDown(ModelGeneratorPara para)`
- `String ModelMoveDown(ModelGeneratorPara para)`
- `String ModelMoveUp(ModelGeneratorPara para)`
- `ExcelExportData ExportFromFormData(ModelSavePara para)`
- `Boolean CheckObjectStateColumnExist(ModelSavePara para)`

## Hoteam.InforCenter.DashboardManagement.Service.dll

### [class] Hoteam.InforCenter.DashboardManagement.Service.DashboardManagementService
- `List`1 GetDashboardWidgetDropDownList(SessionPara para)`
- `Boolean SaveDashboardWidget(SessionPara para)`
- `String GetRelationDashboardWidget(SessionPara para)`
- `List`1 GetAllDashboardTool(SessionPara para)`
- `List`1 GetAllDashboardWidgth(SessionPara para)`
- `DashBoardLoyoutData GetDashboardLayoutList(DashboardPara para)`
- `Boolean SaveDashboardLayoutList(DashboardPara para)`
- `DashboardLayoutTemplate GetDashboardLayoutTemplateByName(DashboardPara para)`
- `List`1 GetDashboardLayoutTemplateNames(DashboardPara para)`
- `Boolean SaveDashboardLayoutTemplate(DashboardPara para)`
- `Boolean DeleteDashboardLayoutTemplateByName(DashboardPara para)`

### [interface] Hoteam.InforCenter.DashboardManagement.Service.IDashboardManagementService
- `List`1 GetDashboardWidgetDropDownList(SessionPara para)`
- `Boolean SaveDashboardWidget(SessionPara para)`
- `String GetRelationDashboardWidget(SessionPara para)`
- `List`1 GetAllDashboardTool(SessionPara para)`
- `List`1 GetAllDashboardWidgth(SessionPara para)`
- `DashBoardLoyoutData GetDashboardLayoutList(DashboardPara para)`
- `Boolean SaveDashboardLayoutList(DashboardPara para)`
- `DashboardLayoutTemplate GetDashboardLayoutTemplateByName(DashboardPara para)`
- `List`1 GetDashboardLayoutTemplateNames(DashboardPara para)`
- `Boolean SaveDashboardLayoutTemplate(DashboardPara para)`
- `Boolean DeleteDashboardLayoutTemplateByName(DashboardPara para)`

## Hoteam.InforCenter.Favorite.Service.dll

### [class] Hoteam.InforCenter.Favorite.Service.FavoriteService
- `Boolean FavoriteFolderMoveToNewParent(FavoritePara para)`
- `Boolean FavoriteObject(FavoritePara para)`
- `Boolean CancelFavorite(FavoritePara para)`
- `Boolean SetFavoriteImportant(FavoritePara para)`
- `Boolean LinkLevelUp(FavoritePara para)`
- `Boolean LinkLevelDown(FavoritePara para)`
- `List`1 GetFavoriteSelectList(SessionPara para)`
- `List`1 GetFavoriteObjectTypes(SessionPara para)`
- `TreeRootData GetFavoriteRootNodeForMove(TreeViewPara para)`
- `List`1 GetFavoriteChildNodeForMove(TreeViewPara para)`

### [interface] Hoteam.InforCenter.Favorite.Service.IFavoriteService
- `Boolean FavoriteFolderMoveToNewParent(FavoritePara para)`
- `Boolean FavoriteObject(FavoritePara para)`
- `Boolean CancelFavorite(FavoritePara para)`
- `Boolean SetFavoriteImportant(FavoritePara para)`
- `Boolean LinkLevelUp(FavoritePara para)`
- `Boolean LinkLevelDown(FavoritePara para)`
- `List`1 GetFavoriteSelectList(SessionPara para)`
- `List`1 GetFavoriteObjectTypes(SessionPara para)`
- `TreeRootData GetFavoriteRootNodeForMove(TreeViewPara para)`
- `List`1 GetFavoriteChildNodeForMove(TreeViewPara para)`

## Hoteam.InforCenter.Integration.Service.dll

### [interface] Hoteam.InforCenter.Integration.Service.IIntegrationService
- `IntegrationStartResultModel StartIntegration(StartIntegrationPara para)`
- `Void QueryTimedTaskForTheDay(SessionPara para)`
- `List`1 QueryPlugin(QueryPluginPara para)`
- `List`1 QueryMappingModel(QueryModelPara para)`
- `List`1 QueryTableColumns(QueryModelPara para)`
- `GridObject QueryActiveTemplatesForTimer(OnePageGridDataPara para)`
- `EnableTimerResult EnableDisableTimer(TimerEnablePara para)`
- `EnableTimerResult EnableDisableTimers(TimerEnablePara para)`
- `List`1 QueryDefaultPlugin(QueryPluginPara para)`
- `List`1 QueryAllMappingPlugin(QueryPluginPara para)`
- `EnableTimerResult RefreshTimers(TimerEnablePara para)`
- `Int64 GetLastTimeByTimes(SessionPara para)`
- `Int64 GetTimesByLastTime(SessionPara para)`
- `Void EnqueueIntegration(StartIntegrationPara para)`
- `CheckDbReturnModel ConnectionCheck(LoadCheckThirdpartyDBPara para)`
- `IList`1 GetAllThirdpartyDBs(LoadCheckThirdpartyDBPara para)`

### [interface] Hoteam.InforCenter.Integration.Service.IIntegrationStaticsService
- `ChartGridObject GetFlowAvgTimes(LogQueryDataPara para)`
- `ChartGridObject GetFlowCallCounts(LogQueryDataPara para)`
- `ChartGridObject GetPluginTimes(LogQueryDataPara para)`
- `GridObject GetLogCount(LogQueryDataPara para)`
- `GridObject GetPluginStatisticsData(LogQueryDataPara para)`
- `GridObject GetPluginRecord(LogQueryDataPara para)`
- `GridObject GetNodeStatistics(LogQueryDataPara para)`
- `GridObject GetFlowtemplateStatistics(LogQueryDataPara para)`
- `GridObject GetFlowtemplateRecord(LogQueryDataPara para)`
- `GridObject GetLogSummaryRecord(LogQueryDataPara para)`
- `GetDataObj GetPluginDataObj(LogQueryDataPara para)`
- `GetMessage GetLogMessage(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.Integration.Service.IntegrationPublicService
- `IntegrationStartResultModel StartIntegration(StartIntegrationPara para)`
- `WebTokenResult GenerateToken(WebAuthPara para)`
- `WebTokenResult CompareToken(WebAuthPara para)`

### [class] Hoteam.InforCenter.Integration.Service.IntegrationService
- `IntegrationStartResultModel StartIntegration(StartIntegrationPara para)`
- `List`1 QueryPlugin(QueryPluginPara para)`
- `List`1 QueryMappingModel(QueryModelPara para)`
- `List`1 QueryTableColumns(QueryModelPara para)`
- `GridObject QueryActiveTemplatesForTimer(OnePageGridDataPara para)`
- `Void QueryTimedTaskForTheDay(SessionPara para)`
- `EnableTimerResult EnableDisableTimer(TimerEnablePara para)`
- `List`1 QueryDefaultPlugin(QueryPluginPara para)`
- `List`1 QueryAllMappingPlugin(QueryPluginPara para)`
- `EnableTimerResult EnableDisableTimers(TimerEnablePara para)`
- `EnableTimerResult RefreshTimers(TimerEnablePara para)`
- `Int64 GetLastTimeByTimes(SessionPara para)`
- `Int64 GetTimesByLastTime(SessionPara para)`
- `Void EnqueueIntegration(StartIntegrationPara para)`
- `CheckDbReturnModel ConnectionCheck(LoadCheckThirdpartyDBPara para)`
- `IList`1 GetAllThirdpartyDBs(LoadCheckThirdpartyDBPara para)`

### [class] Hoteam.InforCenter.Integration.Service.IntegrationStaticsService
- `GridObject GetLogCount(LogQueryDataPara para)`
- ` GetLogCountDataTable(<unresolved>)`
- `ChartGridObject GetFlowAvgTimes(LogQueryDataPara para)`
- ` GetFlowAvgTimesData(<unresolved>)`
- `ChartGridObject GetFlowCallCounts(LogQueryDataPara para)`
- ` GetFlowCallCountsData(<unresolved>)`
- `ChartGridObject GetPluginTimes(LogQueryDataPara para)`
- ` GetPluginTimesData(<unresolved>)`
- `GridObject GetPluginStatisticsData(LogQueryDataPara para)`
- `GridObject GetPluginRecord(LogQueryDataPara para)`
- `GridObject GetNodeStatistics(LogQueryDataPara para)`
- `GridObject GetFlowtemplateStatistics(LogQueryDataPara para)`
- `GridObject GetFlowtemplateRecord(LogQueryDataPara para)`
- `GridObject GetLogSummaryRecord(LogQueryDataPara para)`
- ` GetSelectTime(<unresolved>)`
- ` GetTop(<unresolved>)`
- `GetDataObj GetPluginDataObj(LogQueryDataPara para)`
- `GetMessage GetLogMessage(OnePageGridDataPara para)`

## Hoteam.InforCenter.InternalMail.Service.dll

### [interface] Hoteam.InforCenter.InternalMail.Service.IInternalMailService
- `String GetInternalMailPluginByMailID(InternalMailPara para)`
- `String GetInternalMailPluginByPluginID(InternalMailPara para)`
- `Boolean ClearInternalMail(InternalMailPara para)`
- `Boolean RemoveInternalMailToDustbin(InternalMailPara para)`
- `GridObject GetInternalMailListData(OnePageGridDataPara para)`
- `Boolean MarkReadOrUnRead(InternalMailPara para)`
- `String GetUnreadInfoType(SessionPara para)`
- `Boolean MakeRead(InternalMailPara para)`
- `Boolean MakeReadSingle(InternalMailPara para)`
- `Void MakeAllRead(InternalMailPara para)`
- `Void DeleteAllMessage(SessionPara para)`
- `MessageInfo UnreadInfo(SessionPara para)`
- `UnreadMessageInfo GetUnreadMessageInfo(SessionPara para)`
- `Int64 GetUnreadMessageCount(SessionPara para)`
- `List`1 GetUserMessageList(SessionPara para)`
- `String SendInternalMail(InternalMailPara para)`
- `String SaveInternalMail(InternalMailPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `GridObject GetGridData(OnePageGridDataPara para)`
- `String GetUnreadMailCountStr(TreeViewPara para)`
- `String UserReceivesBroadcast(SessionPara para)`

### [class] Hoteam.InforCenter.InternalMail.Service.InternalMailService
- `Boolean ClearInternalMail(InternalMailPara para)`
- `GridObject GetInternalMailListData(OnePageGridDataPara para)`
- `String GetInternalMailPluginByMailID(InternalMailPara para)`
- `String GetInternalMailPluginByPluginID(InternalMailPara para)`
- `Boolean RemoveInternalMailToDustbin(InternalMailPara para)`
- `MessageInfo UnreadInfo(SessionPara para)`
- `Void DeleteAllMessage(SessionPara para)`
- `Void MakeAllRead(InternalMailPara para)`
- `Boolean MakeRead(InternalMailPara para)`
- `Boolean MakeReadSingle(InternalMailPara para)`
- `List`1 GetUserMessageList(SessionPara para)`
- `String SendInternalMail(InternalMailPara para)`
- `String SaveInternalMail(InternalMailPara para)`
- `Boolean MarkReadOrUnRead(InternalMailPara para)`
- `String GetUnreadInfoType(SessionPara para)`
- `UnreadMessageInfo GetUnreadMessageInfo(SessionPara para)`
- `Int64 GetUnreadMessageCount(SessionPara para)`
- `GridTitleData GetTitle(GridRowTitlePara para)`
- `GridObject GetGridData(OnePageGridDataPara para)`
- `String GetUnreadMailCountStr(TreeViewPara para)`
- `String UserReceivesBroadcast(SessionPara para)`

## Hoteam.InforCenter.ModelGenerator.Service.dll

### [interface] Hoteam.InforCenter.ModelGenerator.Service.IModelGeneratorService
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `List`1 GetCustomFormTreeQueryData(TreeViewPara para)`
- `TreeChildData GetModelTreeChildNode(TreeViewPara para)`
- `EditGridTitleData GetInheritInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetBaseInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetBaseInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `GridTitleData GetModelGridTitle(GridRowTitlePara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `GridObject GetCustomFormGridData(OnePageGridDataPara para)`
- `String GetObjectTypeGeneratorData(ModelGeneratorPara para)`
- `String CheckCheckOutUser(ModelGeneratorPara para)`
- `String GetCheckOutInfo(ModelGeneratorPara para)`
- `Boolean CheckInObjectByTypeName(ModelGeneratorPara para)`
- `Boolean CheckOutObjectByTypeName(ModelGeneratorPara para)`
- `Boolean UndoCheckOutByTypeName(ModelGeneratorPara para)`
- `String SaveModelData(ModelSavePara para)`
- `String SaveModelDataAndReturnPageData(ModelSavePara para)`
- `String NewModelData(SaveObjectDataPara para)`
- `Boolean UpdateInheritInfoState(ModelGeneratorPara para)`
- `Boolean ResetInheritInfoState(ModelGeneratorPara para)`
- `Boolean DeleteModelByObjType(ModelGeneratorPara para)`
- `Boolean CheckModelHaveExtendObjTypeBeforeDelete(ModelGeneratorPara para)`
- `EditGridTitleData GetFKSetInfoTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetForeignKeyInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetForeignKeyInfoGridData(OnePageGridDataPara para)`
- `List`1 GetObjectInfoTypeList(ModelGeneratorPara para)`
- `EditGridObject GetFKSetInfoGridData(OnePageGridDataPara para)`
- `String SaveFormBuilderDesignData(ModelGeneratorPara para)`
- `Boolean CheckFormBuilderDesignData(ModelGeneratorPara para)`
- `Boolean CheckModelState(ModelGeneratorPara para)`
- `Boolean StartModel(ModelGeneratorPara para)`
- `Boolean StopModel(ModelGeneratorPara para)`
- `String GeneratorFormBuilderPage(ModelGeneratorPara para)`
- `Boolean UpdateSqlSchemaByObjType(ModelGeneratorPara para)`
- ` GetAllObjectTypeDataSet(<unresolved>)`
- ` GetObjectDataSetByTypeAndFilter(<unresolved>)`
- `TreeRootData GetCustormFormTreeNode(SessionPara para)`
- `GridTitleData GetTitleDataByObjType(GridRowTitlePara para)`
- `GridObject GetGridDataByObjType(OnePageGridDataPara para)`
- `Boolean CheckObjectStateColumnExist(ModelSavePara para)`
- `Boolean CheckObjectNameExist(ModelSavePara para)`
- `TreeChildData GetCustormFormTreeChildNode(TreeViewPara para)`
- `ModelReportDataSource GetAllObjectTypeDataSetAndLanguage(SessionPara para)`
- `Boolean AddFormTypeToFormClassify(ModelSavePara para)`
- `Boolean RemoveFormTypeOnFormClassify(ModelSavePara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(ModelSavePara para)`
- `EditGridTitleData GetFlowTaskPermissionTitleData(GridRowTitlePara para)`
- `EditGridObject GetFlowTaskPermissionGridData(OnePageGridDataPara para)`
- `String GetFlowTaskInfoByWorkflowID(ModelSavePara para)`
- `ExcelExportData ExportFormData(ModelSavePara para)`
- `String GetFormBuilderVersion(FormBuilderVerionPara para)`
- `List`1 GetFormBuilderVersionList(FormBuilderVerionPara para)`
- `String GetFormThemData(ModelSavePara para)`
- `Boolean SaveFormThemData(ModelSavePara para)`
- `ExcelExportData ExportFromFormData(ModelSavePara para)`
- `String ImportThem(ImportWcfPara para)`
- `String GetModelData(ModelSavePara para)`
- `String CopyModelData(ModelSavePara para)`
- `Boolean SaveAboutModel(ModelSavePara para)`
- `List`1 GetCurCompanyObjTypeList(SessionPara para)`
- `TreeRootData GetCustomFormFlowAuditTreeRootData(TreeViewPara para)`

### [class] Hoteam.InforCenter.ModelGenerator.Service.ModelGeneratorService
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `TreeChildData GetModelTreeChildNode(TreeViewPara para)`
- `String CheckCheckOutUser(ModelGeneratorPara para)`
- `String GetCheckOutInfo(ModelGeneratorPara para)`
- `Boolean CheckInObjectByTypeName(ModelGeneratorPara para)`
- `Boolean CheckOutObjectByTypeName(ModelGeneratorPara para)`
- `EditGridObject GetBaseInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetBaseInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetExtendInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetExtendInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetInheritInfoGridData(OnePageGridDataPara para)`
- `EditGridTitleData GetInheritInfoTitleData(GridRowTitlePara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `GridTitleData GetModelGridTitle(GridRowTitlePara para)`
- `String GetObjectTypeGeneratorData(ModelGeneratorPara para)`
- `String SaveModelData(ModelSavePara para)`
- `String SaveModelDataAndReturnPageData(ModelSavePara para)`
- `Boolean UndoCheckOutByTypeName(ModelGeneratorPara para)`
- `Boolean UpdateInheritInfoState(ModelGeneratorPara para)`
- `Boolean ResetInheritInfoState(ModelGeneratorPara para)`
- `String NewModelData(SaveObjectDataPara para)`
- `Boolean DeleteModelByObjType(ModelGeneratorPara para)`
- `Boolean CheckModelHaveExtendObjTypeBeforeDelete(ModelGeneratorPara para)`
- `EditGridTitleData GetFKSetInfoTitleData(GridRowTitlePara para)`
- `EditGridTitleData GetForeignKeyInfoTitleData(GridRowTitlePara para)`
- `EditGridObject GetForeignKeyInfoGridData(OnePageGridDataPara para)`
- `List`1 GetObjectInfoTypeList(ModelGeneratorPara para)`
- `EditGridObject GetFKSetInfoGridData(OnePageGridDataPara para)`
- `String SaveFormBuilderDesignData(ModelGeneratorPara para)`
- `Boolean CheckFormBuilderDesignData(ModelGeneratorPara para)`
- `Boolean CheckModelState(ModelGeneratorPara para)`
- `Boolean StartModel(ModelGeneratorPara para)`
- `Boolean StopModel(ModelGeneratorPara para)`
- `String GeneratorFormBuilderPage(ModelGeneratorPara para)`
- `Boolean UpdateSqlSchemaByObjType(ModelGeneratorPara para)`
- ` GetAllObjectTypeDataSet(<unresolved>)`
- `ModelReportDataSource GetAllObjectTypeDataSetAndLanguage(SessionPara para)`
- ` GetObjectDataSetByTypeAndFilter(<unresolved>)`
- `TreeRootData GetCustormFormTreeNode(SessionPara para)`
- `TreeChildData GetCustormFormTreeChildNode(TreeViewPara para)`
- `GridTitleData GetTitleDataByObjType(GridRowTitlePara para)`
- `GridObject GetGridDataByObjType(OnePageGridDataPara para)`
- `GridObject GetCustomFormGridData(OnePageGridDataPara para)`
- `Boolean CheckObjectStateColumnExist(ModelSavePara para)`
- `Boolean CheckObjectNameExist(ModelSavePara para)`
- `List`1 GetCustomFormTreeQueryData(TreeViewPara para)`
- `Boolean AddFormTypeToFormClassify(ModelSavePara para)`
- `Boolean RemoveFormTypeOnFormClassify(ModelSavePara para)`
- `EditGridTitleData GetFlowTaskPermissionTitleData(GridRowTitlePara para)`
- `EditGridObject GetFlowTaskPermissionGridData(OnePageGridDataPara para)`
- `ReturnWorkflowTemplateInfo GetWorkflowTemplateInfo(ModelSavePara para)`
- `String GetFlowTaskInfoByWorkflowID(ModelSavePara para)`
- `ExcelExportData ExportFormData(ModelSavePara para)`
- `ExcelExportData ExportFromFormData(ModelSavePara para)`
- `String GetFormBuilderVersion(FormBuilderVerionPara para)`
- `List`1 GetFormBuilderVersionList(FormBuilderVerionPara para)`
- `String GetFormThemData(ModelSavePara para)`
- `Boolean SaveFormThemData(ModelSavePara para)`
- `String ImportThem(ImportWcfPara para)`
- `String GetModelData(ModelSavePara para)`
- `String CopyModelData(ModelSavePara para)`
- `Boolean SaveAboutModel(ModelSavePara para)`
- `List`1 GetCurCompanyObjTypeList(SessionPara para)`
- `TreeRootData GetCustomFormFlowAuditTreeRootData(TreeViewPara para)`

## Hoteam.InforCenter.QueryMachine.Service.dll

### [class] Hoteam.InforCenter.QueryMachine.Service.QueryMachineService
- `TreeRootData GetQueryMachineTreeRootNode(TreeViewPara para)`
- `List`1 GetQueryMachineTreeChildNode(TreeViewPara para)`
- `TreeRootData GetQueryMachinRootModelTreeRootNode(TreeViewPara para)`
- `ResultModel GetQueryMachineDataForID(QueryMachinePara para)`
- `GetPOMTreeModel GetFieldKeyData(GetFieldKeyPara para)`
- `List`1 GetQueryMachineAddPOMTreeChildNode(TreeViewPara para)`
- `TreeRootData GetQueryMachineAddPOMTreeRootNode(TreeViewPara para)`
- `List`1 GetObjectTreeNode(GetFieldKeyPara para)`
- `Boolean SaveQueryMachineData(SaveQueyrMachinePara para)`
- `List`1 GetObjectValueList(SessionPara para)`
- `EditGridColDataObject GetEditGridColDataByObjectName(GetObjectTypePara para)`
- `ResuleQueryPageDataModel GetQueryMachineQueryData(GetQueryDropData para)`
- `List`1 GetCurrentQueryBaseData(QueryMachineQueryPara para)`
- `GridTitleData GetQueryMachineGridTitle(GridRowTitlePara para)`
- `GridObject GetQueryMachineGridOnePageData(OnePageGridDataPara para)`
- `GridTitleAndRowData GetQueryMachineGridAllPageData(OnePageGridDataPara para)`
- `List`1 GetQueryMachineLinkModelTreeRootNode(TreeViewPara para)`
- `List`1 GetQueryMachineShowViewTreeRootNode(ShowViewTreeNodePara para)`
- `Boolean SaveMyQuery(SaveMyQueryPara para)`
- `List`1 GetMyQueryDropData(GetMyQueryDropDataPara para)`
- `Boolean DeleteQueryMachine(QueryMachineQueryPara para)`
- `QueryHistoryData GetQueryHistoryData(QueryMachineHistoryPara para)`
- `List`1 DeleteMyQueryDropData(GetMyQueryDropDataPara para)`
- `QueryHistoryForIDModel GetHisotryModelForHistoryID(QueryMachinePara para)`
- `Boolean DeleteQueryHistory(DeleteQueryHistoryPara para)`
- `CustomQueryModel GetCustomQueryDataForID(QueryMachinePara para)`
- `Boolean SaveCustomQueryOrganizationRole(SaveCustomQueryOrganizationPara para)`
- `GridObject GetSampleQueryMachineGridOnePageData(OnePageGridDataPara para)`
- `GridTitleAndRowData GetSampleQueryMachineGridAllPageData(OnePageGridDataPara para)`
- `Dictionary`2 GetMajorVersionFormatValues(QueryMajorVersionDataPara para)`
- `Dictionary`2 GetMinorVersionFormatValues(QueryMinorVersionDataPara para)`
- `Boolean CheckPermission(SessionPara para)`
- `Boolean MoveQueryMachineBaseInfo(TreeViewPara para)`
- `TreeRootData QueryMachineGetModelPropertyTree(TreeViewPara para)`
- `Boolean DeleteQueryHistoryBySevenDay(SessionPara para)`

## Hoteam.InforCenter.InnerQueue.Service.dll

### [interface] Hoteam.InforCenter.InnerQueue.Service.IQueueMonitorService
- `List`1 GetQueueList(QueuePara para)`
- `List`1 GetTransData(QueuePara para)`
- `List`1 GetQueueIdData(QueuePara para)`
- `String GetQueueData(QueuePara para)`
- `List`1 GetProcessInfo(QueuePara para)`
- `TreeRootData GetQueueRootData(TreeViewPara para)`
- `TreeChildData GetQueueChildData(TreeViewPara para)`
- `GridObject GetProcessStatisList(QueuePara para)`
- `GridObject GetQueueDataByType(QueuePara para)`
- `String ReExecQueueData(QueuePara para)`

### [class] Hoteam.InforCenter.InnerQueue.Service.QueueMonitorService
- `List`1 GetProcessInfo(QueuePara para)`
- `String GetQueueData(QueuePara para)`
- `List`1 GetQueueIdData(QueuePara para)`
- `List`1 GetQueueList(QueuePara para)`
- `List`1 GetTransData(QueuePara para)`
- `TreeRootData GetQueueRootData(TreeViewPara para)`
- `TreeChildData GetQueueChildData(TreeViewPara para)`
- `GridObject GetProcessStatisList(QueuePara para)`
- `GridObject GetQueueDataByType(QueuePara para)`
- `String ReExecQueueData(QueuePara para)`

## Hoteam.Inforcenter.StiReport.Service.dll

### [interface] Hoteam.Inforcenter.StiReport.Service.IReportService
- `String SaveReport(StiReportPara para)`
- `String GetReport(StiReportPara para)`
- `List`1 GetAllReport(SessionPara para)`
- ` GetObjectDataSetByTypeAndFilter(<unresolved>)`
- ` GetObjectDataBySql(<unresolved>)`

### [class] Hoteam.Inforcenter.StiReport.Service.ReportService
- `String SaveReport(StiReportPara para)`
- `String GetReport(StiReportPara para)`
- `List`1 GetAllReport(SessionPara para)`
- ` GetObjectDataSetByTypeAndFilter(<unresolved>)`
- ` GetObjectDataBySql(<unresolved>)`

## Hoteam.InforCenter.SystemSettings.Service.dll

### [interface] Hoteam.InforCenter.SystemSettings.Service.ISystemSettingsService
- `List`1 GetSystemSettings(SessionPara para)`
- `String Test(SessionPara para)`
- `TreeRootData GetSystemSettingsTreeRootNode(TreeViewPara para)`
- `List`1 GetSystemSettingsChildNode(TreeViewPara para)`
- `TreeRootData GetPersonalSettingsTreeRootNode(TreeViewPara para)`
- `Dictionary`2 GetEnumByName(GetEnumByNamePara para)`
- `SettingObject GetClientSetting(SessionPara para)`
- `Boolean UpdateSettingsValueByName(UpdateSettingsPara para)`
- `GridObject GetPersonalSettingGridData(OnePageGridDataPara para)`
- `PersonalSettingData GetPersonalIndividuationSetting(SessionPara para)`
- `String SavePersonalSettingEditData(SessionPara para)`
- `List`1 GetDataIsolationModels(SessionPara para)`
- `Boolean RemovePersonalSetting(SessionPara para)`

### [class] Hoteam.InforCenter.SystemSettings.Service.SystemSettingsService
- `Dictionary`2 GetEnumByName(GetEnumByNamePara para)`
- `List`1 GetSystemSettings(SessionPara para)`
- `SettingObject GetClientSetting(SessionPara para)`
- `List`1 GetSystemSettingsChildNode(TreeViewPara para)`
- `TreeRootData GetSystemSettingsTreeRootNode(TreeViewPara para)`
- `TreeRootData GetPersonalSettingsTreeRootNode(TreeViewPara para)`
- `String Test(SessionPara para)`
- `Boolean UpdateSettingsValueByName(UpdateSettingsPara para)`
- `GridObject GetPersonalSettingGridData(OnePageGridDataPara para)`
- `PersonalSettingData GetPersonalIndividuationSetting(SessionPara para)`
- `String SavePersonalSettingEditData(SessionPara para)`
- `List`1 GetDataIsolationModels(SessionPara para)`
- `Boolean RemovePersonalSetting(SessionPara para)`

## Hoteam.InforCenter.FormListManagement.Service.dll

### [class] Hoteam.InforCenter.FormListManagement.Service.FormEditListViewExecutor
- `EditGridRowTitleData GetEditGridTitleObjectDataByViewName(SessionPara para, WebListView webList)`
- `EditGridRowTitleObject GetEditGridTitleDataByViewName(SessionPara para, WebListView webList)`

### [class] Hoteam.InforCenter.FormListManagement.Service.FormListViewService
- `GridTitleData GetGridRowTitle(FormGridRowTitlePara para)`
- `GridObject GetOnePageGridData(FormOnePageGridDataPara para)`
- `GridTitleAndRowData GetGridTitleAndData(FormOnePageGridDataPara para)`
- `EditGridTitleData GetEditGridRowTitle(GridRowTitlePara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`

### [interface] Hoteam.InforCenter.FormListManagement.Service.IFormListViewService
- `GridObject GetOnePageGridData(FormOnePageGridDataPara para)`
- `GridTitleData GetGridRowTitle(FormGridRowTitlePara para)`
- `GridTitleAndRowData GetGridTitleAndData(FormOnePageGridDataPara para)`
- `EditGridTitleData GetEditGridRowTitle(GridRowTitlePara para)`
- `EditGridObject GetGridData(EditGridDataPara para)`

## Hoteam.InforCenter.WebStudio.View.Service.dll

### [interface] Hoteam.InforCenter.WebStudio.View.Service.IWebStuidoViewService
- `EditGridTitleData GetModelInfoTitleList(GridRowTitlePara para)`
- `EditGridObject GetModelInfoDataList(OnePageGridDataPara para)`
- `EditGridTitleData SetModelInfoTypeViewTitle(GridRowTitlePara para)`
- `EditGridObject SetModelInfoTypeViewData(OnePageGridDataPara para)`
- `Boolean SaveModelViewSetting(OnePageGridDataPara para)`
- `TreeRootData ModelViewTreeRootData(TreeViewPara para)`
- `Boolean CreateModelWebView(SessionPara para)`
- `Boolean DeleteModelWebView(SessionPara para)`
- `Boolean SaveModelViewConditionSetting(OnePageGridDataPara para)`
- `EditGridTitleData GetModelInfoConditionTitleList(GridRowTitlePara para)`
- `EditGridObject GetModelInfoConditionDataList(OnePageGridDataPara para)`
- `EditGridTitleData SetModelInfoConditionViewTitle(GridRowTitlePara para)`
- `EditGridObject SetModelInfoConditionViewData(OnePageGridDataPara para)`
- `GridTitleData GetRowTitleColumnQuery(GridRowTitlePara para)`
- `GridObject GetRowDataColumnQuery(OnePageGridDataPara para)`

### [class] Hoteam.InforCenter.WebStudio.View.Service.WebStuidoViewService
- `EditGridTitleData GetModelInfoTitleList(GridRowTitlePara para)`
- `EditGridObject GetModelInfoDataList(OnePageGridDataPara para)`
- `EditGridTitleData SetModelInfoTypeViewTitle(GridRowTitlePara para)`
- `EditGridObject SetModelInfoTypeViewData(OnePageGridDataPara para)`
- `Boolean SaveModelViewSetting(OnePageGridDataPara para)`
- `TreeRootData ModelViewTreeRootData(TreeViewPara para)`
- `Boolean CreateModelWebView(SessionPara para)`
- `Boolean DeleteModelWebView(SessionPara para)`
- `EditGridTitleData GetModelInfoConditionTitleList(GridRowTitlePara para)`
- `EditGridObject GetModelInfoConditionDataList(OnePageGridDataPara para)`
- `EditGridTitleData SetModelInfoConditionViewTitle(GridRowTitlePara para)`
- `EditGridObject SetModelInfoConditionViewData(OnePageGridDataPara para)`
- `GridTitleData GetRowTitleColumnQuery(GridRowTitlePara para)`
- `GridObject GetRowDataColumnQuery(OnePageGridDataPara para)`
- `Boolean SaveModelViewConditionSetting(OnePageGridDataPara para)`

## Hoteam.InforCenter.Registered.OrganizationDataService.dll

### [interface] Hoteam.InforCenter.Registered.OrganizationDataService.IOrganizationDataService
- `RegisteredLoginUser GetLoginUser(LoginUserPara para)`
- `RegisteredLoginUser CheckAutoLoginUser(LoginUserPara para)`
- `ReturnUserRegistration UserRegistration(UserRegistrationPara para)`
- `String CheckMailOrCompanyNameExist(UserRegistrationPara para)`
- `String ChangePassword(UserRegistrationPara para)`
- `Boolean SetUserRegisterAudit(SessionPara para)`
- `Boolean CheckDeleteRegisterUser(SessionPara para)`
- `String GetCompanyVaultInfoList(SessionPara para)`
- `String GetCompanyFileServiceInfo(SessionPara para)`
- `Boolean CompanySetFileServiceOrNot(SessionPara para)`
- `Boolean SaveLocalFileService(SessionPara para)`
- `String CheckMailOrCompanyNameExistAudited(UserRegistrationPara para)`
- `String CheckCompanyAccountExist(UserRegistrationPara para)`
- `Boolean CheckAuditUnPass(SessionPara para)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.OrganizationDataService
- `RegisteredLoginUser GetLoginUser(LoginUserPara para)`
- `RegisteredLoginUser CheckAutoLoginUser(LoginUserPara para)`
- `ReturnUserRegistration UserRegistration(UserRegistrationPara para)`
- `String CheckMailOrCompanyNameExist(UserRegistrationPara para)`
- `String CheckCompanyAccountExist(UserRegistrationPara para)`
- `String ChangePassword(UserRegistrationPara para)`
- `String CheckMailOrCompanyNameExistAudited(UserRegistrationPara para)`
- `Boolean SetUserRegisterAudit(SessionPara para)`
- `Boolean CheckDeleteRegisterUser(SessionPara para)`
- `String GetCompanyVaultInfoList(SessionPara para)`
- `String GetCompanyFileServiceInfo(SessionPara para)`
- `Boolean CompanySetFileServiceOrNot(SessionPara para)`
- `Boolean SaveLocalFileService(SessionPara para)`
- `Boolean CheckAuditUnPass(SessionPara para)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.CompanyVaults
- `Void Init()`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.CompanyVaultFiles
- (no public methods)

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.CompanyVault
- (no public methods)

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.DatabaseTemplates
- `Void Init()`
- `Boolean CreateDataBase(BaseObject company, Database db)`
- `Database GetDatabase(String dbType, String uid, String password, String& templateName)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.DatabaseTemplateFiles
- (no public methods)

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Config.DatabaseTemplate
- (no public methods)

### [interface] Hoteam.InforCenter.Registered.OrganizationDataService.Config.IDBTemplateHandle
- `Database GetDatabase(String uid, String password)`
- `Boolean CreateDataBase(BaseObject company, Database db)`
- `Boolean TestConnect()`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Business.DataBaseSetting
- (no public methods)

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Business.LoginUserUtil
- `RegisteredLoginUser GetLoginUser(LoginUserPara para, EntityObject& ouser)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Business.UpdateRegisteredUDFNotify
- `String ReceiveNotify(String connect, UDPNotifyType type, String data)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Business.UserRegisterAudit
- `Boolean AuditRegisterUser(SessionPara para)`
- `Boolean CheckDeleteRegisterUser(SessionPara para)`

### [class] Hoteam.InforCenter.Registered.OrganizationDataService.Business.UserRegistrationUtil
- `ReturnUserRegistration Registration(UserRegistrationPara para)`
- `Boolean InternalRegistratedByCompanyName(String companyName, String systempassword)`
- `String CheckMailOrCompanyNameExist(UserRegistrationPara para)`

## Hoteam.InforCenter.CommonUploadAndView.Service.dll

### [class] Hoteam.InforCenter.CommonUploadAndView.Service.CommonUploadAndViewService
- `String GetInfoForViewOnline(SessionPara para)`
- `String GetTransformFileUrl(SessionPara para)`
- `String GetDownloadUrlByObjIDAndColumn(SessionPara para)`

### [interface] Hoteam.InforCenter.CommonUploadAndView.Service.ICommonUploadAndViewService
- `String GetInfoForViewOnline(SessionPara para)`
- `String GetTransformFileUrl(SessionPara para)`
- `String GetDownloadUrlByObjIDAndColumn(SessionPara para)`

## Hoteam.InforCenter.NavIntegration.Service.dll

### [interface] Hoteam.InforCenter.NavIntegration.Service.INavIntegrationService
- `Boolean SyncOrganizaiton(SessionPara para)`
- `String GetSyncOrganization(SessionPara para)`

### [class] Hoteam.InforCenter.NavIntegration.Service.LocalSoftwareAddressUtility
- `T WcfCallDataService(SessionPara para, String localSoftwareurl, String serviceuri, String paras)`

### [class] Hoteam.InforCenter.NavIntegration.Service.NavIntegrationService
- `Boolean SyncOrganizaiton(SessionPara para)`
- `String GetSyncOrganization(SessionPara para)`

## Hoteam.InforCenter.RegisteredCompanyLink.Service.dll

### [interface] Hoteam.InforCenter.RegisteredCompanyLink.Service.IRegisteredCompanyLinkService
- `GridObject GetCompanyFriendLinkQueryData(OnePageGridDataPara para)`
- `Boolean CheckCompanyFriendLink(SessionPara para)`
- `Boolean SaveCompanyFriendLink(SessionPara para)`
- `GridObject GetApplyCompanyGrid(OnePageGridDataPara para)`
- `GridObject GetAcceptCompanyUnAuditGrid(OnePageGridDataPara para)`
- `GridObject GetAcceptCompanyAuditedGrid(OnePageGridDataPara para)`
- `Boolean AuditCompanyLink(SessionPara para)`
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `TreeChildData GetModelTreeChildNode(TreeViewPara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `GridTitleData GetPreCompanyUsersTitle(GridRowTitlePara para)`
- `GridObject GetPreCompanyUsers(OnePageGridDataPara para)`
- `String GetCompanyFriendDataByName(SessionPara para)`
- `Boolean CheckAuditUser(SessionPara para)`
- `String GetCompanyDenyModule(SessionPara para)`
- `Void Test(SessionPara para)`
- `List`1 GetRelationCompanyInfo(SessionPara para)`
- `String GetForeignKeyObject(SessionPara para)`

### [class] Hoteam.InforCenter.RegisteredCompanyLink.Service.RegisteredCompanyLinkService
- `GridObject GetCompanyFriendLinkQueryData(OnePageGridDataPara para)`
- `Boolean CheckCompanyFriendLink(SessionPara para)`
- `Boolean SaveCompanyFriendLink(SessionPara para)`
- `GridObject GetApplyCompanyGrid(OnePageGridDataPara para)`
- `GridObject GetAcceptCompanyUnAuditGrid(OnePageGridDataPara para)`
- `GridObject GetAcceptCompanyAuditedGrid(OnePageGridDataPara para)`
- `Boolean AuditCompanyLink(SessionPara para)`
- `TreeRootData GetModelTreeRootData(TreeViewPara para)`
- `TreeChildData GetModelTreeChildNode(TreeViewPara para)`
- `GridObject GetModelGridData(OnePageGridDataPara para)`
- `GridTitleData GetPreCompanyUsersTitle(GridRowTitlePara para)`
- `GridObject GetPreCompanyUsers(OnePageGridDataPara para)`
- `String GetCompanyFriendDataByName(SessionPara para)`
- `Boolean CheckAuditUser(SessionPara para)`
- `String GetCompanyDenyModule(SessionPara para)`
- `Void Test(SessionPara para)`
- `List`1 GetRelationCompanyInfo(SessionPara para)`
- `String GetForeignKeyObject(SessionPara para)`

## Hoteam.InforCenter.WorkSpaceNew.Service.dll

### [interface] Hoteam.InforCenter.WorkSpaceNew.Service.IWorkSpaceService
- `TreeChildData GetWorkSpaceChildData(TreeViewPara para)`
- `GridObject GetChildrenGridObjects(OnePageGridDataPara para)`
- `TreeRootData GetWSTreeRoot(TreeViewPara para)`
- `List`1 GetWorkFlowTreeRootData(TreeViewPara para)`
- `TreeChildData GetWorkFlowTreeChildData(TreeViewPara para)`
- `WorkFlowCheckResultModel GetWorkFlowTreeAddedData(TreeViewPara para)`
- `List`1 GetWSTreeQueryData(TreeViewQueryParaOpt para)`
- `Void CancelTreeQuery(TreeViewQueryParaOpt para)`
- `String GetModelName(WorkSpacePara para)`
- `Int32 GetVersionPseItemCount(WorkSpacePara para)`
- `SplitFolderResult SplitFolder(WorkSpacePara para)`
- `WorkFlowAuditResultModel GetWorkFlowAuditTreeRootData(TreeViewPara para)`
- `String RemoveAttach(RemoveAttachPara para)`
- `Boolean SaveEditWorkflow(TreeViewPara para)`

### [class] Hoteam.InforCenter.WorkSpaceNew.Service.WorkSpaceService
- `TreeRootData GetWSTreeRoot(TreeViewPara para)`
- `TreeChildData GetWorkSpaceChildData(TreeViewPara para)`
- `GridObject GetChildrenGridObjects(OnePageGridDataPara para)`
- `List`1 GetWorkFlowTreeRootData(TreeViewPara para)`
- `TreeChildData GetWorkFlowTreeChildData(TreeViewPara para)`
- `WorkFlowCheckResultModel GetWorkFlowTreeAddedData(TreeViewPara para)`
- `List`1 GetWSTreeQueryData(TreeViewQueryParaOpt para)`
- `Void CancelTreeQuery(TreeViewQueryParaOpt para)`
- `String GetModelName(WorkSpacePara para)`
- `Int32 GetVersionPseItemCount(WorkSpacePara para)`
- `SplitFolderResult SplitFolder(WorkSpacePara para)`
- `WorkFlowAuditResultModel GetWorkFlowAuditTreeRootData(TreeViewPara para)`
- `String RemoveAttach(RemoveAttachPara para)`
- `Boolean SaveEditWorkflow(TreeViewPara para)`

## Hoteam.ZCLZ.Demand.Service.dll

### [interface] Hoteam.ZCLZ.Demand.Service.IDemandService
- `Boolean SetDemandFile(DemandPara para)`
- `GridObject GetImportCreateData(ImportWcfPara para)`
- `GridTitleData GetImportTitleData(ImportWcfPara para)`
- `ImportCheckResult DemandImportCheckData(ImportDemandCheckPara para)`
- `ImportCheckResult ImportDemand(ImportDemandCheckPara para)`
- `String BatchGetObjListString(DemandPara para)`
- `EditGridTitleData GetBatchCreateDemandTitleData(GridRowTitlePara para)`
- `String BatchCreateDemand(DemandPara para)`
- `EditGridObject GetProjectDemandLink(EditGridDataPara para)`
- `Void UpdateObjectColumnValue(UpdateObjectPara para)`
- `String DeleteLinkObject(DeleteLinkCusPara para)`
- `Boolean CheckDemandCodeExist(DemandPara para)`

### [class] Hoteam.ZCLZ.Demand.Service.DemandService
- `Boolean SetDemandFile(DemandPara para)`
- `GridObject GetImportCreateData(ImportWcfPara para)`
- `GridTitleData GetImportTitleData(ImportWcfPara para)`
- `ImportCheckResult DemandImportCheckData(ImportDemandCheckPara para)`
- `ImportCheckResult ImportDemand(ImportDemandCheckPara para)`
- `String BatchGetObjListString(DemandPara para)`
- `EditGridTitleData GetBatchCreateDemandTitleData(GridRowTitlePara para)`
- `String BatchCreateDemand(DemandPara para)`
- `EditGridObject GetProjectDemandLink(EditGridDataPara para)`
- `Void UpdateObjectColumnValue(UpdateObjectPara para)`
- `String DeleteLinkObject(DeleteLinkCusPara para)`
- `Boolean CheckDemandCodeExist(DemandPara para)`

## Hoteam.ZCLZ.ProjectMeeting.Service.dll

### [interface] Hoteam.ZCLZ.ProjectMeeting.Service.IProjectMeetingService
- `Boolean RemoveRelateProject(ProjectSavePara para)`
- `Boolean AddRelateProject(ProjectSavePara para)`
- `List`1 AddProjectMeetingRelations(PSEItemRelationPara para)`
- `String SaveProjectMeetingSummaryInfo(ProjectMeetingSavePara para)`
- `String UpdateProjectMeetingSummaryInfo(ProjectMeetingSavePara para)`
- `String SaveTask(ProjectMeetingTaskEditPara para)`
- `GridTitleData GetProjectMeetingCheckTitle(GridRowTitlePara para)`
- `GridObject GetProjectMeetingCheckData(OnePageGridDataPara para)`
- `Boolean CheckProjectMeetingCodeRepeat(PSEItemEditPara para)`
- `EditGridObject GetProjectMeetingPlanData(EditGridDataPara para)`
- `GridTitleData GetMeetingPlanTitle(GridRowTitlePara para)`
- `GridObject GetMeetingPlanData(ProjectMeetingPlanPara para)`

### [class] Hoteam.ZCLZ.ProjectMeeting.Service.ProjectMeetingService
- `Boolean RemoveRelateProject(ProjectSavePara para)`
- `Boolean AddRelateProject(ProjectSavePara para)`
- `List`1 AddProjectMeetingRelations(PSEItemRelationPara para)`
- `String SaveProjectMeetingSummaryInfo(ProjectMeetingSavePara para)`
- `String UpdateProjectMeetingSummaryInfo(ProjectMeetingSavePara para)`
- `String SaveTask(ProjectMeetingTaskEditPara para)`
- `GridTitleData GetProjectMeetingCheckTitle(GridRowTitlePara para)`
- `GridObject GetProjectMeetingCheckData(OnePageGridDataPara para)`
- `Boolean CheckProjectMeetingCodeRepeat(PSEItemEditPara para)`
- `EditGridObject GetProjectMeetingPlanData(EditGridDataPara para)`
- `GridObject GetMeetingPlanData(ProjectMeetingPlanPara para)`
- `GridTitleData GetMeetingPlanTitle(GridRowTitlePara para)`

## Hoteam.InforCenter.ThreeRoleAuthPlatform.Service.dll

### [interface] Hoteam.InforCenter.ThreeRoleAuthPlatform.Service.IThreeRoleAuthPlatformService
- `List`1 GetThreeRoleAuth(SessionPara para)`
- `String GetThreeRoleAuthTypePage(SessionPara para)`
- `List`1 GetThreeRoleAuthType(SessionPara para)`
- `String GetThreeRoleLoginLimitPage(SessionPara para)`
- `Boolean SaveThreeRoleAuth(SessionPara para)`
- `Boolean SaveThreeRoleLoginLimitData(SessionPara para)`
- `LoginUserData GetLoginUser(SessionPara para)`
- `String GetLoginTypePageName(SessionPara para)`
- `String ValidateLoginData(SessionPara para)`
- `String GetSystemSettingAndModelPermission(SessionPara para)`
- `Boolean CheckAccessToken(SessionPara para)`
- `String NeedChangePassword(SessionPara para)`
- `String GetUserNameAndPasswordPolicy(SessionPara para)`
- `Boolean LockUser(SessionPara para)`
- `Boolean SavePassword(SessionPara para)`
- `Boolean ValidatePassowrdCombin(SessionPara para)`
- `String SaveUser(SaveObjectDataPara para)`
- `Boolean UnLockUser(SessionPara para)`
- `Boolean SavePersonAndUser(PersonUserDataPara para)`
- `List`1 GetUserDropdownListEXThreeRole(UserDropListPara para)`
- `List`1 GetUserDropdownListForThree(UserDropListPara para)`

### [class] Hoteam.InforCenter.ThreeRoleAuthPlatform.Service.ThreeRoleAuthPlatformService
- `List`1 GetThreeRoleAuth(SessionPara para)`
- `String GetThreeRoleAuthTypePage(SessionPara para)`
- `List`1 GetThreeRoleAuthType(SessionPara para)`
- `String GetThreeRoleLoginLimitPage(SessionPara para)`
- `Boolean SaveThreeRoleAuth(SessionPara para)`
- `Boolean SaveThreeRoleLoginLimitData(SessionPara para)`
- `LoginUserData GetLoginUser(SessionPara para)`
- `String GetLoginTypePageName(SessionPara para)`
- `String ValidateLoginData(SessionPara para)`
- `String GetSystemSettingAndModelPermission(SessionPara para)`
- `Boolean CheckAccessToken(SessionPara para)`
- `String NeedChangePassword(SessionPara para)`
- `String GetUserNameAndPasswordPolicy(SessionPara para)`
- `Boolean LockUser(SessionPara para)`
- `Boolean UnLockUser(SessionPara para)`
- `Boolean SavePassword(SessionPara para)`
- `Boolean ValidatePassowrdCombin(SessionPara para)`
- `String SaveUser(SaveObjectDataPara para)`
- `Boolean SavePersonAndUser(PersonUserDataPara para)`
- `List`1 GetUserDropdownListEXThreeRole(UserDropListPara para)`
- `List`1 GetUserDropdownListForThree(UserDropListPara para)`

## Hoteam.TSDC.CAD.Service.dll

### [class] Hoteam.TSDC.CAD.Service.Service
- `String GetGenerateCodeInfo(SessionPara para)`
- `String GetExistsItemCode(CadRequestPara para)`
- `String GetNextLevelItemByBom(CadRequestPara para)`
- `String CheckInItemForCAD(CADCheckPara para)`
- `List`1 QueryItemObject(CADQueryPara para)`
- `List`1 GetModelConfig(CADViewPara para)`
- `Dictionary`2 BatchGetItemRelationDocRole(CADCheckPara para)`

## Hoteam.TSDC.CAPPReport.Service.dll

### [class] Hoteam.TSDC.CAPPReport.Service.Service
- `String CreateReportObject(CReportObjectPara para)`
- `String CopyExistReportObject(CReportObjectPara para)`

## Hoteam.TSDC.ERP.Service.dll

### [class] Hoteam.TSDC.ERP.Service.Service
- `GridTitleData GetStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetERPStatisticsData(OnePageGridDataPara para)`
- `ServiceResult SendMaterialToERP(ErpPara para)`
- `GridObject GetBOMSearchData(ErpPara para)`
- `Dictionary`2 GetAllocateOrganizeEnum(SessionPara para)`
- `ServiceResult SendBomToERP(ErpPara para)`
- `Void UpdateIsSendStatus(ErpPara para)`
- `SendPseitemSGDToERPResult SendPseitemSGDToERP(SendPseitemSGDToERPPara para)`
- `GridObject GetStockSearchData(OnePageGridDataPara para)`
- `Dictionary`2 LoadLovList(SessionPara para)`
- `GridTitleData GetStockStatisticsTitle(GridRowTitlePara para)`
- `GridObject GetStatisticsData(StockOnePageGridDataPara para)`
- `ServiceResult SendProcessCardToERP(ErpPara para)`
- `GridObject GetERPProjectGridData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportExcelItemBom(StockExportTemplatePara para)`
- `ServiceResult SendSingleDocToERP(ErpPara para)`
- `String RemoveDocSendState(ErpPara para)`
- `String ReceivePurchaseOrder(SessionPara para)`
- `String ClearERPQGDFields(ErpPara para)`

## Hoteam.TSDC.Project.Service.dll

### [interface] Hoteam.TSDC.Project.Service.IService
- `Dictionary`2 GetAllProjectEcodeList(SessionPara para)`
- `String GetZuZhiByXMDH(SessionPara para)`
- `String SetQGDCodeValue(SessionPara para)`
- `List`1 GetProjectSapceTreeQueryData(TreeViewQueryPara para)`

### [class] Hoteam.TSDC.Project.Service.Service
- `Dictionary`2 GetAllProjectEcodeList(SessionPara para)`
- `String GetZuZhiByXMDH(SessionPara para)`
- `String SetQGDCodeValue(SessionPara para)`
- `List`1 GetProjectSapceTreeQueryData(TreeViewQueryPara para)`

## Hoteam.TSDC.PSE.Service.dll

### [class] Hoteam.TSDC.PSE.Service.Service
- `String GetItemCodeByTh(SessionPara para)`
- `Boolean CheckInObject(CheckPara para)`
- `ImportCheckResult ImportBomCheckData(ImportBomCheckPara para)`
- `Boolean ItemBOMIsCheckIn(BomLinePara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowId(WorkFlowAuditPara para)`
- `WorkflowAuditChildGriModel GetGridObjectListForWorkflowIdLook(WorkFlowAuditPara para)`
- `PlmWorkflowResultModel GetGridObjectForIds(GetGridObjectForIDsPara para)`
- `Dictionary`2 GetCLASSIFYCLASSEID(SessionPara para)`
- `String EditItem(PSEItemSavePara para)`
- `Boolean SaveClassifyObject(ClassifyPara para)`
- `Boolean CheckHasQGD(SessionPara para)`
- `Boolean CheckHasFWorCP(SessionPara para)`
- `ServiceResult AddClassifyCheckItem(SessionPara para)`
- `Void ItemAutoArchivist(SessionPara para)`
- `String CombinedEcodeGGXHValidation(SessionPara para, Dictionary`2 codeGGXHDic)`
- `Dictionary`2 GetSubDataModelList(SubDataModelPara para)`
- `GridObject GetOriginStatisticsData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportExcelOriginBom(ExportTemplatePara para)`
- `GridObject GetDrawingsStatisticsData(OnePageGridDataPara para)`
- `ExcelExportTemplateDataModel ExportDrawingsBom(ExportTemplatePara para)`
- `GridObject GetWSFolderContentListData(OnePageGridDataPara para)`
- `String UpdateDWGFileNameByItemId(SessionPara para)`
- `String SGDStartWorkFlowCheck(SessionPara para)`
- `String ExtractProjectNumberFromCode(SessionPara para)`
- `Void ClearWSFolderUsingTimer(SessionPara para)`

## HoteamsoftUpdateService.dll

### [class] HoteamsoftUpdateService.ShellHelper
- `String CombinePath(String path1, String path2)`
- `Void WriteOut(String message)`
- `Void WriteOut(String message, Exception ex)`
- `Void WriteToLogFile(String msg)`
- `Void WriteToLogFile(String msg, Exception ex)`
- `Boolean IsOpenFile(String strFileName)`

### [class] HoteamsoftUpdateService.UpdateService
- `Boolean Start()`
- `Boolean Stop()`
- `Void TcpClientCallback(IAsyncResult ar)`
- ` WriteBytesToClient(<unresolved>)`
- ` ReturnVersion(<unresolved>)`
- ` ReturnAllVersion(<unresolved>)`
- ` WriteFileToClient(<unresolved>)`
- ` ReturnFile(<unresolved>)`
- ` ReadClientCommand(<unresolved>)`


