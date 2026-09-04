import { NormalizedInboundMessage, OrchestrationResponse } from '../types/index.js';
export declare class ConversationOrchestrator {
    processInboundMessage(inbound: NormalizedInboundMessage): Promise<OrchestrationResponse | null>;
}
export declare const orchestrator: ConversationOrchestrator;
