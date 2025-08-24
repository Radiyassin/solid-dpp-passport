// Export all services for easier imports
export { SolidAuthService } from './solidAuth';
export { SolidStorageService } from './solidStorage';
export { DataSpaceService } from './dataSpaceService';
export { AssetService } from './assetService';
export { WorkspaceService } from './workspaceService';
export { WACService } from './wacService';
export { AuditService } from './auditService';

// Export types
export type { DPPFile } from './solidStorage';
export type { 
  DataSpace, 
  DataSpaceMember, 
  DataSpaceRole,
  CreateDataSpaceInput,
  AddMetadataInput,
  DataSpaceMetadata 
} from './dataSpaceService';
export type { 
  Asset, 
  AssetMetadata, 
  CreateAssetInput, 
  AddAssetMetadataInput 
} from './assetService';
export type { UserWorkspace } from './workspaceService';
export type { AuditAction } from './auditService';