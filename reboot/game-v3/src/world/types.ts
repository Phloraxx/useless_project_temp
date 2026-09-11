export type ChunkFamilyId='town-high-street'|'residential-ribbon'|'tea-stop'|'market-junction'|'paddy-open'|'bridge-green';
export type SocketKind='traffic'|'pedestrian'|'busStop'|'shop'|'encounter'|'camera'|'audio';
export type PropKind='house'|'shop'|'teaShop'|'wall'|'gate'|'pole'|'palm'|'banana'|'jackfruit'|'auto'|'bike'|'shelter'|'tarp'|'corrugated'|'paddy'|'marketStall'|'bridgeRail'|'canal'|'poster'|'sign'|'drainCover'|'parkedCar';
export type QualityTier='HIGH'|'MEDIUM'|'LOW';
export interface PathPoint{x:number;z:number}
export interface SpawnSocket{id:string;kind:SocketKind;x:number;z:number;heading?:number;tags?:string[];radius?:number}
export interface WorldProp{id:string;kind:PropKind;x:number;z:number;y?:number;heading?:number;scale?:number;variant?:number;label?:string;side?:'left'|'right'|'both';importance?:'hero'|'identity'|'decor'}
export interface ChunkDefinition{id:string;family:ChunkFamilyId;name:string;path:PathPoint[];length:number;roadWidth:number;shoulderWidth:number;density:'dense'|'medium'|'open';tags:string[];weight:number;props:WorldProp[];sockets:SpawnSocket[];paletteVariant:number}
export interface GlobalPose{x:number;z:number;heading:number}
export interface ChunkInstance{poolId:number;sequenceIndex:number;definition:ChunkDefinition;startDistance:number;endDistance:number;startPose:GlobalPose;endPose:GlobalPose}
export interface RenderChunkInstance extends ChunkInstance{renderX:number;renderZ:number}
export interface WorldSnapshot{seed:string;logicalDistance:number;playerGlobal:GlobalPose;playerRender:GlobalPose;originGlobal:{x:number;z:number};originEpoch:number;rebases:number;chunks:RenderChunkInstance[];activeCount:number;pooledCount:number;generatedCount:number}