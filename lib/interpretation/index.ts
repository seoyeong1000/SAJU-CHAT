/**
 * 사주 해석 모듈
 *
 * @module interpretation
 */

export {
  buildLogicKey,
  buildLogicKeyFromHangul,
  getInterpretationByLogicKey,
  getDayPillarInterpretation,
  getAllPillarInterpretations,
} from './lookup'

export type {
  InterpretationSections,
  InterpretationBase,
  InterpretationResult,
} from './lookup'
