import { ConversationState } from '../types/index.js';
export declare const VALID_TRANSITIONS: Record<ConversationState, ConversationState[]>;
export declare class ConversationStateMachine {
    static canTransition(current: ConversationState, target: ConversationState): boolean;
    static assertValidTransition(current: ConversationState, target: ConversationState): void;
}
