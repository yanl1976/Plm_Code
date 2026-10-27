# PLM SDK - Interface Contracts

> Auto-generated. Source: `Server\Interface\*.dll` (official note: "all model and business object interface dlls")

## Hoteam.InforCenter.AccessRecord.Interface.dll

### [class] Hoteam.InforCenter.AccessRecord.Interface.AccessRecordConst
- (no public methods)

### [interface] Hoteam.InforCenter.AccessRecord.Interface.IAccessRecordUtility
- ` GetAccessRecordData(<unresolved>)`

## Hoteam.InforCenter.Base.Interface.dll

### [class] Hoteam.InforCenter.Base.Interface.FileCommandInfo
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.ConversionObjectInfo
- (no public methods)

### [interface] Hoteam.InforCenter.Base.Interface.IBaseObject
- ` GetServerTime(<unresolved>)`
- ` UpdateObjectColumnValue(<unresolved>)`
- ` CheckModelColumnDataIfLegal(<unresolved>)`

### [interface] Hoteam.InforCenter.Base.Interface.IObjectTypeDataSource
- ` GetDataSource(<unresolved>)`

### [interface] Hoteam.InforCenter.Base.Interface.IPLMBaseUtility
- ` GetGridData(<unresolved>)`
- `GridObject GetGridDataByViewName(OnePageGridDataPara para, List`1 lstObj)`

### [class] Hoteam.InforCenter.Base.Interface.PLMObjectConst
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.ModelFieldBase
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.LinkModelField
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.SignAttribute
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.FlowTaskApproval
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.ImageInfo
- (no public methods)

### [class] Hoteam.InforCenter.Base.Interface.CustomerSignAttribute
- (no public methods)

## Hoteam.InforCenter.BaseLine.Interface.dll

### [class] Hoteam.InforCenter.BaseLine.Interface.BaseLineConst
- (no public methods)

### [interface] Hoteam.InforCenter.BaseLine.Interface.IBaseLineManager
- ` CheckExistLinkInBaseLine(<unresolved>)`
- ` IsPseItemUsedByBaseLine(<unresolved>)`
- ` CheckDeleteBomInBaseLine(<unresolved>)`
- ` DeleteBaseLineByItemID(<unresolved>)`

### [class] Hoteam.InforCenter.BaseLine.Interface.PseBaseLineBomLineRelationItem
- (no public methods)

## Hoteam.InforCenter.BaseLine.ObjectValue.dll

### [class] Hoteam.InforCenter.BaseLine.ObjectValue.ValidityDataType
- ` GetDisplayValue(<unresolved>)`

## Hoteam.InforCenter.BomStatistics.Interface.dll

### [class] Hoteam.InforCenter.BomStatistics.Interface.CompareResult
- (no public methods)

### [class] Hoteam.InforCenter.BomStatistics.Interface.CompareRelationItem
- (no public methods)

### [class] Hoteam.InforCenter.BomStatistics.Interface.CompareLinkObject
- (no public methods)

### [class] Hoteam.InforCenter.BomStatistics.Interface.CompareEntityObject
- (no public methods)

### [interface] Hoteam.InforCenter.BomStatistics.Interface.IBomCompareManager
- ` GetItemBom(<unresolved>)`
- ` CompareBom(<unresolved>)`
- `String CompareAdd(SessionPara para)`
- `String CompareDelete(SessionPara para)`
- `String CompareSame(SessionPara para)`
- `String ComparePosition(SessionPara para)`
- `String CompareVersion(SessionPara para)`
- `String CompareNum(SessionPara para)`
- `String CompareMul(SessionPara para)`
- ` GetPseEditBom(<unresolved>)`
- ` GetBomCompareColor(<unresolved>)`

### [interface] Hoteam.InforCenter.BomStatistics.Interface.IBomStatisticsUtility
- ` GetPSEBom(<unresolved>)`
- ` GetPSEBom(<unresolved>)`
- ` GetGMPSEBom(<unresolved>)`
- ` GetBomData(<unresolved>)`

### [interface] Hoteam.InforCenter.BomStatistics.Interface.IDealDataExtendPlugin
- ` GetGridExtend(<unresolved>)`

## Hoteam.InforCenter.BomValidity.Interface.dll

### [class] Hoteam.InforCenter.BomValidity.Interface.BomValidityUnitRangeData
- (no public methods)

### [interface] Hoteam.InforCenter.BomValidity.Interface.IBomValidityManager
- ` ExecDateTimeValidity(<unresolved>)`
- ` ValidityChangeAttachState(<unresolved>)`
- ` DeleteDateValidity(<unresolved>)`
- ` DeleteValidityWithRelationId(<unresolved>)`

## Hoteam.InforCenter.BomVariable.Interface.dll

### [interface] Hoteam.InforCenter.BomVariable.Interface.IBomVariableBusiness
- ` EmendItemCopyRelation(<unresolved>)`
- ` EmendItemCopyLinkRelation(<unresolved>)`
- ` UpdateConfigByItemID(<unresolved>)`

### [interface] Hoteam.InforCenter.BomVariable.Interface.IProductBomDeployBusiness
- ` CheckFill(<unresolved>)`

## Hoteam.InforCenter.CAD.Interface.dll

### [class] Hoteam.InforCenter.CAD.Interface.Class1
- (no public methods)

## Hoteam.InforCenter.CADCIS.Interface.dll

### [class] Hoteam.InforCenter.CADCIS.Interface.Class1
- (no public methods)

## Hoteam.InforCenter.Capp.Interface.dll

### [class] Hoteam.InforCenter.Capp.Interface.CappInfoConst
- (no public methods)

### [interface] Hoteam.InforCenter.Capp.Interface.ICappItemManager
- ` CheckCreateCappItem(<unresolved>)`
- ` CreateCapp(<unresolved>)`
- ` CheckCreateCappItem(<unresolved>)`

### [interface] Hoteam.InforCenter.Capp.Interface.ICappItemStatistics
- ` GetBomTreeRoot(<unresolved>)`

### [interface] Hoteam.InforCenter.Capp.Interface.ICappItemUtility
- ` EmendCappForm(<unresolved>)`
- ` GetCappFormBySrcItemID(<unresolved>)`
- ` GetItemTreeNode(<unresolved>)`

### [interface] Hoteam.InforCenter.Capp.Interface.IAfterBatchCreateCappItem
- ` AfterBatchCreateCappItem(<unresolved>)`

## Hoteam.InforCenter.CappResource.Interface.dll

### [class] Hoteam.InforCenter.CappResource.Interface.CappResourceConst
- (no public methods)

### [interface] Hoteam.InforCenter.CappResource.Interface.ICappResource
- ` GetRecordObjectData(<unresolved>)`
- ` GetRecordObjectDataByTableName(<unresolved>)`
- ` GetRecordObjectData(<unresolved>)`
- ` UpdateResourceRecordIcon(<unresolved>)`
- ` CopyResourceRecode(<unresolved>)`
- ` CopyResourceRecode(<unresolved>)`
- ` CopyResourceRecode(<unresolved>)`
- ` DeepGetChildNode(<unresolved>)`
- ` GetNode(<unresolved>)`
- ` GetAllParentIdFilter(<unresolved>)`
- ` GetAllParentId(<unresolved>)`
- ` CappResourceDealData(<unresolved>)`
- ` GetRecordCanViewAttribute(<unresolved>)`

### [interface] Hoteam.InforCenter.CappResource.Interface.IRecordAttributeData
- (no public methods)

## Hoteam.InforCenter.ChangeApply.Interface.dll

### [class] Hoteam.InforCenter.ChangeApply.Interface.ApplyInfoConst
- (no public methods)

### [interface] Hoteam.InforCenter.ChangeApply.Interface.IApplyUtility
- ` SaveApplyObject(<unresolved>)`
- ` GetReceivedApplyCount(<unresolved>)`

## Hoteam.InforCenter.ChangeNotice.Interface.dll

### [interface] Hoteam.InforCenter.ChangeNotice.Interface.INoticeManager
- ` SaveNoticeObject(<unresolved>)`
- ` ClosedCycle(<unresolved>)`
- ` EmendInputObject(<unresolved>)`
- ` GetReceivedNoticeCount(<unresolved>)`

### [class] Hoteam.InforCenter.ChangeNotice.Interface.NoticeInfoConst
- (no public methods)

## Hoteam.InforCenter.ChangeProblem.Interface.dll

### [interface] Hoteam.InforCenter.ChangeProblem.Interface.IProblemManager
- ` GetReceivedProblemCount(<unresolved>)`

### [class] Hoteam.InforCenter.ChangeProblem.Interface.ProblemConst
- (no public methods)

## Hoteam.InforCenter.ChangeRelation.Interface.dll

### [interface] Hoteam.InforCenter.ChangeRelation.Interface.IChangeRelationManager
- ` SaveRelation(<unresolved>)`
- ` GetRelationByPEID(<unresolved>)`
- ` ClosedCycle(<unresolved>)`
- ` GetRelationChangeInfo(<unresolved>)`
- ` GetRelationChangeInfoByLinkType(<unresolved>)`
- ` GetRelationObject(<unresolved>)`
- ` GenerateByEmendItem(<unresolved>)`
- ` GetTimeLineData(<unresolved>)`

### [class] Hoteam.InforCenter.ChangeRelation.Interface.RelationConst
- (no public methods)

## Hoteam.InforCenter.ClassifyAttrbute.Interface.dll

### [class] Hoteam.InforCenter.ClassifyAttrbute.Interface.ClassifyAttributeConst
- (no public methods)

### [interface] Hoteam.InforCenter.ClassifyAttrbute.Interface.IClassifyAttribute
- (no public methods)

### [interface] Hoteam.InforCenter.ClassifyAttrbute.Interface.IClassifyAttributeData
- (no public methods)

### [interface] Hoteam.InforCenter.ClassifyAttrbute.Interface.IClassifyAttributeManager
- ` CopyRelation(<unresolved>)`
- ` chooseLOVValueBySuitGroup(<unresolved>)`

### [class] Hoteam.InforCenter.Service.Interface.Config.AttributeCgtConfig
- `Void Init()`
- `Void SingleInit(String path, Boolean isAdd)`
- `AttributeCgttion AttributeCgttionItem(String name)`
- `Vars AttributeCgttionItemDic(String name)`

### [class] Hoteam.InforCenter.Service.Interface.Config.AttributeCgttionFile
- (no public methods)

### [class] Hoteam.InforCenter.Service.Interface.Config.AttributeCgttion
- (no public methods)

### [class] Hoteam.InforCenter.Service.Interface.Config.Vars
- (no public methods)

## Hoteam.InforCenter.ClassifyEdit.Interface.dll

### [class] Hoteam.InforCenter.ClassifyEdit.Interface.ClassifyInfoConst
- (no public methods)

### [interface] Hoteam.InforCenter.ClassifyEdit.Interface.IClassifyClass
- (no public methods)

### [interface] Hoteam.InforCenter.ClassifyEdit.Interface.IClassifyEditUtility
- ` GetMaxSequenceByPEID(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyEdit.Interface.IClassifyView
- (no public methods)

## Hoteam.InforCenter.ClassifyUse.Interface.dll

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.IClassifyUseManager
- ` SaveClassifyObjectProperty(<unresolved>)`
- ` SaveClassifyObjectProperty(<unresolved>)`
- ` GetClassifyAttribute(<unresolved>)`
- ` SaveClassifyObject(<unresolved>)`
- ` SaveClassifyObject(<unresolved>)`
- ` SaveClassifyObjectAndAttr(<unresolved>)`
- ` SaveClassifyObjectAndAttr(<unresolved>)`
- ` GetClassCurAttribute(<unresolved>)`
- ` QueryClassifyData(<unresolved>)`
- ` QueryAllGrClassify(<unresolved>)`
- ` SaveMergeByClassifySetting(<unresolved>)`
- ` SaveMergeByClassifySetting(<unresolved>)`
- ` GetClassifyCanViewAttribute(<unresolved>)`
- ` GetAttributeDataAndClassify(<unresolved>)`
- ` GetAttributeDataAndClassifyID(<unresolved>)`
- ` GetClassifyOwnLovList(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.IImportClassifyObjectManagerPlugin
- ` ClassifyAttrExcelCheackData(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.IMergeByClassifySettingPlugin
- ` ItemMergeClassify(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.ISaveItemByMergeClassifyPlugin
- ` SaveItemByMergeClassify(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.ISaveMergeByClassifyNoRuleDicPlugin
- ` SaveMergeByClassifyNoRuleSetting(<unresolved>)`

### [interface] Hoteam.InforCenter.ClassifyUse.Interface.ISaveMergeByClassifyNoRulePlugin
- ` SaveMergeByClassifyNoRuleSetting(<unresolved>)`

## Hoteam.InforCenter.Coding.Maintenance.Interface.dll

### [class] Hoteam.InforCenter.Coding.Maintenance.Interface.CodingConst
- (no public methods)

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodeKind
- ` GetCodeKindIdByCodeKindName(<unresolved>)`
- ` ChangeCodeStateByObjectID(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodeKindPlugn
- ` ImportData(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodePermissionType
- ` CheckObjectPermission(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodeRes
- ` GeneratorCodeByCodeKind(<unresolved>)`
- ` GetCodeResWithObjectType(<unresolved>)`
- ` UpdateCodeResExcuted(<unresolved>)`
- ` GetPathNameByPath(<unresolved>)`
- ` GetPathByCode(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodeRulePlugn
- ` ImportData(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodeValuePlugn
- ` ImportData(<unresolved>)`

### [interface] Hoteam.InforCenter.Coding.Maintenance.Interface.ICodingImportCheck
- ` CheckImportData(<unresolved>)`
- ` CheckImportData(<unresolved>)`
- ` ImportData(<unresolved>)`
- ` ImportData(<unresolved>)`
- ` ExportData(<unresolved>)`

## Hoteam.InforCenter.CommandServiceExtendsion.Interface.dll

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.AssignServerConfig
- ` GetAssignServerBinding(<unresolved>)`
- `Void ConfigFileInit()`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.AssignServer
- (no public methods)

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.AssignServerRequestName
- (no public methods)

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.ConversionUtility
- ` BusinessInstance(<unresolved>)`
- `Void Init(String assignServerIP, Int32 assignServerPort)`
- `Void Init()`
- `Void WriteLog(String loginfoJson)`
- `String GetImageSignaturePathByFileID(String fileid)`
- `String GetCADSignaturePathByUserID(String fileid)`
- `String GetImageSignaturePathByFileName(String filename)`
- `String GetImageSignatureFileIdByFileNameAndType(String fileName, String fileType)`
- `Byte[] RequestData(String requestName, Object requestData, Boolean requestDataisByte, Int32 timeout)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.RequestData
- (no public methods)

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.ResponseData
- (no public methods)

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.Package
- `Byte[] PackageData(Byte[] content)`
- `Byte[] UnPackageData(Byte[] content)`
- ` UnPackageData(<unresolved>)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.Util
- `Byte[] BuildRequestMessage(RequestData request)`
- `RemotingServerMessage ParseRemotingServerMessage(Byte[] data)`
- `ResponseData ParseResponse(Byte[] body)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.HeaderHelper
- `Byte[] EncodeHeader(IDictionary`2 header)`
- `Dictionary`2 DecodeHeader(Byte[] data, Int32 startOffset, Int32& nextStartOffset)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.RemotingServerMessage
- (no public methods)

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.ByteUtil
- `Void EncodeString(String data, Byte[]& lengthBytes, Byte[]& dataBytes)`
- `Byte[] EncodeDateTime(DateTime data)`
- `String DecodeString(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `Int16 DecodeShort(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `Int32 DecodeInt(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `Int64 DecodeLong(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `DateTime DecodeDateTime(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `Byte[] DecodeBytes(Byte[] sourceBuffer, Int32 startOffset, Int32& nextStartOffset)`
- `Byte[] Combine(Byte[][] arrays)`
- `Byte[] Combine(IEnumerable`1 arrays)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.HeaderUtil
- `Byte[] EncodeHeader(IDictionary`2 header)`
- `IDictionary`2 DecodeHeader(Byte[] data, Int32 startOffset, Int32& nextStartOffset)`

### [interface] Hoteam.InforCenter.CommandServiceExtendsion.Interface.IAssignServer
- ` GetAssignServer(<unresolved>)`
- `Void DeleteCommandByObjID(String objID)`

### [class] Hoteam.InforCenter.CommandServiceExtendsion.Interface.Dto.SignatureInfo
- (no public methods)

## Hoteam.InforCenter.Common.ImportInitDataInterface.dll

### [interface] Hoteam.InforCenter.Common.ImportInitDataInterface.IImportInitData
- `String GetNewValue(String oldvalue, List`1 allData, CommonTableInfo currentTableInfo, Dictionary`2 organizaDic, ReplaceValue replace)`

### [class] Hoteam.InforCenter.Common.ImportInitDataInterface.CommonTableInfo
- (no public methods)

### [class] Hoteam.InforCenter.Common.ImportInitDataInterface.CommonRowInfo
- (no public methods)

### [class] Hoteam.InforCenter.Common.ImportInitDataInterface.CommonCellInfo
- (no public methods)

### [class] Hoteam.InforCenter.Common.ImportInitDataInterface.ReplaceValue
- (no public methods)

## Hoteam.InforCenter.Communication.Interface.dll

### [interface] Hoteam.InforCenter.Communication.Interface.ICommunicationUtil
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`
- ` SendMessage(<unresolved>)`

## Hoteam.InforCenter.CompanyRule.Interface.dll

### [class] Hoteam.InforCenter.CompanyRule.Interface.CompanyRuleException
- (no public methods)

### [interface] Hoteam.InforCenter.CompanyRule.Interface.ICompanyRuleUtility
- ` GetCompanyRuleCondition(<unresolved>)`
- ` GetCompanyRuleCondition(<unresolved>)`
- ` HaveCompanyCreatePermission(<unresolved>)`

## Hoteam.InforCenter.ConsumptionStation.Interface.dll

### [class] Hoteam.InforCenter.ConsumptionStation.Interface.ConsumptionStationConst
- (no public methods)

### [class] Hoteam.InforCenter.ConsumptionStation.Interface.ConsumptionStationInfoConst
- (no public methods)

### [class] Hoteam.InforCenter.ConsumptionStation.Interface.ConsumptionStructData
- (no public methods)

### [interface] Hoteam.InforCenter.ConsumptionStation.Interface.IConsumptionStationInterface
- (no public methods)

## Hoteam.InforCenter.Coordination.Interface.dll

### [interface] Hoteam.InforCenter.Coordination.Interface.ICoordinationManager
- (no public methods)

## Hoteam.InforCenter.CReportEdit.Interface.dll

### [class] Hoteam.InforCenter.CReportEdit.Interface.CReportEditConst
- (no public methods)

### [interface] Hoteam.InforCenter.CReportEdit.Interface.IApiReportExtInterface
- ` ApiGetReport(<unresolved>)`

### [interface] Hoteam.InforCenter.CReportEdit.Interface.IAttributeSynchroManager
- ` GetExtendAttributeSource(<unresolved>)`

### [interface] Hoteam.InforCenter.CReportEdit.Interface.ICReportObjectManager
- ` CopyExistReportForMSE(<unresolved>)`
- ` UpdateReportInfoByConfigForMSE(<unresolved>)`
- ` DealReportDefaultValue(<unresolved>)`
- ` UpdateReportID(<unresolved>)`
- ` UpdateProductOrItemInfo(<unresolved>)`
- ` ClearReportSignInfo(<unresolved>)`

### [interface] Hoteam.InforCenter.CReportEdit.Interface.IFlowSignExtent
- ` ClearReportSignInfo(<unresolved>)`

### [interface] Hoteam.InforCenter.CReportEdit.Interface.IItemToCReportRelationManager
- ` AddItemRelations(<unresolved>)`

### [interface] Hoteam.InforCenter.CReportEdit.Interface.IReportManager
- ` GetReportData(<unresolved>)`
- ` UpdateReportData(<unresolved>)`
- ` GetReportInfo(<unresolved>)`
- ` ExecSQL(<unresolved>)`
- ` GetVaultFileInfoFromObjectId(<unresolved>)`
- ` GetDBLabelByTemplateID(<unresolved>)`
- ` GetRPTableByTemplateID(<unresolved>)`
- ` GetRPTableRowsCount(<unresolved>)`
- ` GetRPTableAtts(<unresolved>)`
- ` NewReport(<unresolved>)`
- ` GetReportBookInfo(<unresolved>)`

### [class] Hoteam.InforCenter.CReportEdit.Interface.TypeForm
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.Interface.Cell
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.Interface.ItemInfoSet
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.Interface.ItemInfo
- (no public methods)

### [class] Hoteam.InforCenter.CReportEdit.Interface.ReportDefaultValueInfo
- (no public methods)

## Hoteam.InforCenter.DataSetType.Interface.dll

### [interface] Hoteam.InforCenter.DataSetType.Interface.IDataSetType
- (no public methods)

### [interface] Hoteam.InforCenter.DataSetType.Interface.IDataSetTypeCheck
- ` CheckDataSetTypeUse(<unresolved>)`
- ` CheckDataSetTypeUse(<unresolved>)`

### [interface] Hoteam.InforCenter.DataSetType.Interface.IDataSetTypeUtil
- ` GetDataSetTypeByName(<unresolved>)`
- ` GetDataSetTypeByID(<unresolved>)`
- ` GetDataSetTypeByExt(<unresolved>)`
- ` GetAllDataSetType(<unresolved>)`
- ` GetIconByExt(<unresolved>)`

## Hoteam.InforCenter.DeployCode.Interface.dll

### [class] Hoteam.InforCenter.DeployCode.Interface.DeployInfoConst
- (no public methods)

### [interface] Hoteam.InforCenter.DeployCode.Interface.IDeployCodeBusiness
- ` GetValueByVariantID(<unresolved>)`
- ` GetValuesByVariant(<unresolved>)`

## Hoteam.InforCenter.Distribute.Interface.dll

### [interface] Hoteam.InforCenter.Distribute.Interface.IProvideUpgradeTips
- ` UpgradeTips(<unresolved>)`

## Hoteam.InforCenter.DocModel.Interface.dll

### [class] Hoteam.InforCenter.DocModel.Interface.DatasetConst
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.Interface.FlowSignConfig
- `Void Init()`

### [class] Hoteam.InforCenter.DocModel.Interface.FlowSignConfigFile
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.Interface.FlowBackClass
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.Interface.BackClassInfo
- (no public methods)

### [interface] Hoteam.InforCenter.DocModel.Interface.IAttributeSignExtendPlugin
- ` AttributeSignExtend(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IClearSign
- ` IClearDataSetSignInfo(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IComparisonType
- ` GetComparisonResultGridData(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IDatasetType
- ` CheckDatasetTypeIsInUse(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IDatasetUtility
- ` GetDatasetIcon(<unresolved>)`
- ` EmendNewDataSet(<unresolved>)`
- ` GetDataSetVersionsByMID(<unresolved>)`
- ` CreateDatasetFromTemplateID(<unresolved>)`
- ` CreateDatasetToOtherModule(<unresolved>)`
- ` CreateDatasetToOtherModuleForBatch(<unresolved>)`
- ` UpdateCheckOutPath(<unresolved>)`
- ` CreateDatasetByTemplateID(<unresolved>)`
- ` GetChildLevelFile(<unresolved>)`
- ` GetChildLevelFileNoIsolate(<unresolved>)`
- ` GetDocTypeFileExtend(<unresolved>)`
- ` UpdateExistDataset(<unresolved>)`
- ` GetAllDocTypeInfo(<unresolved>)`
- ` ClearDataSetSignInfo(<unresolved>)`
- ` GetDocByMasterIDs(<unresolved>)`
- `List`1 GetDatasetExtendType()`
- ` CreateDocDatasetFromFileInfo(<unresolved>)`
- ` PasteDataSetForOtherModuler(<unresolved>)`
- ` PasteDataSetForOtherModuler(<unresolved>)`
- ` GetFileManager(<unresolved>)`
- `FileManager GetFileManager(SessionPara para, VaultUse vaultUse)`
- `FileManager GetFileManager(SessionPara para, VaultUse vaultUse, String filePath)`
- `FileManager GetFileManager(SessionPara para, VaultUse vaultUse, String filePath, String& ip, String& port)`
- `FileManager GetFileManagerInner(VaultUse vaultUse, String filePath, String& ip, String& port)`
- ` GetFileManagerInfo(<unresolved>)`
- ` GetFileManagerInfoIPPort(<unresolved>)`
- ` SendCommand(<unresolved>)`
- ` SendCommand(<unresolved>)`
- ` SendThumbnailCommand(<unresolved>)`
- ` DownLoadThumbnail(<unresolved>)`
- ` GetThumbnailUrl(<unresolved>)`
- ` UpdateFileInfoByCheckFileData(<unresolved>)`
- ` UpdateDatasetInfoByCheckFileData(<unresolved>)`
- ` GetFileManagerForServer(<unresolved>)`
- ` CopyFileInfo(<unresolved>)`
- ` RecoveryLightFile(<unresolved>)`
- ` UpdateExistDataset(<unresolved>)`
- ` UpdateExistDatasetForUpgrade(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IDocBaseForm
- (no public methods)

### [interface] Hoteam.InforCenter.DocModel.Interface.IDocDataSet
- (no public methods)

### [interface] Hoteam.InforCenter.DocModel.Interface.IDocModelIteration
- ` InitialByDataset(<unresolved>)`

### [interface] Hoteam.InforCenter.DocModel.Interface.IFileModel
- (no public methods)

### [class] Hoteam.InforCenter.DocModel.Interface.ImportFileInformation
- (no public methods)

### [interface] Hoteam.InforCenter.DocModel.Interface.IPasteToOM
- ` ExternlPasteToOtherModuler(<unresolved>)`

## Hoteam.InforCenter.DocTemplate.Interface.dll

### [class] Hoteam.InforCenter.DocTemplate.Interface.DocTemplateConst
- (no public methods)

### [interface] Hoteam.InforCenter.DocTemplate.Interface.IDocTemplateUtility
- ` GetFileTemplateByDocTemplateID(<unresolved>)`
- ` ImportDocTemplateFromOtherModule(<unresolved>)`
- ` GetDefaultClassifyChildObj(<unresolved>)`
- ` GetVaultFileInfoFromObjectId(<unresolved>)`
- ` GetVaultFileInfoFromObjectIdNoIsolate(<unresolved>)`
- ` GetTemplateFormDataByTemplateID(<unresolved>)`
- ` CreateTemplateByDicFileInfoData(<unresolved>)`

## Hoteam.InforCenter.Enumeration.Interface.dll

### [interface] Hoteam.InforCenter.Enumeration.Interface.IEnumeration
- (no public methods)

### [interface] Hoteam.InforCenter.Enumeration.Interface.IEnumerationItem
- (no public methods)

### [interface] Hoteam.InforCenter.Enumeration.Interface.IEnumerationUtil
- ` GetEnumByName(<unresolved>)`
- `Dictionary`2 GetEnumByName(LangPara lang, String EnumName, Boolean nullException)`
- `Dictionary`2 GetEnumByName(String lang, String EnumName, Boolean nullException)`
- `Dictionary`2 GetAllStaticEnum(String lang)`
- ` GetDBEnumByName(<unresolved>)`
- ` GetLovListByID(<unresolved>)`
- ` GetLovListItemByID(<unresolved>)`
- ` GetLovListByName(<unresolved>)`
- ` GetAllLovList(<unresolved>)`
- ` GetAllDBEnum(<unresolved>)`
- ` GetLovListFromObj(<unresolved>)`
- `Dictionary`2 GetEnumerationItemFromObj(SessionPara session, String objType, String infoName)`
- ` GetOjbectEnumerationItem(<unresolved>)`

## Hoteam.InforCenter.Favorite.Interface.dll

### [class] Hoteam.InforCenter.Favorite.Interface.FavoriteConst
- (no public methods)

### [interface] Hoteam.InforCenter.Favorite.Interface.IFavoriteUtility
- ` GetFavoriteObject(<unresolved>)`

## Hoteam.InforCenter.FileManage.Interface.dll

### [class] HoteamsoftFileService.FileDataEncrypt
- `Boolean CheckFileEncrypt(String localpath)`
- `Int64 GetFileDecryptLength(String localpath)`
- `String GetFilePathAddTmp(String localpath)`
- `Void WriteToStream(String localpath, Stream des, WriteStreamMode mode)`
- `Boolean EncryptFile(String localpath, Boolean encrypt)`
- `Boolean EncryptFile(String localpath, String despath, Boolean encrypt)`

### [class] HoteamsoftFileService.FileManager
- `Int64 Upload(String filepath, String despath)`
- `Int64 UploadEncrypt(String filepath, String despath)`
- `Int64 UploadEncrypt(String filepath, String despath, Boolean isAttach)`
- `Int64 Upload(String filepath, String localname, String despath)`
- `Int64 UpdateWithWriteStreamMode(String filepath, String localname, String despath, WriteStreamMode mode, Boolean isAttach)`
- `Void UploadAttach(String filepath, String despath)`
- ` GetRemoteFileIfNeeded(<unresolved>)`
- `Void Download(String filepath, String despath)`
- `DownloadResultParam GetDownloadParam(IEnumerable`1 downloadParams, Boolean nocheck, Boolean noWrapping)`
- `Void Delete(String filepath)`
- `Void TryDelete(String filepath)`
- `Void ClearComment(String filepath, String extension)`
- `Void CreateTransCommand(String filepath, String subFilePath)`
- `Void Move(String filepath, String despath)`
- `Void Move(String filepath, String despath, Boolean withBrowseDir)`
- `Void Copy(String filepath, String srcserver, String srcport, String srcvolumn, String srcpath)`
- `Void Copy(String filepath, String srcserver, String srcport, String srcvolumn, String srcpath, Boolean withBrowseFile)`
- `Void Copy(String filepath, String srcserver, String srcport, String srcvolumn, String srcpath, Boolean withBrowseFile, IEnumerable`1 browseFilePatterns)`
- `Void Copy(String filepath, String srcserver, String srcport, String srcvolumn, String srcpath, Boolean withBrowseFile, IEnumerable`1 browseFilePatterns, Boolean dontCreateDescFile)`
- `Void CopyComment(String dirpath, String srcserver, String srcport, String srcvolumn, String srcDirPath, String extension)`
- `Boolean IsFileExist(String filepath)`
- `Void EncryptFile(String filepath, Boolean encrypt)`
- `BrowseType GetBrowseType(String path)`
- `Void SendCommand(String cmdstr, String name)`
- `Void SendCommand(String cmdstr)`
- `List`1 GetDirectoryList(String path)`
- `List`1 GetFileList(String path)`
- `List`1 GetFileList(String path, String extension)`
- `Void DelDirectory(String path)`
- `Boolean IsDirectoryExist(String path)`
- `Dictionary`2 GetBrowserInfo(String filepath)`
- `Dictionary`2 GetBrowserInfo(String filepath, Boolean notCreateCommand)`
- `Dictionary`2 GetFileServerInfoByFilePath(String filePath)`
- `Dictionary`2 GetAvailableFileServer()`
- `Void CreateTransCommand(String filepath, String subFilePath, String objInfoJson)`
- `Dictionary`2 GetBrowserInfo(String filepath, String objInfoJson)`
- `Boolean ClearDiskLog(Int32 days)`
- `String GetCommandInfoByObjID(String objectid)`
- `String GetCommandInfoByObjID(String objectid, String commandName)`
- `Boolean DeleteCommandInfoByObjID(String objectid)`
- `Boolean DeleteTransFolderFiles(String filePath, Boolean deleteComment)`
- `Boolean DeleteTransFolderFiles(String filePath, Boolean deleteComment, IEnumerable`1 ignorePatterns)`
- `Void MarkFileUpdate(String filepathes)`

### [class] Hoteam.InforCenter.FileManage.Business.DownloadFileInfo
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.LimitDownloadParam
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.SuperDownloadPara
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.BaseDownloadPara
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.DirectoryDownloadParam
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.FileDownloadParam
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.FileInformation
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Business.VaultUse
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Interface.BrowseType
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Interface.ConversionObjectInfo
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Interface.DownloadResultParam
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Interface.ErrorFileInfo
- (no public methods)

### [class] Hoteam.InforCenter.FileManage.Interface.SimpleCommandInfo
- (no public methods)

### [enum] HoteamsoftFileService.FileDataEncrypt+WriteStreamMode
- values: None, Encrypt, Decrypt

## Hoteam.InforCenter.Formula.Interface.dll

### [interface] Hoteam.InforCenter.Formula.Interface.IFormulaManager
- ` GetFormulaConfigs(<unresolved>)`
- ` AllFormulaForComputing(<unresolved>)`
- ` BackstageAllFormulaForComputing(<unresolved>)`

### [class] Hoteam.InforCenter.Formula.Interface.ParaConfigData
- (no public methods)

## Hoteam.InforCenter.GrManagement.Interface.dll

### [interface] Hoteam.InforCenter.GrManagement.Interface.IGrManagement
- ` IsIsolate(<unresolved>)`
- ` GetIsolateFilter(<unresolved>)`
- ` IsShared(<unresolved>)`
- ` GetGrSecurityShow(<unresolved>)`
- ` IsSharedById(<unresolved>)`

## Hoteam.InforCenter.ImportExport.Interface.dll

### [interface] Hoteam.InforCenter.ImportExport.Interface.IExport
- `Boolean ExportFile(SessionPara para, String outPath, Object data)`
- `Boolean ExportFileByTemplate(SessionPara para, String outPath, Object data)`
- `Boolean ExportPdfFromExcelFile(SessionPara para, String& outPath, Object data)`

### [interface] Hoteam.InforCenter.ImportExport.Interface.IImport
- `String ImportFile(SessionPara para, String filePath)`

### [interface] Hoteam.InforCenter.ImportExport.Interface.IPrint
- `Void PrintFile(SessionPara para, String filePath, Object data)`

### [class] Hoteam.InforCenter.ImportExport.Interface.Word.WordExportTemplateDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Word.WordExportTemplateImageDataInfo
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Word.WordExportTemplateTableInfo
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Word.WordExportTemplateRow
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Word.WordExportTemplateText
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.ProjectDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppProjectHeader
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppTask
- `Object GetFieldValue(Int32 name)`
- `Object GetFieldValueByFiledType(String fieldType)`
- `Void SetFieldValue(Int32 name, String value)`

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.ColValue
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppResourceAssignment
- `Object GetFieldValue(Int32 name)`
- `Void SetFieldValue(Int32 name, String value)`

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppExtendFieldValue
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppColumn
- `String GetAreaName()`

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppFieldType
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppPredecessorTask
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppResource
- `Object GetFieldValue(Int32 name)`
- `Void SetFieldValue(Int32 name, String value)`

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppCalendars
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppCalendar
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppForceCalendar
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppCalendarTime
- (no public methods)

### [enum] Hoteam.InforCenter.ImportExport.Interface.Project.MppAccrueType
- values: START, END, PRORATED

### [enum] Hoteam.InforCenter.ImportExport.Interface.Project.MppResourceType
- values: MATERIAL, WORK, COST

### [enum] Hoteam.InforCenter.ImportExport.Interface.Project.MppRelationType
- values: FINISH_FINISH, FINISH_START, START_FINISH, START_START

### [enum] Hoteam.InforCenter.ImportExport.Interface.Project.MppConstraintType
- values: AsSoonAsPossible, AsLateAsPossible, MustStartOn, MustFinishOn, StartNoEarlierThan, StartNoLaterThan, FinishNoEarlierThan, FinishNoLaterThan

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppTaskFieldType
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppResourceField
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppResourceAssignmentField
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Project.MppTaskField
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ExcelExportData
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ExcelExportDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.CellData
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ExcelExportTemplateDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ExcelExportTemplateDataSource
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.TemplateFoot
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.TemplateCharts
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.TemplateResumePlugin
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.TemplateChart
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.TemplateImage
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ExcelImportDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.CellStyle
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ImportDataExcelModelSheet
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Excel.ImportDataExcelModelRow
- (no public methods)

### [interface] Hoteam.InforCenter.ImportExport.Interface.Excel.IDrawChartPlugin
- `Void DrawChart(SessionPara para, ExcelExportTemplateDataModel tempalte, Object excelWorkbook, Object excelWorksheet, Int32 pageNum, Int32 startRow)`

### [interface] Hoteam.InforCenter.ImportExport.Interface.Excel.IResumeXlsBookPlugin
- `Void ResumeWorkBook(SessionPara para, ExcelExportTemplateDataModel tempalte, Object excelWorkbook)`

### [class] Hoteam.InforCenter.ImportExport.Interface.Base.ExportTemplateBaseDataModel
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Base.ExportWcfPara
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Base.ExportFileResult
- (no public methods)

### [class] Hoteam.InforCenter.ImportExport.Interface.Base.ImportWcfPara
- (no public methods)

## Hoteam.InforCenter.IntegrationERP.Interface.dll

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IDealThirdDBDatePlugin
- ` DealThirdDBDate(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IGetDocDowloadPlugin
- ` GetDocDowload(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntegrationGetErpDataPlugin
- ` IntegrationGetErpData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntegrationPlugin
- ` IntegrationChackData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntegrationSendPlugin
- ` IntegrationSendToERP(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealBomDataPlugin
- ` IntergrationDealBomData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealCreportDataPlugin
- ` IntergrationDealCreportData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealDataFlowAccountPlugin
- ` IntergrationDealDataFlowAccount(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealDocDataPlugin
- ` IntergrationDealDocData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealItemDataPlugin
- ` IntergrationDealItemData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealProcessDataPlugin
- ` IntergrationDealProcessData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationDealRouteDataPlugin
- ` IntergrationDealRouteData(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.IIntergrationReleaseGetDataToSendPlugin
- ` IntergrationReleaseGetDataToSendPlugin(<unresolved>)`

### [interface] Hoteam.InforCenter.IntegrationERP.Interface.ISendComplateDeal
- ` SendComplateDeal(<unresolved>)`

## Hoteam.InforCenter.IntergrationCommunication.Interface.dll

### [interface] Hoteam.InforCenter.IntergrationCommunication.Interface.IEaiCommunicationPlugin
- ` EaiCommunicationSendMessage(<unresolved>)`

## Hoteam.InforCenter.InternalMail.Interface.dll

### [interface] Hoteam.InforCenter.InternalMail.Interface.IInternalMail
- ` SendInternalMail(<unresolved>)`
- ` SendInternalMail(<unresolved>)`
- ` MakeRead(<unresolved>)`

### [class] Hoteam.InforCenter.InternalMail.Interface.InternalMailConst
- (no public methods)

## Hoteam.InforCenter.Interval.Interface.dll

### [interface] Hoteam.InforCenter.Interval.Interface.IClientInterval
- `String Interval(SessionPara para)`

## Hoteam.InforCenter.Issue.Interface.dll

### [interface] Hoteam.InforCenter.Issue.Interface.IssueUtility
- ` GetIssueGridRowForPortal(<unresolved>)`

## Hoteam.InforCenter.ISTF16949.Interface.dll

### [class] Hoteam.InforCenter.ISTF16949.Interface.TFInfoConst
- (no public methods)

## Hoteam.InforCenter.MazyTable.Interface.dll

### [interface] Hoteam.InforCenter.MazyTable.Interface.IMazyTableBusiness
- ` GetMazyTableValue(<unresolved>)`

### [class] Hoteam.InforCenter.MazyTable.Interface.MazyTableConst
- (no public methods)

## Hoteam.InforCenter.MessageQueuing.Interface.dll

### [interface] Hoteam.InforCenter.MessageQueuing.Interface.IMessageQueuing
- `Void SendMessageAync(String topic, String msg)`
- `String GetMessage(String topic)`
- `Void SendObjectMessageAync(String topic, Object msg)`
- `Object GetObjectMessage(String topic)`

## Hoteam.InforCenter.MobilePermission.Interface.dll

### [interface] Hoteam.InforCenter.MobilePermission.Interface.IMobileModulePermission
- ` GetModulePermissionData(<unresolved>)`

## Hoteam.InforCenter.ModelGenerator.Interface.dll

### [interface] Hoteam.InforCenter.ModelGenerator.Interface.IModelData
- ` CopyFormBuilderDataFromObjType(<unresolved>)`

### [interface] Hoteam.InforCenter.ModelGenerator.Interface.IModelPageData
- ` GetFkObjectCountByObjectType(<unresolved>)`
- ` GetControlPermissionByObjType(<unresolved>)`

## Hoteam.InforCenter.ModelGenerator.Utility.dll

### [interface] Hoteam.InforCenter.ModelGenerator.Interface.IModelLayerUpdate
- ` UpdateSqlSchemaByObjType(<unresolved>)`
- ` GeneratorCommandByObjType(<unresolved>)`

## Hoteam.InforCenter.ModulePermission.Interface.dll

### [interface] Hoteam.InforCenter.ModulePermission.Interface.IModulePermission
- ` GetModulePermissionData(<unresolved>)`

### [interface] Hoteam.InforCenter.ModulePermission.Interface.IModulePermissionUtil
- ` GetModulePermission(<unresolved>)`
- ` GetDenyModuleList(<unresolved>)`

### [class] Hoteam.InforCenter.ModulePermission.Interface.ModulePermissionExt
- `Void InitData(List`1 listObj)`
- `Void InitData(List`1 allowList, List`1 denyList)`

### [class] Hoteam.InforCenter.ModulePermission.Interface.PermissionType
- (no public methods)

### [class] Hoteam.InforCenter.ModulePermission.Interface.PermissionValue
- `Void InitData()`
- `Void AddModuleListByType(String type, PermissionObject obj)`

## Hoteam.InforCenter.MSE.Interface.dll

### [interface] Hoteam.InforCenter.MSE.Interface.IDealCopyFactoryObj
- ` DealCopyFactoryObj(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IDealMseAllTreeStructForReport
- ` DealStructData(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IDealMseReportCellValues
- ` DealCellValues(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IDealMseReportConfigProcessCellTree
- ` DealProcessCellTree(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IDealMseReportConfigRpTableInfo
- ` DealRpTableInfo(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IDealMseReportOneAttValue
- ` DealOneAttValue(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IMseReportConfigManager
- `Void addItemPropertyNode(SessionPara para, TreeNodeObject pNode, String Module)`

### [interface] Hoteam.InforCenter.MSE.Interface.IMSEImportDataCheckExtend
- ` ImportDataCheckExtend(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IMSEWebServiceManager
- ` GetProcessesByItemCodes(<unresolved>)`
- ` GetProcessStruct(<unresolved>)`
- ` GetProcessRelation(<unresolved>)`

### [interface] Hoteam.InforCenter.MSE.Interface.IProcessManager
- ` DeleteProcessByItemID(<unresolved>)`
- ` GetProcessModel(<unresolved>)`
- ` GetProcessModelData(<unresolved>)`
- ` GetProcessResourceList(<unresolved>)`
- ` GetProceeRoot(<unresolved>)`
- ` GetChildProcess(<unresolved>)`
- ` DealPCharForCopy(<unresolved>)`
- ` ProcessEditCheck(<unresolved>)`
- ` RecordProcessEditDate(<unresolved>)`
- ` GetMseAllTreeStruct(<unresolved>)`
- ` GetMseAllProcessStruct(<unresolved>)`
- ` GetPreProcessIDWithSameLevel(<unresolved>)`
- `Void DealWithLstStructData(List`1 lst)`
- ` QueryMseConigPermission(<unresolved>)`
- ` GetMSEConfigPermissionListNew(<unresolved>)`
- ` GetMSEByMasterIDs(<unresolved>)`
- ` GetMSEConfigPermissionList(<unresolved>)`
- ` GetProcessLevel(<unresolved>)`
- ` RecordLogger(<unresolved>)`
- ` UpdateItemInfoForNewReports(<unresolved>)`

### [class] Hoteam.InforCenter.MSE.Interface.OCXData
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.InfoData
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.OCXBaseData
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.TextData
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.TextStyle
- (no public methods)

### [interface] Hoteam.InforCenter.MSE.Interface.IProcessRelationManager
- ` GetRelationByCeidAndType(<unresolved>)`

### [class] Hoteam.InforCenter.MSE.Interface.CompareResult
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.ConfigJsonClass
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.ConfigLabel
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.MSELABELItems
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.ProcessJsonClass
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.LinkJsonClass
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.MSESortClass
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.TQLabelClass
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.MSEInfoConst
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.RPTableInfo
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.MseRepAttInfo
- `MseRepAttInfo copy()`

### [class] Hoteam.InforCenter.MSE.Interface.RPTableDataItem
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.MSEConfigResourceBindAtt
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.ProcessComparisonColor
- (no public methods)

### [class] Hoteam.InforCenter.MSE.Interface.StructItem
- (no public methods)

## Hoteam.InforCenter.MSEConfig.Interface.dll

### [interface] Hoteam.InforCenter.MSEConfig.Interface.IMSEConfigManager
- ` GetConfigProcessViews(<unresolved>)`
- ` GetGMConfigProcessViews(<unresolved>)`
- ` GetConfigTypeByPType(<unresolved>)`

### [class] Hoteam.InforCenter.MSEConfig.Interface.MSEConfigInfoConst
- (no public methods)

## Hoteam.InforCenter.MSEParaDesign.Interface.dll

### [class] Hoteam.InforCenter.MSE.Interface.MSEParaDesignInfoConst
- (no public methods)

## Hoteam.InforCenter.MyProject.Interface.dll

### [interface] Hoteam.InforCenter.MyProject.Interface.IMyProjectBusinessUtility
- ` EmendProject(<unresolved>)`
- ` GetProjectListByUserEID(<unresolved>)`
- ` PortalGetProjectListByUserid(<unresolved>)`
- ` GetProjectListByUserEIDCache(<unresolved>)`
- ` GetProjectListByResourceIDs(<unresolved>)`
- ` GetProjectProgressCompChartData(<unresolved>)`
- ` GetProjectProgressChartDataByProjectId(<unresolved>)`
- ` GetProjectStatusGridObject(<unresolved>)`
- ` GetProjectStatusPieData(<unresolved>)`
- ` GetProjectListByObjectId(<unresolved>)`
- ` GetDeliveryPositionByTaskID(<unresolved>)`
- ` GetDeliveryPositionByTaskID(<unresolved>)`
- ` GetAllTaskAndProjectFolderByPlanId(<unresolved>)`
- ` GetProjectStatusPieDataByEps(<unresolved>)`
- ` GetProjectStatusPieDataByProjectId(<unresolved>)`
- ` GetProjectListByEpsId(<unresolved>)`
- ` GetProjectTypeProgress(<unresolved>)`
- ` GetProjectTypePie(<unresolved>)`
- ` GetProjectDepartmentPie(<unresolved>)`
- ` GetProjectEPSPie(<unresolved>)`
- ` GetProjectTypeProgress(<unresolved>)`
- ` GetProjectManager(<unresolved>)`
- ` GetDepartment(<unresolved>)`
- ` GetAttentionProject(<unresolved>)`
- ` GetMyCreateProjectList(<unresolved>)`
- ` GetMyAttentionProjectList(<unresolved>)`
- ` GetMyJoinProjectList(<unresolved>)`
- ` GetPortalMyJoinProjectList(<unresolved>)`
- ` GetProjectById(<unresolved>)`
- ` GetLastestProjectByEUID(<unresolved>)`
- ` GetProjectPlanIDsByUserID(<unresolved>)`
- ` GetProjectProgressInfo(<unresolved>)`
- ` CheckLinkExist(<unresolved>)`
- ` PasteProjectChildObject(<unresolved>)`
- ` GetProjectList(<unresolved>)`
- ` GetProjectList(<unresolved>)`
- `String GetProjectStatus(SessionPara para, BaseObject project, String& statusText)`
- ` UpdateProjectScheduleInfo(<unresolved>)`
- ` CheckDeliveryInPorjectList(<unresolved>)`
- `String GetProjectStatusImg(String statusName)`
- ` GetProjectByFilter(<unresolved>)`
- ` GetProjectStatusChartDataByEps(<unresolved>)`
- ` GetProjectStatusChartDataByEps(<unresolved>)`
- ` GetProjectStatusData(<unresolved>)`
- ` GetProjectLifecycleChartDataByEps(<unresolved>)`
- ` GetProjectLevelChartDataByEps(<unresolved>)`
- ` GetProjectPhaseChartDataByEps(<unresolved>)`
- ` GetProjectMileStoneTitle(<unresolved>)`
- ` GetProjectMileStoneData(<unresolved>)`
- ` GetDelayProjectListByEps(<unresolved>)`
- ` GetDelayProjectListByEps(<unresolved>)`
- ` GetImportantProjectListByEps(<unresolved>)`
- ` GetAllValidProjectList(<unresolved>)`
- ` GetAllProjectListByCache(<unresolved>)`
- ` GetProjectTypeList(<unresolved>)`
- ` GetProjectNameByEuid(<unresolved>)`
- ` GetProjectIdByEuid(<unresolved>)`
- ` GetProjectManagerByEuid(<unresolved>)`
- ` SaveProjectData(<unresolved>)`
- ` GetFinishProjectList(<unresolved>)`
- ` GetProjectSpaceProjectGridData(<unresolved>)`
- ` GetProjectSpaceChildData(<unresolved>)`
- ` GenratorProjectTaskDeliveryFolderByWbs(<unresolved>)`
- ` GetOnePageProjectGridData(<unresolved>)`
- ` GetAllTaskOfProjectPartColumns(<unresolved>)`
- ` GetAllProjectFolderByPlanId(<unresolved>)`
- ` ParameterCommandInsert(<unresolved>)`
- ` ParameterCommandInsert(<unresolved>)`
- ` GetProjectDataByName(<unresolved>)`
- ` ProjectDelInsertCommonLog(<unresolved>)`
- ` UpdateProjectCacheByProjectEuid(<unresolved>)`
- ` GetProjectHoursDays(<unresolved>)`
- ` GetObjectData(<unresolved>)`
- ` CreateProjectAndPlan(<unresolved>)`
- ` GetProjectStatisticInfo(<unresolved>)`

### [class] Hoteam.InforCenter.MyProject.Interface.MyProjectConst
- (no public methods)

### [class] Hoteam.InforCenter.MyProject.Interface.MyProjectConst+Model
- (no public methods)

## Hoteam.InforCenter.Organization.DataLayer.dll

### [class] Hoteam.InforCenter.Organization.DataLayer.Company
- ` SaveObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.Group
- ` DeleteObject(<unresolved>)`
- ` BatchInsertObject(<unresolved>)`
- ` SaveObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.GroupRole
- ` GetRoleName(<unresolved>)`
- ` GetCreateTime(<unresolved>)`
- ` GetGroupRoleName(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.GroupRoleToUser
- (no public methods)

### [enum] Hoteam.InforCenter.Organization.DataLayer.RedisTypeKeyEnum
- values: ORGANIZE, COMPANY, ROLEINFO, ORGANIZATION, PERSON, GROUPROLE, USERINFO, GROUPINFO

### [class] Hoteam.InforCenter.Organization.DataLayer.OrganizationCacheItem
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataLayer.OrganizationCache
- ` GetPersonByID(<unresolved>)`
- ` GetPersonList(<unresolved>)`
- ` GetUserByID(<unresolved>)`
- ` GetUserByCode(<unresolved>)`
- ` GetUserList(<unresolved>)`
- ` GetUserListByGroupEIDAndRole(<unresolved>)`
- ` GetUserListByGroupEID(<unresolved>)`
- ` GetUserListByRoleEID(<unresolved>)`
- ` GetOrganizeList(<unresolved>)`
- ` GetRoleByID(<unresolved>)`
- ` GetRoleList(<unresolved>)`
- ` GetRoleListByUserID(<unresolved>)`
- ` GetGroupByID(<unresolved>)`
- ` GetGroupList(<unresolved>)`
- ` GetOrganizationNodeList(<unresolved>)`
- ` GetOrganizationNodeByType(<unresolved>)`
- ` GetGroupRoles(<unresolved>)`
- ` GetGroupRoleByID(<unresolved>)`
- ` GetGroupRoleByGroupEIDAndRoleEID(<unresolved>)`
- ` GetGroupRoleList(<unresolved>)`
- ` GetCompanys(<unresolved>)`
- ` GetCompanyByID(<unresolved>)`
- ` UpdateCachedObj(<unresolved>)`
- ` DeleteCachedObj(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.OrganizationInit
- `Void Init()`

### [class] Hoteam.InforCenter.Organization.DataLayer.OrganizationUtility
- ` GetPersonByID(<unresolved>)`
- ` GetPersonListFromCache(<unresolved>)`
- ` GetUserByID(<unresolved>)`
- ` GetUserByCode(<unresolved>)`
- ` GetUserListFromCache(<unresolved>)`
- ` GetUserListByGroupEIDAndRoleFromCache(<unresolved>)`
- ` GetUserListByGroupEIDFromCache(<unresolved>)`
- ` GetUserListByGroupRoleEIDFromCache(<unresolved>)`
- ` GetUserListByRoleEIDFromCache(<unresolved>)`
- ` GetUserListByGroupEIDWithRecursion(<unresolved>)`
- ` GetRoleByID(<unresolved>)`
- ` GetRoleListFromCache(<unresolved>)`
- ` GetRoleListByUserIDFromCache(<unresolved>)`
- ` GetGroupByID(<unresolved>)`
- ` GetGroupListFromCache(<unresolved>)`
- ` GetSubGroupListByParentID(<unresolved>)`
- ` GetParentGroupListWithRecursion(<unresolved>)`
- ` GetParentGroupListWithRecursionByUserID(<unresolved>)`
- ` GetSubGroupListByParentIDWithRecursion(<unresolved>)`
- ` GetCompanys(<unresolved>)`
- ` GetCompanyByID(<unresolved>)`
- ` GetCompanyByUserID(<unresolved>)`
- ` GetChildrenOrganizeWithRecursionByID(<unresolved>)`
- ` GetOrganizeByCEID(<unresolved>)`
- ` GetOrganizeByCEID(<unresolved>)`
- ` GetOrganizeList(<unresolved>)`
- ` GetUserToRoleListFromCache(<unresolved>)`
- ` GetOrganizationNodeListFromCache(<unresolved>)`
- ` GetOrganizationNodeByTypeFromCache(<unresolved>)`
- ` GetGroupRoleByIDFromCache(<unresolved>)`
- ` GetGroupRoleByGroupEIDAndRoleEIDFromCache(<unresolved>)`
- ` GetGroupRoleListFromCache(<unresolved>)`
- `String ToKey(String[] values)`
- ` CurrentUserIdContainInIds(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.Organize
- ` CheckeOrganizeExist(<unresolved>)`
- ` SaveObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.Person
- ` SaveObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.Role
- ` SaveObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.DataLayer.User
- ` SaveObject(<unresolved>)`
- ` BatchInsertObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [enum] Hoteam.InforCenter.Organization.DataLayer.RedisSerialization.DeptSortOnSpring
- values: Company, Department, Group

### [class] Hoteam.InforCenter.Organization.DataLayer.RedisSerialization.DeptOnSpring
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataLayer.RedisSerialization.UserOnSpring
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataLayer.RedisSerialization.RoleOnSpring
- (no public methods)

### [class] Hoteam.InforCenter.Organization.DataLayer.RedisSerialization.SpringRedisSerializer
- ` GetObjectFromString(<unresolved>)`
- ` GetStringFromObject(<unresolved>)`

### [interface] Hoteam.InforCenter.Organization.DataLayer.Interface.ITransferObject
- ` TransferObjectAfter(<unresolved>)`

## Hoteam.InforCenter.Organization.GroupInterface.dll

### [interface] Hoteam.InforCenter.Organization.GroupInterface.GroupSpaceInterface
- ` IsExistData(<unresolved>)`

### [class] Hoteam.InforCenter.Organization.GroupInterface.GroupSystemSettingUtility
- ` EnableDataIsolation(<unresolved>)`
- ` EnableGroupSpace(<unresolved>)`
- ` GetIsolationModels(<unresolved>)`
- ` IsIsolationModel(<unresolved>)`

### [interface] Hoteam.InforCenter.Organization.GroupInterface.IDataGroupInterface
- `String GetShareGroupCodeFilterString(SessionPara para, String objTypeName)`
- `String GetShareGroupCodeFilterString(SessionPara para)`
- ` GetShareGroupCodeListByGroupCode(<unresolved>)`
- ` GetShareGroupCodesByGroupCode(<unresolved>)`

### [interface] Hoteam.InforCenter.Organization.GroupInterface.IGroupSystemSetting
- ` EnableDataIsolation(<unresolved>)`
- ` GetIsolationModels(<unresolved>)`
- ` IsIsolationModel(<unresolved>)`

## Hoteam.InforCenter.Organization.GroupRuleInterface.dll

### [interface] Hoteam.InforCenter.Organization.GroupRuleInterface.ISelectObjectShareForObjectPermission
- `Boolean SaveObjectPermission(ObjectPermissionListPara para)`

## Hoteam.InforCenter.PDMInternalMail.Interface.dll

### [interface] Hoteam.InforCenter.PDMInternalMail.Interface.ISystemMailClassification
- `List`1 GetClassifications()`

### [class] Hoteam.InforCenter.PDMInternalMail.Interface.MailClassification
- (no public methods)

## Hoteam.InforCenter.PMTask.Interface.dll

### [interface] Hoteam.InforCenter.PMTask.Interface.IAutoSubmitFinish
- ` IsAutoSubmitFinish(<unresolved>)`

### [interface] Hoteam.InforCenter.PMTask.Interface.IMobilePMTask
- ` EditTask(<unresolved>)`

### [interface] Hoteam.InforCenter.PMTask.Interface.IPMTask
- ` SetStateToPublished(<unresolved>)`
- ` SetStateToInProcess(<unresolved>)`
- ` SetStateToNew(<unresolved>)`
- ` GetCaption(<unresolved>)`
- ` DeleteObject(<unresolved>)`
- ` GetIconByObject(<unresolved>)`

### [interface] Hoteam.InforCenter.PMTask.Interface.ITaskManager
- ` SetStateToPublished(<unresolved>)`
- ` SaveTask(<unresolved>)`

### [interface] Hoteam.InforCenter.PMTask.Interface.ITaskRelationManager
- ` UpdateTaskPercent(<unresolved>)`

### [interface] Hoteam.InforCenter.PMTask.Interface.ITaskStartWorkflow
- ` UpdateStartWorkflowCreateUid(<unresolved>)`

### [class] Hoteam.InforCenter.PMTask.Interface.ProjectWorkflowTypeConst
- (no public methods)

### [class] Hoteam.InforCenter.PMTask.Interface.TaskInfoConst
- (no public methods)

## Hoteam.InforCenter.PositionManager.Interface.dll

### [class] Hoteam.InforCenter.PositionManager.Interface.Class1
- (no public methods)

## Hoteam.InforCenter.ProcessPlanEdit.Interface.dll

### [interface] Hoteam.InforCenter.ProcessPlanEdit.Interface.ProcessPlanEditInterface
- ` IsExclusive(<unresolved>)`
- ` IsExclusiveByAnyUser(<unresolved>)`
- ` CopyOtherInfosAndFontStyle(<unresolved>)`

## Hoteam.InforCenter.ProcessPlanTemplate.Inteface.dll

### [interface] Hoteam.InforCenter.ProcessPlanTemplate.Inteface.IProcessPlanTemplate
- ` GetTemplateAllData(<unresolved>)`
- ` GetAboutTemplateList(<unresolved>)`
- ` GetCardTemplateByProcessTemplateID(<unresolved>)`
- ` GetTempaltesByConfigViewID(<unresolved>)`

### [interface] Hoteam.InforCenter.ProcessPlanTemplate.Inteface.ITemplateForOcx
- ` GetTemplateDataForOcx(<unresolved>)`
- ` GetCardGroupDataForOcx(<unresolved>)`
- ` GetCardInfoDataForOcx(<unresolved>)`
- ` SaveProcessModelData(<unresolved>)`

### [class] Hoteam.InforCenter.ProcessPlanTemplate.Inteface.ProcessPlanConstInfo
- (no public methods)

## Hoteam.InforCenter.ProcessRoute.Interface.dll

### [interface] Hoteam.InforCenter.ProcessRoute.Interface.IProcessRouteExtensionInterface
- ` ProcessingExtensionData(<unresolved>)`
- ` ProcessGetRouteData(<unresolved>)`
- ` ApiGetProcessRoute(<unresolved>)`

### [interface] Hoteam.InforCenter.ProcessRoute.Interface.IProcessRouteInterface
- ` EmendItemCopyRelation(<unresolved>)`
- ` PositionUnitDeleteCheck(<unresolved>)`

### [class] Hoteam.InforCenter.ProcessRoute.Interface.ProcessRouteInfoConst
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.RouteLineRelationItem
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.ItemPath
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.RouteLineData
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.QueryMachineModel
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.ProcessRouteInfoConst+SaveRouteClass
- (no public methods)

### [class] Hoteam.InforCenter.ProcessRoute.Interface.ProcessRouteInfoConst+SaveRouteGetBomClass
- (no public methods)

## Hoteam.InforCenter.ProjectBaseLine.Interface.dll

### [interface] Hoteam.InforCenter.ProjectBaseLine.Interface.IProjectBaseLineUtility
- ` CompareTwoBlTaskDetail(<unresolved>)`
- ` AutoCreateBaseLine(<unresolved>)`
- ` GetBLTaskListByBaseLine(<unresolved>)`
- ` DeleteProjectBaseLine(<unresolved>)`

## Hoteam.InforCenter.ProjectCost.Interface.dll

### [class] Hoteam.InforCenter.ProjectCost.Interface.CellData
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CellStyle
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostPageData
- `Void AddRow(CostRowData row)`

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostRowData
- `Object GetData()`
- `CellData SetData(String colName, String text, String value)`
- `Boolean ContainColumn(String colName)`
- `CellData GetCellData(String colName)`

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostStructDataRet
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostStructStyle
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostStructData
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostTitleData
- `Void AddColData(CostColumnData colData)`

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostColumnData
- (no public methods)

### [class] Hoteam.InforCenter.ProjectCost.Interface.CostTreeNodeIcon
- (no public methods)

### [interface] Hoteam.InforCenter.ProjectCost.Interface.IProjectCostMakeUtility
- ` CreateProjectCostFromProjectCostTemplate(<unresolved>)`
- ` DeleteProjectCostByProjectEUID(<unresolved>)`

## Hoteam.InforCenter.ProjectEps.Interface.dll

### [interface] Hoteam.InforCenter.ProjectEps.Interface.IProjectEpsBusinessUtility
- ` GetPermissionEpsProjectData(<unresolved>)`
- ` GetPermissionEpsProjectDataWithProjectID(<unresolved>)`
- ` GetPermissionEpsProjectDataWithResult(<unresolved>)`
- ` GetPermissionEpsProjectData(<unresolved>)`
- ` GetPermissionEPSProject(<unresolved>)`
- ` GetMyPessionProjectEps(<unresolved>)`
- ` GetPermissionEPSProjectByProjectState(<unresolved>)`
- ` OldGetPermissionEPSProjectByProjectState(<unresolved>)`
- ` GetPermissionEPSProjectByFilterString(<unresolved>)`
- ` CheckEpsEditPermission(<unresolved>)`
- ` GetEPSByEIDCache(<unresolved>)`

### [class] Hoteam.InforCenter.ProjectEps.Interface.Parameter.EpsProjectData
- (no public methods)

## Hoteam.InforCenter.ProjectFolderTemplate.Interface.dll

### [interface] Hoteam.InforCenter.ProjectFolderTemplate.Interface.IProjectFolderTemplateUtility
- ` AddFolderStructFromProjectFolderTemplate(<unresolved>)`
- ` AddObjectToProjectFolderTemplate(<unresolved>)`
- ` AddObjectToProjectFolderTemplateMulti(<unresolved>)`
- ` AddObjectToProjectFolderTemplateMultiNoMgs(<unresolved>)`

## Hoteam.InforCenter.ProjectPlan.Interface.dll

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.ICustomImportPlan
- ` CheckAndImportExtendColumn(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.ICustomWbsColumns
- ` GetWbsColumns(<unresolved>)`
- ` GetWbsTemplateColumns(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.ICustomWbsDatasourceManager
- ` GetExtendWbsDatasource(<unresolved>)`
- ` GetExtendWbsTemplateDatasource(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.ICustomWbsSave
- ` CheckBeforeSave(<unresolved>)`
- ` ChangeAfterSave(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.ICustomWbsSettings
- ` GetWbsSettings(<unresolved>)`
- ` GetWbsTemplateSettings(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.IProjectCalendar
- `Boolean IsWorkDay(SessionPara para, DateTime dateTime)`
- ` IsWorkDay(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectPlan.Interface.IProjectPlanBusinessUtility
- ` AddRootTaskWhenCreateProject(<unresolved>)`
- ` AddRootTaskWhenCreateProject(<unresolved>)`
- ` GetDBMaxPlanNumber(<unresolved>)`
- ` SetProjectBeginAndEndTime(<unresolved>)`
- ` UpdateProjectTime(<unresolved>)`
- `String GetPredecessorTaskType(Int32 typeNumber)`
- ` CopyProjectCalendar(<unresolved>)`
- ` AddProjectCalendar(<unresolved>)`
- ` DeletePlanByProjectID(<unresolved>)`
- ` CheckProjectBeginAndEndDate(<unresolved>)`
- `String GetProjectIdByTaskId(String taskid, SessionPara para)`
- ` GetProjectIdByTaskIdUseTrans(<unresolved>)`
- ` GetTaskOutputName(<unresolved>)`
- ` GetTaskOutputName(<unresolved>)`
- ` GetTaskOutputName(<unresolved>)`
- ` GetTaskOutputName(<unresolved>)`
- ` GetTaskOutputName(<unresolved>)`
- ` UpdateProjectProgress(<unresolved>)`
- ` UpdateProjectProgress(<unresolved>)`
- ` ExecProjectPlanPublish(<unresolved>)`
- ` SetPlanState(<unresolved>)`
- ` SetProjectState(<unresolved>)`
- ` UpdateTaskState(<unresolved>)`
- ` GetProjectTimeCalculateResult(<unresolved>)`
- ` GetProjectIdByTaskId(<unresolved>)`
- `String GetProjectIdByTaskId(ProjectPara para, String taskid)`
- ` ProjectPlanImportCalculation(<unresolved>)`
- `Void RollbackWorkflowStateAndAttachState(SessionPara para, String flowid, String flowname, String exMessage, String exStackTrace, String exSource)`
- ` ProjectPlanPulishFailTest(<unresolved>)`
- ` GetWorkflowAttachObjects(<unresolved>)`
- ` GetStartAndEndTimeByDate(<unresolved>)`
- ` GetNextWorkday(<unresolved>)`
- ` CheckTaskData(<unresolved>)`
- ` GetPlan(<unresolved>)`

## Hoteam.InforCenter.ProjectTask.Interface.dll

### [class] ProjectTaskConst
- (no public methods)

### [interface] Hoteam.InforCenter.ProjectTask.Interface.ICommitTask
- ` TaskCommit(<unresolved>)`
- ` CheckCommitTask(<unresolved>)`
- ` GetAfterTaskID(<unresolved>)`
- ` CheckAndCommitTask(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.ICustomUpdateTaskPercent
- ` UpdateTaskPercent(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.IExtendsValue
- ` SetExtendsValue(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.IMobileProjectTaskBusiness
- ` GetReferenceTaskData(<unresolved>)`
- ` GetTaskObjectState(<unresolved>)`
- ` GetSubTaskList(<unresolved>)`
- ` GetPMTaskAttachObject(<unresolved>)`
- ` GetReferenceTaskData2(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.IProjectTaskBusinessUtility
- ` GetProjectPlanLinkByProject(<unresolved>)`
- ` GetProjectPlanEIDByProject(<unresolved>)`
- ` GetPMTaskByPlanEID(<unresolved>)`
- ` GetPMTaskLinkByPlanEID(<unresolved>)`
- ` GetTaskResourceByPlanEID(<unresolved>)`
- ` CheckResourceUsed(<unresolved>)`
- ` GetProjectAllHoursChart(<unresolved>)`
- ` ProjectTeamMemberHoursChars(<unresolved>)`
- ` GetProjectKeyTaskList(<unresolved>)`
- ` GetProjectKeyTaskChart(<unresolved>)`
- ` GetProjectMileStoneStatusPie(<unresolved>)`
- ` GetTaskProcessChartData(<unresolved>)`
- ` GetBaseLineTaskByProjectEID(<unresolved>)`
- ` GetBaseLineTaskByProjectEID(<unresolved>)`
- ` GetBaseLineTaskByProjectEID(<unresolved>)`
- ` UpdateTaskProjectID(<unresolved>)`
- ` CopyProjectTask(<unresolved>)`
- ` CopyProjectTask(<unresolved>)`
- ` PublishProjectPlan(<unresolved>)`
- ` PublishTaskPlan(<unresolved>)`
- ` GetProjectIDListByPlanID(<unresolved>)`
- ` GetProjectByProjectIDs(<unresolved>)`
- ` GetWeekTaskByProjectID(<unresolved>)`
- ` GetProjectTeamHoursChart(<unresolved>)`
- ` GetTeamPerformGridData(<unresolved>)`
- ` GetMileStoneTaskGridData(<unresolved>)`
- ` GetMemberExctingGridData(<unresolved>)`
- ` GetProjectTeamHoursChart(<unresolved>)`
- ` GetValidProjectByTaskID(<unresolved>)`
- ` GetDelayTaskByProjectID(<unresolved>)`
- ` GetResourceLoadData(<unresolved>)`
- ` TransferProjectManager(<unresolved>)`
- ` GetProjectListHoursChart(<unresolved>)`
- ` GetProjectResourceHoursChart(<unresolved>)`
- ` GetProjectHoursChart(<unresolved>)`
- ` GetProjectDelayTaskPerent(<unresolved>)`
- ` GetTaskStatus(<unresolved>)`
- ` GetTaskStatus(<unresolved>)`
- ` GetPublishedProjectID(<unresolved>)`
- ` GetPublishedOrLatestProjectID(<unresolved>)`
- ` GetTaskByFilter(<unresolved>)`
- ` SetTaskStatusAndICONFromOtherModule(<unresolved>)`
- ` CheckBeforceTask(<unresolved>)`
- ` CheckBeforeTask(<unresolved>)`
- ` CheckBeforceTask(<unresolved>)`
- ` CheckReceivePara(<unresolved>)`
- ` SyncUpdateProjectPercentWhenUpdateTaskPercent(<unresolved>)`
- ` GetProjectTeamWorktime(<unresolved>)`
- ` GetProjectSumWorktime(<unresolved>)`
- ` GetTaskSumWorktime(<unresolved>)`
- ` GetMinutesPerDay(<unresolved>)`
- ` CheckTaskDocExist(<unresolved>)`
- ` IGetTaskStatusImage(<unresolved>)`
- ` UpdateWorkSpaceDeliAndIn(<unresolved>)`
- `GridObject GetCostTaskGridData(OnePageGridDataPara para)`
- ` ISetTaskStatusAndICON(<unresolved>)`
- ` GeTaskStatisticInfo(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.IProjectTaskTree
- ` EditTask(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.IReceiveTaskSort
- ` SortTask(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.ISupportAlterPlan
- ` EmendPlan(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.ITaskAddWork
- ` GetTaskAddWorktimeEditList(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTask.Interface.ITaskStatusUtility
- ` GetTaskStatus(<unresolved>)`
- ` GetTaskStatus(<unresolved>)`
- `String GetTaskStatusImg(String statusName)`

### [class] Hoteam.InforCenter.ProjectTask.Interface.BaseLineCompare.BLTask
- (no public methods)

### [class] Hoteam.InforCenter.ProjectTask.Interface.BaseLineCompare.BLBaseLine
- (no public methods)

### [class] Hoteam.InforCenter.ProjectTask.Interface.BaseLineCompare.BLPredecessorLink
- (no public methods)

### [enum] Hoteam.InforCenter.ProjectTask.Interface.BaseLineCompare.TaskLinkType
- values: SS, SF, FF, FS

### [class] ProjectTaskConst+Model
- (no public methods)

### [class] ProjectTaskConst+PMTASK
- (no public methods)

## Hoteam.InforCenter.ProjectTeam.Interface.dll

### [interface] Hoteam.InforCenter.ProjectTeam.Interface.ICustomSaveProjectResource
- ` SaveProjectResource(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectTeam.Interface.IProjectTeamUtility
- ` GetProjectTeamByProjectEID(<unresolved>)`
- ` CopyProjectResource(<unresolved>)`
- ` CheckUsedByProjectResource(<unresolved>)`
- ` CheckProjectAdminExist(<unresolved>)`
- ` SaveProjectResource(<unresolved>)`
- ` CheckTemplateExistTeam(<unresolved>)`
- ` ClearTemplateTaskRoleOfDiffRole(<unresolved>)`
- ` AutoAddTemplateTeamFromTaskRes(<unresolved>)`

## Hoteam.InforCenter.ProjectTemplate.Interface.dll

### [interface] Hoteam.InforCenter.ProjectTemplate.Interface.IProjectTemplateUtility
- ` AddProjectTaskStructFromProjectTaskTemplate(<unresolved>)`
- ` GetTaskTempalteDeliveryData(<unresolved>)`

## Hoteam.InforCenter.ProjectWorkflow.Interface.dll

### [interface] Hoteam.InforCenter.ProjectWorkflow.Interface.IProjectManager
- ` GetProjectManager(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectWorkflow.Interface.IProjectPlanChangePublishBusiness
- `Void Exec(Object nodeengine)`
- `String GetWorkflowAttachObjectids(List`1 workflowAttachList)`

### [interface] Hoteam.InforCenter.ProjectWorkflow.Interface.IProjectPlanPublish
- ` AfterPublishPlan(<unresolved>)`

### [interface] Hoteam.InforCenter.ProjectWorkflow.Interface.IProjectStartWorkflowBusiness
- ` StartWorkflowWithoutPage(<unresolved>)`
- ` StartWorkflowWithoutPage(<unresolved>)`
- ` GetWorkflowTemplateInfo(<unresolved>)`
- ` CheckTemplateBeforeStart(<unresolved>)`

### [class] Hoteam.InforCenter.ProjectWorkflow.Interface.ProjectWorkflowTypeConst
- (no public methods)

## Hoteam.InforCenter.PSEBom.Interface.dll

### [class] Hoteam.InforCenter.PSEBom.Interface.BomLineRelationItem
- ` GetDisplayValue(<unresolved>)`
- `Object GetDBValue(String name)`

### [interface] Hoteam.InforCenter.PSEBom.Interface.IBomSetRowDataPlugin
- ` SetRowData(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEBom.Interface.IImportBomManager
- ` CheckInItemForCAD(<unresolved>)`
- ` BatchImportForCAD(<unresolved>)`
- ` GetItemsInfoByCodes(<unresolved>)`
- ` GetItemBomCompare(<unresolved>)`
- ` GetItemIconPath(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEBom.Interface.IImportBomManagerPlugin
- ` BomExcelCheackData(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEBom.Interface.IPSEBomLine
- (no public methods)

### [interface] Hoteam.InforCenter.PSEBom.Interface.IPSEBomManager
- ` GetPseBomData(<unresolved>)`
- ` GetPseEditBom(<unresolved>)`
- ` GetAllItemBomData(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEBom.Interface.IPSEBomUtility
- ` GetPSEBomItemChilds(<unresolved>)`
- ` GetPSEBomItemDs(<unresolved>)`
- ` GetPSEBomItemDs(<unresolved>)`
- ` GetPSEBaseLineBomItemDs(<unresolved>)`
- ` GetPSEBomItemDsNoIsolate(<unresolved>)`
- ` GetCADPSEBomItemDs(<unresolved>)`
- `Void ResetLPath(String lpath, Int32 level, String pn, BomLineRelationItem pitem, List`1 lstAll)`
- `Void ResetLPath(String lpath, String pn, BomLineRelationItem pitem, Dictionary`2 lstAll)`
- ` CheckBomLoop(<unresolved>)`
- ` GetChildLink(<unresolved>)`
- ` IsMultipleMajorBom(<unresolved>)`

### [class] Hoteam.InforCenter.PSEBom.Interface.PSEBomConst
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMOnePageData
- `Void AddRow(BOMRowData row)`

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMRowData
- `Object GetData()`
- `CellData SetData(String colName, String text, String value)`
- `Boolean ContainColumn(String colName)`
- `CellData GetCellData(String colName)`

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMStructDataRet
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMStructData
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMTitleData
- `Void AddColData(BOMColumnData colData)`

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BOMColumnData
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.BomTreeNodeIcon
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.CellData
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.NewPseBom.CellStyle
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.InputCappBom.InputBOMStructDataRet
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.InputCappBom.InputBOMStructStyle
- (no public methods)

### [class] Hoteam.InforCenter.PSEBom.Interface.InputCappBom.InputBOMStructData
- (no public methods)

## Hoteam.InforCenter.PSEItem.Interface.dll

### [interface] Hoteam.InforCenter.PSEItem.Interface.IImportItemManagerPlugin
- ` ItemExcelCheackData(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IImportItemMergePropertiesDicPlugin
- ` ImportItemMergePropertiesbydic(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IImportItemMergePropertiesPlugin
- ` ImportItemMergeProperties(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IImportItemTemplateConfigPlugin
- ` GetImportItemTemplateId(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemUtility
- ` GetItemInfoByIDs(<unresolved>)`
- ` GetCheckItemInfoByIDs(<unresolved>)`
- ` GetItemAndFormByCodes(<unresolved>)`
- ` GetItemAndFormByCodes(<unresolved>)`
- ` GetItemAndFormByEuids(<unresolved>)`
- ` GetItemAndFormByCodes(<unresolved>)`
- ` GetItemViewByIDs(<unresolved>)`
- ` GetItemByCode(<unresolved>)`
- ` GetItemByCode(<unresolved>)`
- ` GetItemByMasterID(<unresolved>)`
- ` GetItemByMasterIDs(<unresolved>)`
- ` GetItemByMasterIDs(<unresolved>)`
- ` GetItemByCodeAndVersion(<unresolved>)`
- `String GetItemIcon(String itemType)`
- ` GetPreVersionItems(<unresolved>)`
- ` GetMasterIDByCode(<unresolved>)`
- ` GetDefaultItems(<unresolved>)`
- ` GetItemByItemIDAndFormType(<unresolved>)`
- ` GetItemByCodesAndFormType(<unresolved>)`
- ` GetItemsInfoByCodes(<unresolved>)`
- ` IsXljSwitchOpen(<unresolved>)`
- ` GetItemDataById(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemFormManager
- (no public methods)

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemManager
- ` EmendNewItem(<unresolved>)`
- ` EmendNewItemForDoc(<unresolved>)`
- ` EmendNewItem(<unresolved>)`
- ` ImportCreateItem(<unresolved>)`
- ` CreateItemViewNoSave(<unresolved>)`
- ` UpdateExistItem(<unresolved>)`
- ` ImportCreateItemAndAttr(<unresolved>)`
- ` UpdateExistItemAndAttr(<unresolved>)`
- ` CreateOrSaveTempTooling(<unresolved>)`
- ` CreateItemAccordingTempTooling(<unresolved>)`
- ` CopyAndResetItemProperty(<unresolved>)`
- ` GetItemCaptionWithOutFormType(<unresolved>)`
- ` QueryItemInfo(<unresolved>)`
- ` QueryItemInfo(<unresolved>)`
- ` GetXljItems(<unresolved>)`
- ` getXljIdBySlid(<unresolved>)`
- ` AddMergeProperties(<unresolved>)`
- ` TargetFieldDeduplication(<unresolved>)`
- ` TargetFieldDeduplication(<unresolved>)`
- ` CheckInItem(<unresolved>)`
- ` CheckOutItem(<unresolved>)`
- ` UpdateMegreCommomProperty(<unresolved>)`
- ` AddMergeProperties(<unresolved>)`
- ` GetCappItemByPseItemID(<unresolved>)`
- ` GetPseItemByCappItemID(<unresolved>)`
- ` CheckItemRulesRepeatForCad(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemMergePropertiesPlugin
- ` ItemMergeProperties(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemRelationManager
- ` GetStandardDocRelationByPEID(<unresolved>)`
- ` GetMainModelsByItemID(<unresolved>)`
- ` GetStandardDocByItemID(<unresolved>)`
- ` DeletePseItemRelation(<unresolved>)`
- ` GetReportObjectByPEID(<unresolved>)`
- ` GetItemAndMainModelType(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemStageUtility
- `String CheckItemStage(SessionPara para, PLMObject fitem, IEnumerable`1 addItem)`
- `List`1 CheckItemStage(SessionPara para, PLMObject fitem, IEnumerable`1 addItem, String& mess)`
- `Boolean IsEnableRule(String stageName, String stageStatus, String ruleName)`
- ` CheckItemEmend(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemTargetDeduplicationPlugin
- ` TargetDeduplication(<unresolved>)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemUsingStatusUtility
- `String CheckChildUsingStatus(SessionPara para, List`1 lstAddItem)`
- `List`1 CheckChildUsingStatus(SessionPara para, List`1 lstAddItem, String& mess)`

### [interface] Hoteam.InforCenter.PSEItem.Interface.IItemViewManager
- ` GetDefaultItemViewByItemID(<unresolved>)`
- ` CreateItemView(<unresolved>)`
- ` NewItemView(<unresolved>)`
- `String GetFormTypeByViewType(SessionPara para, String viewType)`
- `Int32 GetViewTypePriority(String viewType)`
- `String GetViewTypeByFormType(String formType)`
- ` GetItemViewByItemID(<unresolved>)`
- ` GetItemViewByItemID(<unresolved>)`
- ` GetItemAndViewByViewID(<unresolved>)`
- ` GetItemAndViewEnable(<unresolved>)`
- ` GetViewTypeByCode(<unresolved>)`
- ` GetViewTypeByEuid(<unresolved>)`

### [class] Hoteam.InforCenter.PSEItem.Interface.PseItemInfoConst
- (no public methods)

## Hoteam.InforCenter.PseValidity.Interface.dll

### [class] Hoteam.InforCenter.PseValidity.Interface.PseValidityConst
- (no public methods)

## Hoteam.InforCenter.QProblem.Interface.dll

### [interface] Hoteam.InforCenter.QProblem.Interface.IQProblemRelationByTypePlugin
- ` GetListRelationByType(<unresolved>)`

### [class] Hoteam.InforCenter.QProblem.Interface.QProblemInfoConst
- (no public methods)

## Hoteam.InforCenter.QProblemLibrary.Interface.dll

### [class] Hoteam.InforCenter.QProblemLibrary.Interface.Class1
- (no public methods)

## Hoteam.InforCenter.Registered.Interface.dll

### [interface] Hoteam.InforCenter.Registered.Interface.IRegistered
- `Boolean InternalRegistratedByCompanyName(String companyName, String systempassword)`

## Hoteam.InforCenter.RegisteredCompanyLink.Interface.dll

### [interface] Hoteam.InforCenter.RegisteredCompanyLink.Interface.IModelDataCompanyInfo
- `BaseObject GetModelDataByName(SessionPara para, String modelName)`
- `BaseObject GetRelationCompanyObjectByModelName(SessionPara para, String modelName)`
- `String GetMasterDatabaseName()`

### [interface] Hoteam.InforCenter.RegisteredCompanyLink.Interface.IRegisteredCompanyLinkUtil
- ` GenerateExtendModel(<unresolved>)`
- ` GenerateCopyModel(<unresolved>)`
- `String GetExtendModelName(SessionPara para, String yiCompanyID, String jiaCompanyID, String modelName)`
- `String GetExtendModelName(SessionPara para, BaseObject yiCompany, BaseObject jiaCompany, String modelName)`
- `String GetCopyModelNameByCompanyID(SessionPara para, String companyID, String modelName)`
- `String GetCopyModelNameByCompanyObj(SessionPara para, BaseObject company, String modelName)`
- ` InsertCompanyDataByFilter(<unresolved>)`
- ` UpdateCompanyData(<unresolved>)`

### [enum] Hoteam.InforCenter.RegisteredCompanyLink.Interface.SendDataDirection
- values: YiToJia, JiaToYi

### [interface] Hoteam.InforCenter.RegisteredCompanyLink.Interface.IRegisteredExtendUtil
- ` RegisteredExtendUtil(<unresolved>)`
- ` UpdateExtendModelDataBaseSchema(<unresolved>)`

## Hoteam.InforCenter.Resource.Interface.dll

### [interface] Hoteam.InforCenter.Resource.Interface.IResourceBusinessUtility
- ` GetResouceByUserID(<unresolved>)`
- ` NewGetResouceByUserID(<unresolved>)`
- ` GetResouceByUserIDCache(<unresolved>)`
- ` GetResouceByUserIDCache(<unresolved>)`
- ` GetResourceByEIDCache(<unresolved>)`
- ` GetResourceByEIDCache(<unresolved>)`
- ` GetResouceListByUserID(<unresolved>)`

### [interface] Hoteam.InforCenter.Resource.Interface.IResourceCache
- ` IGetResourceList(<unresolved>)`

### [class] Hoteam.InforCenter.Resource.Interface.UserGroupRoleInfo
- (no public methods)

## Hoteam.InforCenter.Risk.Interface.dll

### [interface] Hoteam.InforCenter.Risk.Interface.IRisk
- ` UpdateRiskToIssue(<unresolved>)`

### [class] Hoteam.InforCenter.Risk.Interface.RiskConstInfo
- (no public methods)

## Hoteam.InforCenter.Rule.Interface.dll

### [interface] Hoteam.InforCenter.Rule.Interface.IActionInPermissionCheck
- `Void ExecuteWhenPermissionCheckError(ExecuteWhenPermissionCheckPara checkPara)`
- `Void ExecuteWhenPermissionCheckSuccess(ExecuteWhenPermissionCheckPara checkPara)`

### [interface] Hoteam.InforCenter.Rule.Interface.IActionRulePermissionUtil
- ` GetActionRuleMessageUserList(<unresolved>)`
- ` CheckActionRulePermission(<unresolved>)`
- ` CheckObjectTypePermission(<unresolved>)`
- ` CheckEntitiesPermission(<unresolved>)`
- ` CheckLinksPermission(<unresolved>)`
- `Void CheckCompanyRule(SessionPara session, BaseObject obj, String action, String actioncheckerUseBy)`
- `Void CheckSecurity(SessionPara session, BaseObject obj)`
- ` RemoveObjectPermissionCacheByEntityIDs(<unresolved>)`
- ` RemoveObjectPermissionCacheByObjID(<unresolved>)`
- ` CheckDataIsolation(<unresolved>)`
- ` CheckEntitiesPermissionForActionChecker(<unresolved>)`

### [class] Hoteam.InforCenter.Rule.Interface.ExecuteWhenPermissionCheckPara
- (no public methods)

### [class] Hoteam.InforCenter.Rule.Business.Exceptions.DataIsolationException
- (no public methods)

## Hoteam.InforCenter.SuOrganize.Interface.dll

### [class] Hoteam.InforCenter.SuOrganize.Interface.Class1
- (no public methods)

## Hoteam.InforCenter.SystemSettings.Interface.dll

### [interface] Hoteam.InforCenter.SystemSettings.Interface.ISystemSettingUtility
- ` GetSettingsValueByName(<unresolved>)`

## Hoteam.InforCenter.ThreeManagement.Interface.dll

### [interface] Hoteam.InforCenter.ThreeManagement.Interface.IThreeManagement
- ` GetObjectSecurityLevel(<unresolved>)`
- ` CheckObjectSecurity(<unresolved>)`
- ` GetHighSecurityShow(<unresolved>)`

### [class] Hoteam.InforCenter.ThreeManagement.Interface.ThreeManagementConst
- (no public methods)

## Hoteam.InforCenter.ThreeRoleAuthPlatform.Interface.dll

### [class] Hoteam.InforCenter.ThreeRoleAuthPlatform.Interface.SecurityCodeHelper
- `String DealSecurityCode(SessionPara session, String value)`

## Hoteam.InforCenter.TimeQuota.Interface.dll

### [class] Hoteam.InforCenter.TIMEQUOTA.Interface.StructItem
- (no public methods)

### [interface] Hoteam.InforCenter.TimeQuota.Interface.IWorkingHourQuota
- ` EmendTimeQuota(<unresolved>)`
- ` CopyTimeQuotaByProcess(<unresolved>)`

### [class] Hoteam.InforCenter.TimeQuota.Interface.TimeQuotaInfoConst
- (no public methods)

## Hoteam.InforCenter.Tooling.Interface.dll

### [class] Hoteam.InforCenter.Tooling.Interface.ApplyInfoConst
- (no public methods)

### [interface] Hoteam.InforCenter.Tooling.Interface.IApplyRelationManager
- ` SaveRelation(<unresolved>)`
- ` GetRelationObject(<unresolved>)`
- ` GetRelationApplyInfoByLinkType(<unresolved>)`
- ` ClosedCycle(<unresolved>)`

### [interface] Hoteam.InforCenter.Tooling.Interface.IToolingApplyUtility
- ` SaveApplyObject(<unresolved>)`
- ` GetTempToolingInfo(<unresolved>)`

### [class] Hoteam.InforCenter.Tooling.Interface.RelationConst
- (no public methods)

## Hoteam.InforCenter.TSManagement.Interface.dll

## Hoteam.InforCenter.TSManagementNew.Interface.dll

## Hoteam.InforCenter.WebStudio.View.Interface.dll

### [interface] Hoteam.InforCenter.WebStudio.View.Interface.IModelListViewInfo
- ` CreateModelWebView(<unresolved>)`
- ` CreateUnionModelWebView(<unresolved>)`

## Hoteam.InforCenter.WorkFlowExtend.Interface.dll

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IAnnexExtendProperty
- ` AnnexExtendPropertySaveObject(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.ICheckAttachBeforeCreateFlowFinish
- ` Check(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IGetWorkFlowChildListDataPlugin
- ` GetWorkFlowChildListData(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IGetWorkFlowListOrderValuePlugn
- `String GetWorkFlowChildListOrderColValue(GridRowObject Gridobject)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IPLMWorkflowPlugn
- ` PLMStartWorkflowCheck(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IReNameWorkflowPlugin
- ` ReNameWorkflow(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.ISendMailAfterWorkflow
- `Void SendMailAfterWorkflow(BaseObject workflowObj, EndNodeEngine engine, List`1 reciverUsers)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IStartWorkflow
- ` PlmStartWorkflow(<unresolved>)`
- ` GetNewWorkFlowCode(<unresolved>)`
- ` SaveWorkFlowCode(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IWorkflowBussiness
- ` GetSignParentDepartNameByGroupID(<unresolved>)`
- ` StartWorkCheckAttach(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IWorkFlowChild
- ` GetObjectChild(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkFlowExtend.Interface.IWorkflowInformItem
- `List`1 GetExecActors(Object endNodeEngine)`

## Hoteam.InforCenter.WorkReport.Interface.dll

### [interface] Hoteam.InforCenter.WorkReport.Interface.IMobileWorkReportUtil
- ` GetDailyWorkLogType(<unresolved>)`
- ` GetDailyMyWorkReportList(<unresolved>)`
- ` GetProjectList(<unresolved>)`
- ` SaveDailyWorkLog(<unresolved>)`
- ` GetDefaultAuditor(<unresolved>)`
- ` GetOnePageWorkLogListByTaskEUID(<unresolved>)`
- ` GetAuditWorkLogList(<unresolved>)`
- ` GetWorkLogInfoByID(<unresolved>)`
- ` GetDailyWorkReportRemarkList(<unresolved>)`
- ` AddWorkLogRemark(<unresolved>)`
- ` DeleteWorkLogRemark(<unresolved>)`
- ` AuditWorklog(<unresolved>)`

### [class] Hoteam.InforCenter.WorkReport.Interface.RetOptionState
- (no public methods)

### [class] Hoteam.InforCenter.WorkReport.Interface.RetWorkReportList
- (no public methods)

### [class] Hoteam.InforCenter.WorkReport.Interface.RetWorkReportRow
- (no public methods)

### [class] Hoteam.InforCenter.WorkReport.Interface.RetWorkReportCol
- (no public methods)

### [class] Hoteam.InforCenter.WorkReport.Interface.RetKvpItem
- (no public methods)

### [class] Hoteam.InforCenter.WorkReport.Interface.RetTreeNodeItem
- (no public methods)

### [interface] Hoteam.InforCenter.WorkReport.Interface.IWorkLogAuditor
- ` TaskAuditor(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkReport.Interface.IWorkLogAuditorNew
- ` TaskAuditor(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkReport.Interface.IWorkReportUtility
- ` GetWorkLogListByTaskEUID(<unresolved>)`
- ` GetWorkLogListByProjectEUId(<unresolved>)`
- ` GetWorkLogByTaskID(<unresolved>)`
- ` GetAllWorkLogByTaskID(<unresolved>)`
- ` IsMainResource(<unresolved>)`
- ` GetTemplateWorkLogByProjectEUID(<unresolved>)`
- ` GetLogStatisticInfo(<unresolved>)`

## Hoteam.InforCenter.WorkSpace.Interface.dll

### [interface] Hoteam.InforCenter.WorkSpace.Interface.IWorkSpaceDelete
- ` CheckDeleteObject(<unresolved>)`
- ` DeleteObject(<unresolved>)`

### [interface] Hoteam.InforCenter.WorkSpace.Interface.IWorkSpaceManager
- ` GetDefaultCreatePosition(<unresolved>)`
- ` GeneratorCreatePosition(<unresolved>)`
- ` ChangePosition(<unresolved>)`
- ` GetWorkSpacePath(<unresolved>)`

### [class] Hoteam.InforCenter.WorkSpace.Interface.WorkSpaceConst
- (no public methods)

## Hoteam.InforCenter.WorkSpaceNew.Interface.dll


